import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// 🔥 INTERCEPTOR PARA ADICIONAR TOKEN EM TODAS AS REQUISIÇÕES
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});