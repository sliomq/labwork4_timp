import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Detail.css';

const Detail = () => {
    const { id, type } = useParams();
    const navigate = useNavigate();
    const [itemData, setItemData] = useState(null);
    const [loading, setLoading] = useState(true);
    const nameRef = useRef();
    const paramRef = useRef();
    const isAuth = localStorage.getItem('isAuth');

    useEffect(() => {
        if (!isAuth) {
          navigate('/'); // Перенаправляем если не авторизован
          return;
        }
    });
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/${type}/${id}`);
                setItemData(response.data);
                console.log('Получены данные:', response.data);
            } catch (error) {
                console.error('Ошибка загрузки:', error);
                alert('Не удалось загрузить данные');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, type]);

    useEffect(() => {
        if (itemData && nameRef.current && paramRef.current) {
            nameRef.current.value = itemData.name || '';
            paramRef.current.value = type === 'sensors' 
                ? itemData.radius || '' 
                : itemData.volume || '';
        }
    }, [itemData, type]);

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        let token = localStorage.getItem('access_token');
        let refresh_token = localStorage.getItem('refresh_token');
    
        const updatedData = {
            name: nameRef.current.value,
            [type === 'sensors' ? 'radius' : 'volume']: Number(paramRef.current.value),
            token: token
        };
    
        try {
            const responsePut = await axios.put(`http://localhost:5000/${type}/${id}`, updatedData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Передаем токен в заголовке Authorization
                }
            });
            if(responsePut.status === 200){
                alert('Данные успешно обновлены!');
                navigate('/home');
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                try {
                    const responseUpdateToken = await axios.post(`http://localhost:5000/refresh`, {
                        refresh_token: refresh_token
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
    
                    if (responseUpdateToken.status === 200) {
                        localStorage.setItem('access_token', responseUpdateToken.data.access_token);
                        token = responseUpdateToken.data.access_token;
                        // Повторяем запрос обновления с новым токеном
                        await handleSubmit(e);
                    } else {
                        localStorage.removeItem('isAuth');
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                        navigate('/');
                    }
                } catch (refreshError) {
                    console.error("Ошибка обновления токена:", refreshError);
                    localStorage.removeItem('isAuth');
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    navigate('/');
                }
            } else {
                console.error("Ошибка обновления:", error);
                alert(`Ошибка: ${error.response?.data?.error || error.message}`);
            }
        }
    };
    

    if (loading) {
        return <div>Загрузка данных...</div>;
    }

    if (!itemData) {
        return <div>Данные не найдены</div>;
    }

    return (
        <div className="detail-container">
            <h1>Редактирование {type === 'extinguisher' ? 'огнетушителя' : 'датчика'}</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Название:
                    <input type="text" ref={nameRef} required />
                </label>
                <br />
                <label>
                    {type === 'sensors' ? 'Радиус:' : 'Объем:'}
                    <input 
                        type="number" 
                        ref={paramRef} 
                        required 
                        min="1"
                    />
                </label>
                <br />
                <button type="submit">Сохранить</button>
            </form>
        </div>
    );
};

export default Detail;