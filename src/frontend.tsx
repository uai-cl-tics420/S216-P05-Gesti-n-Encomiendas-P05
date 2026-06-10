import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from "./App";
import TypesafeI18n from './i18n/i18n-react.js';
import { loadAllLocales } from './i18n/i18n-util.sync.js';

loadAllLocales();

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <TypesafeI18n locale="es">
        <App />
      </TypesafeI18n>
    </React.StrictMode>
  );
}