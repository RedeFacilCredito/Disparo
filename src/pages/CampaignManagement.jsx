import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Plus, Eye, Trash2, Play, Smartphone, Globe } from 'lucide-react'; 
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext'; // <-- MUDANÇA 1: Adicionar este import
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";


const socket = io(import.meta.env.VITE_API_URL);

const CampaignManagement = () => {
    const navigate = useNavigate();
    const { campaigns, fetchCampaigns, deleteCampaign } = useData();
    const { toast } = useToast();
    const { user } = useAuth(); // <-- MUDANÇA 2: Chamar o useAuth() aqui no topo
    const [activeTab, setActiveTab] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const token = localStorage.getItem('leadflow_token');

    // ===== MUDANÇA 2: Adicionar estados para o modal e para o src do iframe =====
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [iframeSrc, setIframeSrc] = useState('');

    // ===== MUDANÇA 3: Adicionar listener para fechar o modal quando a campanha for criada =====
    useEffect(() => {
        const handleMessageFromIframe = (event) => {
            // Verifica se a mensagem é do tipo esperado, vinda do iframe
            if (event.data.type === 'campaign-launched') {
                toast({
                    title: "Campanha Criada!",
                    description: "Sua nova campanha foi salva como rascunho.",
                });
                setCreateModalOpen(false); // Fecha o modal
                if(fetchCampaigns) fetchCampaigns(); // Atualiza a lista de campanhas
            }
        };

        window.addEventListener('message', handleMessageFromIframe);

        // Função de limpeza para remover o listener quando o componente for desmontado
        return () => {
            window.removeEventListener('message', handleMessageFromIframe);
        };
    }, [fetchCampaigns, toast]); // Dependências do efeito

    useEffect(() => {
        if (campaigns) {
            setIsLoading(false);
        }
    }, [campaigns]);

    useEffect(() => {
    const handleStatusUpdate = (data) => {
            console.log('[Socket.IO] Recebido evento campaign_status_updated:', data);

            // Simplesmente chamamos a função para buscar os dados mais recentes.
            if (fetchCampaigns) {
                fetchCampaigns();
            }

            toast({
                title: `Campanha #${data.campaignId} Atualizada`,
                description: `Novo status: ${data.status}`,
            });
    };

        // Começa a escutar pelo evento
        socket.on('campaign_status_updated', handleStatusUpdate);

        // Função de limpeza: para de escutar quando o componente é desmontado
        return () => {
            socket.off('campaign_status_updated', handleStatusUpdate);
        };
    }, [toast]);

    const handleViewReportClick = (campaignId) => {
        // MUDANÇA 2: A função agora simplesmente USA a variável 'user' que já existe no escopo.
        // A linha "const { user } = useAuth();" foi REMOVIDA daqui.
        
        // Verifica se o usuário tem o cargo de ADMIN
        if (user?.role === 'ADMIN') {
            // Se for admin, navega para a página de relatório
            navigate(`/campaigns/${campaignId}/report`);
        } else {
            // Se não for, mostra o aviso de "em desenvolvimento"
            showNotImplementedToast();
        }
    };
    
    // ===== MUDANÇA 4: Criar função para abrir o modal de criação =====
    const handleOpenCreateModal = () => {
        const token = localStorage.getItem('leadflow_token');
        const apiUrl = import.meta.env.VITE_API_URL;

        if (!token || !apiUrl) {
            toast({
                title: "Erro de Configuração",
                description: "Token ou URL da API não encontrados. Faça login novamente.",
                variant: "destructive"
            });
            navigate('/login');
            return;
        }

        // Monta a URL para o iframe e a armazena no estado
        const src = `/create-campaign.html?token=${token}&apiUrl=${encodeURIComponent(apiUrl)}`;
        setIframeSrc(src);

        // Abre o modal
        setCreateModalOpen(true);
    };


    const showNotImplementedToast = () => {
        toast({
            title: "🚧 Funcionalidade em Desenvolvimento",
            description: "Esta ação será implementada em breve.",
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-500';
            case 'In Progress': return 'bg-blue-500';
            case 'Scheduled': return 'bg-yellow-500';
            case 'Draft': return 'bg-gray-500';
            case 'Error': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const filterCampaigns = (status) => {
        if (!campaigns) return [];
        if (status === 'all') return campaigns;
        return campaigns.filter(campaign => campaign.status && campaign.status.toLowerCase() === status.toLowerCase());
    };

    const handlePlayCampaign = async (id) => {
        if (!token) {
            toast({ title: "Erro de Autenticação", variant: "destructive" });
            return;
        }
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/campaigns/${id}/send-manual`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                toast({ title: 'Campanha Enviada', description: `Campanha #${id} marcada para envio.` });
                if(fetchCampaigns) fetchCampaigns();
            } else {
                const errorData = await response.json();
                toast({ title: 'Erro ao Enviar Campanha', description: errorData.error || 'Erro desconhecido.', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Erro de Rede', description: 'Não foi possível conectar ao servidor.', variant: 'destructive' });
        }
    };

    const handlePlayButtonClick = (campaign) => {
        if (campaign.status === 'Draft') {
            handlePlayCampaign(campaign.id);
        } else if (campaign.status === 'Scheduled') {
            toast({ title: 'Ação não permitida', description: 'Esta função é apenas para campanhas em rascunho.', variant: 'destructive' });
        }
    };

    const handleDeleteCampaign = async (campaignId) => {
        if (deleteCampaign) {
            await deleteCampaign(campaignId);
            toast({ title: "Campanha deletada com sucesso!" });
        }
    };

    const CampaignTable = ({ campaignList }) => (
        <Table>
            <TableHeader>
                <TableRow className="border-white/20 hover:bg-transparent">
                    <TableHead className="text-gray-300">Campanha</TableHead>
                    <TableHead className="text-gray-300">Canal</TableHead>
                    <TableHead className="text-gray-300">Público</TableHead>
                    <TableHead className="text-gray-300">Modelo</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-right pr-6">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {campaignList && campaignList.map((campaign) => (
                    <TableRow key={campaign.id} className="border-white/20">
                        <TableCell className="font-medium text-white">{campaign.name}</TableCell>
                        <TableCell>
                            {campaign.senderType === 'BAILEYS' ? (
                                <div className="flex items-center gap-2" title="API Não-Oficial (Baileys)">
                                    <Smartphone className="h-4 w-4 text-blue-400" />
                                </div>
                            ) : (
                                <div className="flex items-center gap-2" title="API Oficial (Gupshup)">
                                    <Globe className="h-4 w-4 text-green-400" />
                                </div>
                            )}
                        </TableCell>
                        <TableCell className="text-gray-300">{campaign.audience?.name || 'N/A'}</TableCell>
                        <TableCell className="text-gray-300">{campaign.template?.name || 'N/A'}</TableCell>
                        <TableCell><Badge className={`${getStatusColor(campaign.status)} text-white`}>{campaign.status}</Badge></TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                                <Button variant="ghost" size="icon" className="text-blue-400 hover:text-blue-300" onClick={() => handleViewReportClick(campaign.id)}><Eye className="h-4 w-4" /></Button>
                                {(campaign.status === 'Draft' || campaign.status === 'Scheduled') && (
                                    <Button variant="ghost" size="icon" className="text-green-400 hover:text-green-300" onClick={() => handlePlayButtonClick(campaign)}><Play className="h-4 w-4" /></Button>
                                )}
                                <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300" onClick={() => handleDeleteCampaign(campaign.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

    return (
        <>
            <Helmet><title>Campanhas - LeadFlow</title></Helmet>
            <div className="space-y-8">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Campanhas</h1>
                        <p className="text-gray-300">Crie, gerencie e monitore suas campanhas de WhatsApp.</p>
                    </div>

                    {/* ===== MUDANÇA 5: O link <a> foi trocado por um <Button> que abre o modal ===== */}
                    <Button
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Nova Campanha
                    </Button>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                    <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                        <CardContent className="pt-6">
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="bg-white/10 border-white/20">
                                    <TabsTrigger value="all" className="text-white data-[state=active]:bg-white/20">Todas ({campaigns?.length || 0})</TabsTrigger>
                                    <TabsTrigger value="scheduled" className="text-white data-[state=active]:bg-white/20">Agendadas ({filterCampaigns('scheduled').length})</TabsTrigger>
                                    <TabsTrigger value="in progress" className="text-white data-[state=active]:bg-white/20">Em Progresso ({filterCampaigns('in progress').length})</TabsTrigger>
                                    <TabsTrigger value="completed" className="text-white data-[state=active]:bg-white/20">Concluídas ({filterCampaigns('completed').length})</TabsTrigger>
                                    <TabsTrigger value="draft" className="text-white data-[state=active]:bg-white/20">Rascunhos ({filterCampaigns('draft').length})</TabsTrigger>
                                </TabsList>
                                <TabsContent value={activeTab} className="mt-6">
                                    {isLoading ? <p className="text-center p-8">Carregando...</p> : campaigns && filterCampaigns(activeTab).length > 0 ? (
                                        <CampaignTable campaignList={filterCampaigns(activeTab)} />
                                    ) : (
                                        <div className="text-center py-12">
                                            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-xl font-semibold text-white mb-2">Nenhuma campanha encontrada</h3>
                                            <p className="text-gray-400">Não há campanhas com o status "{activeTab}".</p>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* ===== MUDANÇA 6: Adicionar o componente Dialog para o modal ===== */}
            <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] h-[90vh] flex flex-col p-0">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle>Criar Nova Campanha</DialogTitle>
                    </DialogHeader>
                    <div className="flex-grow p-0 m-0">
                        {iframeSrc ? (
                            <iframe
                                src={iframeSrc}
                                style={{ border: 'none', width: '100%', height: '100%' }}
                                title="Criar Campanha Wizard"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">Carregando...</div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default CampaignManagement;