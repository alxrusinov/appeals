import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { queryClient } from './services/queryClient';

// Импорт стилей PrimeReact (обязательно в главном файле)
// Тема (lara-light-green) подключается один раз в App.tsx — если продублировать её
// здесь другой темой (было lara-light-indigo), их CSS-правила конфликтуют и, например,
// бордер у инпутов пропадает.
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
  </React.StrictMode>,
);
