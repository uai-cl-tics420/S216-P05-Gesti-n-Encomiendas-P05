/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from "./App";
import { LanguageProvider } from './context/LanguageContext';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      {/* EL PROVIDER DEBE ESTAR AQUÍ */}
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </React.StrictMode>
  );
}