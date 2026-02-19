/// <reference types="vite/client" />
import axios from 'axios';

// 🔥 URL DO BACKEND EM PRODUÇÃO
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pricemind.onrender.com/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔥 INTERCEPTOR PARA ADICIONAR TOKEN EM TODAS AS REQUISIÇÕES
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// 🔥 INTERCEPTOR PARA TRATAR ERROS GLOBALMENTE
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log de erro para debug
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });

    // Se token expirou, redireciona para login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;