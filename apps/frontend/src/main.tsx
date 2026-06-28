import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { queryClient } from './services/queryClient';

// Импорт стилей PrimeReact (обязательно в главном файле)
import 'primereact/resources/themes/lara-light-indigo/theme.css'; // Тема оформления
import 'primereact/resources/primereact.min.css';                 // Базовые стили компонентов
import 'primeicons/primeicons.css';                               // Пакет иконок
import './index.css';                                             // Твой Tailwind

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
