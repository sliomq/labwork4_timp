#include "RESTAPI.h"

string sha256(const string& str) {
    unsigned char hash[SHA256_DIGEST_LENGTH];

    SHA256_CTX sha256;
    SHA256_Init(&sha256);
    SHA256_Update(&sha256, str.c_str(), str.size());
    SHA256_Final(hash, &sha256);

    stringstream ss;

    for(int i = 0; i < SHA256_DIGEST_LENGTH; i++) {
        ss << hex << setw(2) << setfill('0') << static_cast<int>(hash[i]);
    }

    return ss.str();
}

const string secretKey = "zayakinAB320";

string createAccessToken(const string& login) {
    auto token = jwt::create()
        .set_issuer("auth_server")
        .set_type("JWT")
        .set_payload_claim("login", jwt::claim(login))
        .set_expires_at(chrono::system_clock::now() + chrono::minutes(15))
        .sign(jwt::algorithm::hs256{secretKey});
    return token;
}

string createRefreshToken(const string& login) {
    auto token = jwt::create()
        .set_issuer("auth_server")
        .set_type("JWT")
        .set_payload_claim("login", jwt::claim(login))
        .set_expires_at(chrono::system_clock::now() + chrono::hours(24))
        .sign(jwt::algorithm::hs256{secretKey});
    return token;
}

bool verifyToken(const string& token) {
    try {
        auto decoded = jwt::decode(token);

        // 1. Проверка подписи
        auto verifier = jwt::verify()
            .allow_algorithm(jwt::algorithm::hs256{secretKey})
            .with_issuer("auth_server");
        verifier.verify(decoded);

        // 2. Проверка времени истечения
        if (decoded.has_payload_claim("exp")) {
            // Получаем claim и преобразуем в std::time_t
            auto exp_claim = decoded.get_payload_claim("exp");
            std::time_t exp_time = static_cast<std::time_t>(exp_claim.to_json().get<int64_t>());

            // Сравнение с текущим временем
            auto now = std::chrono::system_clock::now();
            auto exp_point = std::chrono::system_clock::from_time_t(exp_time);

            if (now > exp_point) {
                return false; // Токен просрочен
            }
        } else {
            cerr << "Token missing 'exp' claim" << endl;
            return false;
        }

        return true;
    } catch (const exception& e) {
        cerr << "Token verification error: " << e.what() << endl;
        return false;
    }
}

