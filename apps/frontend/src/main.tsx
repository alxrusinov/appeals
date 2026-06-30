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

// Функция безопасного включения мокирования
async function enableMocking() {
  // Включаем MSW только локально. На проде (production) функция сразу завершается
  if (import.meta.env.PROD) {
    return;
  }

  const { worker } = await import('./mocks/browser');

  // start() возвращает Promise. onUnhandledRequest: 'bypass' глушит варнинги о запросах к ассетам Vite
  return worker.start({
    onUnhandledRequest: 'bypass',
  });
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
})
