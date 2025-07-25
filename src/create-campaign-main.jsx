// src/create-campaign-main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import IsolatedCreateCampaign from './pages/IsolatedCreateCampaign';

// Renderiza o componente isolado na raiz do iframe
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <IsolatedCreateCampaign />
    </React.StrictMode>
);
