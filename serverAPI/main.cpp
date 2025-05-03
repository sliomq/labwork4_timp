#include "RESTAPI.h"

void connectToBD(json& config);

int main(){
    ifstream config_file("configDB.json");
    if(!config_file.is_open()) {
        cerr << "Конфигурационный файл не найден" << endl;
        return 1;
    }
    json conf;
    config_file >> conf;

    connectToBD(conf);

    return 0;
}

void connectToBD(json& config) {
    try { //подключение к базе
        string dbname = config["dbname"], user = config["user"], password = config["password"], database_ip = config["database_ip"];
        int port = config["database_port"];

        connection baseData("dbname=" + dbname + " user=" + user + " password=" + password + " host=" + database_ip + " port=" + to_string(port)); //подкл к БД

        if(baseData.is_open()) {
            cout << "Connection successfully to basedata" << endl;
        }else {
            return;
        }

        startServer(baseData);

        baseData.close();
    } catch (const exception &e) {
        cerr << e.what() << endl;
    }
}
