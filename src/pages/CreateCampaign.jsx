// leadsflow-dev/src/pages/CreateCampaign.jsx

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';

const CreateCampaignHost = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data.type === 'campaign-launched') {
                setTimeout(() => {
                    navigate('/campaigns');
                }, 200);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [navigate]);

    const token = localStorage.getItem('leadflow_token');
    // Pega a URL da API do ambiente do frontend
    const apiUrl = import.meta.env.VITE_API_URL; 
    
    // ===== MUDANÇA AQUI: Adiciona a apiUrl como um parâmetro na URL do iframe =====
    const iframeSrc = token && apiUrl 
        ? `/create-campaign.html?token=${token}&apiUrl=${encodeURIComponent(apiUrl)}` 
        : '/login';

    if (!token || !apiUrl) {
        useEffect(() => { navigate('/login'); }, [navigate]);
        return <p>Autenticação ou configuração de API ausente. Redirecionando...</p>;
    }

    return (
        <>
            <Helmet>
                <title>Criar Nova Campanha - LeadFlow (Dev)</title>
            </Helmet>
            <div style={{ height: 'calc(100vh - 65px)', width: '100%' }}>
                <iframe
                    src={iframeSrc}
                    style={{ border: 'none', width: '100%', height: '100%' }}
                    title="Criar Campanha"
                />
            </div>
        </>
    );
};

export default CreateCampaignHost;