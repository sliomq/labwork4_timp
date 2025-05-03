import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './RegAndAuth.css'

const Register = () => {
    const [login, setLogin] = useState('');
    const [pswd, setPswd] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Проверяем, существует ли пользователь с таким логином
            const checkUser = await axios.get(`http://localhost:5000/loginReg?login=${login}`);
            if (checkUser.status === 401) {
                setError('Пользователь с таким логином уже существует');
                return;
            }else if(checkUser.status === 400) {
                setError('Ошибка в передаче логина для проверки');
                return;
            }

            // Если пользователь не существует, добавляем его
            const response = await axios.post('http://localhost:5000/login', {
                login,
                pswd,
            });

            if (response.status === 201) { // 201 - Created
                navigate('/'); // Переход на страницу входа после успешной регистрации
            } else {
                setError('Ошибка при регистрации');
            }
        } catch (error) {
            setError('Ошибка при регистрации');
            console.error("Ошибка регистрации:", error.response ? error.response.data : error.message);
        }
    };

    return (
        <div className="auth-container">
            <h2>Регистрация</h2>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <label>
                    Логин:
                    <input
                        type="text"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        required
                    />
                </label>
                <br />
                <label>
                    Пароль:
                    <input
                        type="password"
                        value={pswd}
                        onChange={(e) => setPswd(e.target.value)}
                        required
                    />
                </label>
                <br />
                <button type="submit">Зарегистрироваться</button>
            </form>
            <p>
                Уже есть аккаунт? <a href="/">Войдите</a>
            </p>
        </div>
    );
};

export default Register;