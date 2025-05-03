import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

const Home = () => {
  // Состояния данных
  const [dataExtin, setDataExtin] = useState([]);
  const [dataSensors, setDataSensors] = useState([]);
  const isAuth = localStorage.getItem('isAuth');
  const navigate = useNavigate();

  // Состояния для пагинации
  const [currentPageExtin, setCurrentPageExtin] = useState(1);
  const [currentPageSensors, setCurrentPageSensors] = useState(1);
  const [itemsPerPage] = useState(3);

  // Состояния для фильтров
  const [filters, setFilters] = useState({
    extinguisherName: '',
    sensorName: '',
    minVolume: '',
    maxVolume: '',
    minRadius: '',
    maxRadius: ''
  });

  // Загрузка данных
  const loadData = async () => {
    try {
      const [extinguishers, sensors] = await Promise.all([
        axios.get("http://localhost:5000/extinguisher"),
        axios.get("http://localhost:5000/sensors")
      ]);
      
      setDataExtin(extinguishers.data || []);
      setDataSensors(sensors.data || []);
    } catch (error) {
      console.error("Ошибка запроса:", error);
    }
  };

  // Фильтрация данных
  const filterData = (data, type) => {
    return data.filter(item => {
      if (type === 'extinguisher') {
        return (
          item.name.toLowerCase().includes(filters.extinguisherName.toLowerCase()) &&
          (filters.minVolume === '' || item.volume >= Number(filters.minVolume)) &&
          (filters.maxVolume === '' || item.volume <= Number(filters.maxVolume))
        );
      } else {
        return (
          item.name.toLowerCase().includes(filters.sensorName.toLowerCase()) &&
          (filters.minRadius === '' || item.radius >= Number(filters.minRadius)) &&
          (filters.maxRadius === '' || item.radius <= Number(filters.maxRadius))
        );
      }
    });
  };

  // Пагинация данных
  const getPaginatedData = (data, currentPage) => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return {
      currentItems: data.slice(indexOfFirstItem, indexOfLastItem),
      totalPages: Math.ceil(data.length / itemsPerPage)
    };
  };

  // Обработчик изменения фильтров
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Сброс пагинации при изменении фильтров
    if (name.includes('extinguisher')) {
      setCurrentPageExtin(1);
    } else {
      setCurrentPageSensors(1);
    }
  };

  // Применение фильтров при загрузке данных
  useEffect(() => {
    if (!isAuth) {
      navigate('/');
      return;
    }
    loadData();
  }, [isAuth, navigate]);

  // Получение отфильтрованных и пагинированных данных
  const filteredExtin = filterData(dataExtin, 'extinguisher');
  const filteredSensors = filterData(dataSensors, 'sensor');
  
  const paginatedExtin = getPaginatedData(filteredExtin, currentPageExtin);
  const paginatedSensors = getPaginatedData(filteredSensors, currentPageSensors);

  const deleteItem = async (id, dataType) => { //удаление 
    let token = localStorage.getItem('access_token');
    let refresh_token = localStorage.getItem('refresh_token');

    try {
      const responseDelete = await axios.delete(`http://localhost:5000/${dataType}/${id}`, {
        data: { token: token }, // Отправляем токен в теле запроса с ключом 'token'
        headers: {
          'Content-Type': 'application/json' // Указываем тип содержимого
        }
      });

      if (responseDelete.status === 200) {
        // Успешное удаление
        loadData();
        return;
      }

    } catch (error) {
      if (error.response && error.response.status === 401) {
        try {
          const responseUpdateToken = await axios.post(`http://localhost:5000/refresh`, {
            refresh_token: refresh_token // Отправляем refresh_token в теле запроса с ключом 'refresh_token'
          }, {
            headers: {
              'Content-Type': 'application/json' // Указываем тип содержимого
            }
          });

          if (responseUpdateToken.status === 200) {
            localStorage.setItem('access_token', responseUpdateToken.data.access_token);
            token = responseUpdateToken.data.access_token;
            // Повторяем запрос удаления с новым токеном
            await deleteItem(id, dataType);
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
        console.error("Ошибка удаления:", error);
      }
    }
  };

  const handleLogout = () => { //разлогирование
    localStorage.clear(); // Очищаем весь localStorage
    navigate('/'); // Перенаправляем на страницу входа
  };

  return (
    <div className="home">
      <h1>Список активов предприятия</h1>
  
      {/* Фильтры для огнетушителей */}
      <div className="filters">
        <h2>Огнетушители</h2>
        <div className="filters-inputs">
          <input
            type="text"
            name="extinguisherName"
            placeholder="Название"
            value={filters.extinguisherName}
            onChange={handleFilterChange}
          />
          <input
            type="number"
            name="minVolume"
            placeholder="Мин. объем"
            value={filters.minVolume}
            onChange={handleFilterChange}
            min="1"
          />
          <input
            type="number"
            name="maxVolume"
            placeholder="Макс. объем"
            value={filters.maxVolume}
            onChange={handleFilterChange}
            min="1"
          />
        </div>
      </div>
  
      {paginatedExtin.currentItems.length === 0 ? (
        <h4>Огнетушители не обнаружены</h4>
      ) : (
        <>
          <ul>
            {paginatedExtin.currentItems.map(item => (
              <li key={item.extinguisher_id}>
                <Link to={`/detail/extinguisher/${item.extinguisher_id}`}>
                  {item.name} (Объем: {item.volume})
                </Link>
                <button onClick={() => deleteItem(item.extinguisher_id, 'extinguisher')}>
                  Удалить
                </button>
              </li>
            ))}
          </ul>
          <div className="pagination">
            <button
              onClick={() => setCurrentPageExtin(p => Math.max(p - 1, 1))}
              disabled={currentPageExtin === 1}
            >
              Назад
            </button>
            <span>Страница {currentPageExtin} из {paginatedExtin.totalPages}</span>
            <button
              onClick={() => setCurrentPageExtin(p => p + 1)}
              disabled={currentPageExtin >= paginatedExtin.totalPages}
            >
              Вперед
            </button>
          </div>
        </>
      )}
  
      {/* Фильтры для датчиков */}
      <div className="filters">
        <h2>Датчики</h2>
        <div className="filters-inputs">
          <input
            type="text"
            name="sensorName"
            placeholder="Название"
            value={filters.sensorName}
            onChange={handleFilterChange}
          />
          <input
            type="number"
            name="minRadius"
            placeholder="Мин. радиус"
            value={filters.minRadius}
            onChange={handleFilterChange}
            min="1"
          />
          <input
            type="number"
            name="maxRadius"
            placeholder="Макс. радиус"
            value={filters.maxRadius}
            onChange={handleFilterChange}
            min="1"
          />
        </div>
      </div>
  
      {/* Список датчиков */}
      {paginatedSensors.currentItems.length === 0 ? (
        <h4>Датчики не обнаружены</h4>
      ) : (
        <>
          <ul>
            {paginatedSensors.currentItems.map(item => (
              <li key={item.sensor_id}>
                <Link to={`/detail/sensors/${item.sensor_id}`}>
                  {item.name} (Радиус: {item.radius})
                </Link>
                <button onClick={() => deleteItem(item.sensor_id, 'sensors')}>
                  Удалить
                </button>
              </li>
            ))}
          </ul>
          <div className="pagination">
            <button
              onClick={() => setCurrentPageSensors(p => Math.max(p - 1, 1))}
              disabled={currentPageSensors === 1}
            >
              Назад
            </button>
            <span>Страница {currentPageSensors} из {paginatedSensors.totalPages}</span>
            <button
              onClick={() => setCurrentPageSensors(p => p + 1)}
              disabled={currentPageSensors >= paginatedSensors.totalPages}
            >
              Вперед
            </button>
          </div>
        </>
      )}
  
      <Link to="/add" className="add-product-link">
        Добавить актив
      </Link>
      <button onClick={handleLogout} className='exit-button'>
        Выход
      </button>
    </div>
  );
};

export default Home;