import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import { AppStoreProvider } from './store/appStore';
import './index.css';

// Load roslibjs from CDN
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/roslibjs/1.3.0/roslib.min.js';
script.async = true;
document.body.appendChild(script);

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <AppStoreProvider>
      <App />
    </AppStoreProvider>
  </React.StrictMode>
);
