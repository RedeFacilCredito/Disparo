import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export const useData = () => {
    return useContext(DataContext);
};

export const DataProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [campaigns, setCampaigns] = useState([]);
    const [audiences, setAudiences] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Função genérica para buscar dados com autenticação
    const fetchData = async (endpoint, setter) => {
        try {
            const token = localStorage.getItem('leadflow_token');
            if (!token) {
                // Não tenta buscar se não houver token.
                return;
            }
            
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/${endpoint}`, {
                headers: {
                    // ===== CORREÇÃO PRINCIPAL AQUI =====
                    // Adiciona o cabeçalho de autorização em todas as chamadas
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Falha ao buscar ${endpoint}`);
            }
            const data = await response.json();
            setter(data);
        } catch (err) {
            console.error(`Erro ao buscar ${endpoint}:`, err.message);
            setError(err.message);
        }
    };

    // Função para deletar uma audiência
    const deleteAudience = async (id) => {
        try {
            const token = localStorage.getItem('leadflow_token');
            await fetch(`${import.meta.env.VITE_API_URL}/api/audiences/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            // Atualiza o estado local para refletir a exclusão imediatamente
            setAudiences(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            console.error("Erro ao deletar audiência:", err);
        }
    };

    // Função para deletar uma campanha
    const deleteCampaign = async (id) => {
        try {
             const token = localStorage.getItem('leadflow_token');
            await fetch(`${import.meta.env.VITE_API_URL}/api/campaigns/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            fetchData('campaigns', setCampaigns); // Recarrega a lista
        } catch (err) {
             console.error("Erro ao deletar campanha:", err);
        }
    };

    // Efeito para buscar todos os dados quando o usuário se autentica
    useEffect(() => {
        const fetchAllData = async () => {
            if (isAuthenticated) {
                setLoading(true);
                await Promise.all([
                    fetchData('campaigns', setCampaigns),
                    fetchData('audiences', setAudiences),
                    fetchData('templates', setTemplates)
                ]);
                setLoading(false);
            } else {
                // Limpa os dados se o usuário fizer logout
                setCampaigns([]);
                setAudiences([]);
                setTemplates([]);
                setLoading(false);
            }
        };
        
        fetchAllData();
    }, [isAuthenticated]);
    
    const value = {
        campaigns,
        audiences,
        templates,
        loading,
        error,
        fetchCampaigns: () => fetchData('campaigns', setCampaigns),
        fetchAudiences: () => fetchData('audiences', setAudiences),
        fetchTemplates: () => fetchData('templates', setTemplates),
        deleteAudience,
        deleteCampaign
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};