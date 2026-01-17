// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ScrollToTop from './components/ScrollToTop'
import PopupPromo from './components/PopupPromo/PopupPromo'
import './styles/reset.css'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
    <ScrollToTop />
      <App />
      <PopupPromo />
    </BrowserRouter>
  </React.StrictMode>
);
