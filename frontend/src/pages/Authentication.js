import React, { useState} from "react";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './RegAndAuth.css'

const Login = () => {
    const [login, setLogin] = useState('');
    const [pswd, setPswd] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async(e) => {
        e.preventDefault();
        try {
            const response = await axios.get(
                `http://localhost:5000/login?login=${encodeURIComponent(login)}&pswd=${encodeURIComponent(pswd)}`,
                {
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );
    
            if (response.data.success) {
                localStorage.setItem('access_token', response.data.access_token);
                localStorage.setItem('refresh_token', response.data.refresh_token);
                localStorage.setItem('isAuth', 'true');
                navigate('/home');
            } else {
                setError(response.data.error || 'Неверный логин или пароль');
            }
        } catch (error) {
            if (error.response) {
                // Сервер ответил с ошибкой 4xx/5xx
                try {
                    const errorData = JSON.parse(error.response.data);
                    setError(errorData.error || 'Ошибка входа');
                } catch {
                    setError('Ошибка входа');
                }
            } else {
                setError('Не удалось подключиться к серверу');
            }
            console.error('Ошибка входа:', error);
        }
    };

    return (
        <div className="auth-container">
            <h2>Вход</h2>
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
                <button type="submit">Войти</button>
            </form>
            <p>
                Нет аккаунта? <a href="/reg">Зарегистрируйтесь</a>
            </p>
        </div>
    );
};

export default Login;