int startServer(pqxx::connection& conn) {
    // 1. Создаем приложение с CORS middleware
    crow::App<crow::CORSHandler> app;

    // 2. Настраиваем CORS политику
    auto& cors = app.get_middleware<crow::CORSHandler>();
    cors
      .global()
      .headers("Content-Type", "Authorization")
      .methods("POST"_method, "GET"_method, "PUT"_method, "DELETE"_method, "OPTIONS"_method)
      .origin("*");

    CROW_ROUTE(app, "/login") //проверка входа
      ([&conn](const crow::request& req) {
          crow::response res;
        res.add_header("Content-Type", "application/json");

        if (!req.url_params.get("login") || !req.url_params.get("pswd")) {
            res.code = 400;
            res.body = "{\"error\":\"Missing login or password\"}";
            return res;
        }

        try {
            string login = req.url_params.get("login");
            string pswd = req.url_params.get("pswd");
            string hash_pswd = sha256(pswd);

            string sqlRequest = "select check_login('" + login + "', '" + hash_pswd + "');";
            result resBD;
            {
                nontransaction nontrans(conn);
                resBD = nontrans.exec(sqlRequest);
            }

            string responseFromDB = resBD[0][0].as<string>();
            if(responseFromDB == "t") {
                string accessToken = createAccessToken(login);
                string refreshToken = createRefreshToken(login);
                json token = {
                    {"success", true},
                    {"access_token", accessToken},
                    {"refresh_token", refreshToken}
                };
                res.body = token.dump();
            } else {
                res.code = 401;
                res.body = "{\"error\":\"Invalid login or password\"}";
            }
        } catch (const std::exception& e) {
            res.code = 500;
            res.body = "{\"error\":\"Database error\"}";
        }

        return res;
    });

    CROW_ROUTE(app, "/refresh")
    .methods("POST"_method)
    ([](const crow::request& req) {
        crow::response res;
        res.add_header("Content-Type", "application/json");
        res.add_header("Access-Control-Allow-Origin", "*");

        auto body = json::parse(req.body);
        string refreshToken = body["refresh_token"];
        if (verifyToken(refreshToken)) {
            auto decoded = jwt::decode(refreshToken);
            string login = decoded.get_payload_claim("login").as_string();
            string accessToken = createAccessToken(login);
            json response = {{"access_token", accessToken}};
            res.body = response.dump();
            res.code = 200;
        } else {
            json response = {{"error", "Invalid refresh token"}};
            res.body = response.dump();
            res.code = 401;
        }
        return res;
    });

    // Проверка логина
    CROW_ROUTE(app, "/loginReg")
    .methods("GET"_method)
    ([&conn](const crow::request& req){
        crow::response res;
        res.add_header("Content-Type", "application/json");
        res.add_header("Access-Control-Allow-Origin", "*");

        if (!req.url_params.get("login")) {
            json response = {{"error", "Missing login for check"}};
            res.body = response.dump();
            res.code = 400;
            return res;
        }

        string login = req.url_params.get("login");
        string sqlReq = "select * from authentication where login = '" + login + "'";
        result resBD;
        {
            nontransaction nontrans(conn);
            resBD = nontrans.exec(sqlReq);
        }

        if(resBD.empty()) {
            res.code = 200;
        } else {
            json response = {{"error", "login is exists"}};
            res.body = response.dump();
            res.code = 401;
        }
        return res;
    });

    // Логин
    CROW_ROUTE(app, "/login")
    .methods("POST"_method)
    ([&conn](const crow::request& req) {
        crow::response res;
        res.add_header("Content-Type", "application/json");
        res.add_header("Access-Control-Allow-Origin", "*");

        auto body = json::parse(req.body);
        string login = body["login"], pswd = body["pswd"];
        string hash_pswd = sha256(pswd);

        string sqlReq = "insert into authentication(login, pswd) values('" + login + "', '" + hash_pswd + "')";
        work inserUser(conn, sqlReq);
        inserUser.exec(sqlReq);
        inserUser.commit();

        json response = {{"status", "success"}};
        res.body = response.dump();
        res.code = 201;
        return res;
    });

    // Огнетушители
    CROW_ROUTE(app, "/extinguisher")
    .methods("GET"_method)
    ([&conn](const crow::request& req) {
        crow::response res;
        res.add_header("Content-Type", "application/json");
        res.add_header("Access-Control-Allow-Origin", "*");

        string sqlRequest = "select * from extinguisher";
        result resBD;
        {
            nontransaction nontrans(conn);
            resBD = nontrans.exec(sqlRequest);
        }

        json response = json::array();
        for(int i = 0; i < resBD.size(); i++) {
            json item = {
                {"extinguisher_id", resBD[i][0].as<int>()},
                {"name", resBD[i][1].as<string>()},
                {"volume", resBD[i][2].as<int>()},
            };
            response.push_back(item);
        }

        res.body = response.dump();
        res.code = 200;
        return res;
    });

    // Датчики
    CROW_ROUTE(app, "/sensors")
    .methods("GET"_method)
    ([&conn](const crow::request& req) {
        crow::response res;
        res.add_header("Content-Type", "application/json");
        res.add_header("Access-Control-Allow-Origin", "*");

        string sqlRequest = "select * from sensors";
        result resBD;
        {
            nontransaction nontrans(conn);
            resBD = nontrans.exec(sqlRequest);
        }

        json response = json::array();
        for(int i = 0; i < resBD.size(); i++) {
            json item = {
                {"sensor_id", resBD[i][0].as<int>()},
                {"name", resBD[i][1].as<string>()},
                {"radius", resBD[i][2].as<int>()}
            };
            response.push_back(item);
        }

        res.body = response.dump();
        res.code = 200;
        return res;
    });

    // Удаление
    CROW_ROUTE(app, "/<string>/<int>")
    .methods("DELETE"_method)
    ([&conn](const crow::request& req, string dataType, int id) {
        crow::response res;
        res.add_header("Content-Type", "application/json");
        res.add_header("Access-Control-Allow-Origin", "*");

        auto body = json::parse(req.body);
        string token = body["token"];
        if(!verifyToken(token)) {
            json response = {"error","Unauthentication"};
            res.code = 401;
            res.body = response.dump();
            return res;
        }

        string id_type = (dataType == "extinguisher") ? "extinguisher_id" : "sensor_id";
        string sqlRequest = "delete from " + dataType + " where " + id_type + " = " + to_string(id);

        try {
            work deleteType(conn, sqlRequest);
            deleteType.exec(sqlRequest);
            deleteType.commit();

            json response = {
                {"status", "success"},
                {"message", "Deleted " + dataType + " with id " + to_string(id)}
            };
            res.body = response.dump();
            res.code = 200;
        } catch(exception error) {
            json response = {{"error", "Not Found"}};
            res.body = response.dump();
            res.code = 404;
        }

        return res;
    });

    CROW_ROUTE(app, "/<string>/<int>")(
        [&conn](const crow::request& req, string dataType, int id) {
            crow::response res;
            res.add_header("Content-Type", "application/json");
            res.add_header("Access-Control-Allow-Origin", "*");
        
            string id_type;
            (dataType == "extinguisher") ? (id_type = "extinguisher_id") : (id_type = "sensor_id");
            string sqlRequest = "select * from " + dataType + " where " + id_type + " = " + to_string(id);
            result resBD;

            {
                nontransaction nontrans(conn);
                resBD = nontrans.exec(sqlRequest);
            }

            if(resBD.empty()) {
                json response = {"error", "Not Found"};
                res.body = response.dump();
                res.code = 404;
                return res;
            }

            string secondArg;
            (dataType == "extinguisher") ? (secondArg = "volume") : (secondArg = "radius");
            json response = {
                {id_type, resBD[0][0].as<int>()},
                {"name", resBD[0][1].as<string>()},
                {secondArg, resBD[0][2].as<int>()}
            };

            res.body = response.dump();
            res.code = 200;
            return res;
    });

    CROW_ROUTE(app, "/<string>/<int>").methods("PUT"_method)(
        [&conn](const crow::request& req, string dataType, int id) {
            crow::response res;
            res.add_header("Content-Type", "application/json");
            res.add_header("Access-Control-Allow-Origin", "*");

            auto body = json::parse(req.body);
            string token = body["token"];
            if(!verifyToken(token)) {
                json response = {"error","Unauthentication"};
                res.code = 401;
                res.body = response.dump();
                return res;
            }

            string sqlReq, name = body["name"];
            if(dataType == "extinguisher") {
                sqlReq = "update extinguisher set name = '" + name + "', volume = " + to_string(body["volume"]) + " where extinguisher_id = " + to_string(id);
            }else if(dataType == "sensors") {
                sqlReq = "update sensors set name = '" + name + "', radius = " + to_string(body["radius"]) + " where sensor_id = " + to_string(id);
            }else {
                json response = {"error", "Not Found"};
                res.code = 404;
                res.body = response.dump();
                return res;
            }

            work updateAtrib(conn, sqlReq);
            updateAtrib.exec(sqlReq);
            updateAtrib.commit();

            json response = {"status", "succes"};

            res.body = response.dump();
            res.code = 200;
            return res;
    });

    // Добавление огнетушителя
    CROW_ROUTE(app, "/extinguisher")
    .methods("POST"_method)
    ([&conn](const crow::request& req) {
        crow::response res;
        res.add_header("Content-Type", "application/json");
        res.add_header("Access-Control-Allow-Origin", "*");

        auto body = json::parse(req.body);
        string token = body["token"];
        if(!verifyToken(token)) {
            json response = {"error","Unauthentication"};
            res.code = 401;
            res.body = response.dump();
            return res;
        }

        string sqlReq = "insert into extinguisher(name, volume) values('" +
                       body["name"].get<string>() + "', " +
                       to_string(body["volume"].get<int>()) + ")";

        try {
            work insertExtin(conn, sqlReq);
            insertExtin.exec(sqlReq);
            insertExtin.commit();

            json response = {{"status", "success"}};
            res.body = response.dump();
            res.code = 200;
        } catch(exception error) {
            json response = {{"error", "Syntax error"}};
            res.body = response.dump();
            res.code = 400;
        }

        return res;
    });

    CROW_ROUTE(app, "/sensors")
    .methods("POST"_method)
    ([&conn](const crow::request& req) {
        crow::response res;
        res.add_header("Content-Type", "application/json");
        res.add_header("Access-Control-Allow-Origin", "*");

        auto body = json::parse(req.body);
        string token = body["token"];
        if(!verifyToken(token)) {
            json response = {"error","Unauthentication"};
            res.code = 401;
            res.body = response.dump();
            return res;
        }

        string sqlReq = "insert into sensors(name, radius) values('" +
                       body["name"].get<string>() + "', " +
                       to_string(body["radius"].get<int>()) + ")";

        try {
            work insertExtin(conn, sqlReq);
            insertExtin.exec(sqlReq);
            insertExtin.commit();

            json response = {{"status", "success"}};
            res.body = response.dump();
            res.code = 200;
        } catch(exception error) {
            json response = {{"error", "Syntax error"}};
            res.body = response.dump();
            res.code = 400;
        }

        return res;
    });

    app.port(5000).run();
}
