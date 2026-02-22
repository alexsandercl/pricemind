/// <reference types="vite/client" />
import axios from 'axios';

// 🔥 URL DO BACKEND EM PRODUÇÃO
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pricemind.onrender.com/api';

console.log('🔧 API configurada:', API_BASE_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000, // 90 segundos (Render free tier pode levar até 60s para acordar do spin down)
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
  
  console.log('📤 Requisição:', config.method?.toUpperCase(), config.url);
  
  return config;
});

// 🔥 INTERCEPTOR PARA TRATAR ERROS GLOBALMENTE
api.interceptors.response.use(
  (response) => {
    console.log('✅ Resposta recebida:', response.config.url, response.status);
    return response;
  },
  (error) => {
    // Log de erro para debug
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      timeout: error.code === 'ECONNABORTED' ? 'Timeout excedido' : null
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