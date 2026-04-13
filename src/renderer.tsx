import React from 'react';
import ReactDOM from 'react-dom/client';
import * as ROSLIB from 'roslib';
import App from './components/App';
import { AppStoreProvider } from './store/appStore';
import './index.css';

// Enable debug diagnostics
import './debug/meshDiagnostics';

declare global {
  interface Window {
    ROSLIB: unknown;
    meshDiagnostics?: unknown;
  }
}

// Provide ROSLIB from bundled npm dependency (works offline and in packaged app).
window.ROSLIB = ROSLIB;

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <AppStoreProvider>
      <App />
    </AppStoreProvider>
  </React.StrictMode>
);
