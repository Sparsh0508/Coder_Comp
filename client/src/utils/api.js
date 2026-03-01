import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8081/api', // Point to base /api
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor for adding token to headers
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
