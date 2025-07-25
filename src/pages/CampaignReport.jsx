// src/pages/CampaignReport.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react'; // <-- MUDANÇA 1: Importar useCallback
import { Helmet } from 'react-helmet';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_API_URL);

const CampaignReport = () => {
    const { id: campaignId } = useParams();
    const { toast } = useToast();
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // --- MUDANÇA 2: A função de busca agora é envolvida por useCallback ---
    // Isso garante que a função não seja recriada a cada renderização,
    // permitindo que a usemos com segurança dentro de vários useEffects.
    const fetchReport = useCallback(async () => {
        // Não mostra o loading para atualizações em tempo real, apenas na carga inicial
        // setIsLoading(true); 
        const token = localStorage.getItem('leadflow_token');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/campaigns/${campaignId}/report`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha ao buscar dados do relatório');
            }
            const data = await response.json();
            setReportData(data);
        } catch (err) {
            setError(err.message);
            toast({ title: "Erro ao carregar relatório", description: err.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [campaignId, toast]); // As dependências da função

    // Efeito para a carga inicial da página
    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    // Efeito para escutar atualizações em tempo real via Socket.IO
    useEffect(() => {
        const handleStatusUpdate = (data) => {
            if (String(data.campaignId) === campaignId) {
                console.log(`[Socket.IO] Recebida atualização para a campanha ${campaignId}. Buscando novos dados...`);
                // --- MUDANÇA 3: Chama a função fetchReport que agora é estável ---
                fetchReport();
            }
        };

        socket.on('campaign_status_updated', handleStatusUpdate);

        return () => {
            socket.off('campaign_status_updated', handleStatusUpdate);
        };
    }, [campaignId, fetchReport]); // Adiciona fetchReport às dependências

    // ... (O resto do seu componente permanece exatamente o mesmo) ...

    const filteredContacts = useMemo(() => {
        if (!reportData?.contacts) return [];
        return reportData.contacts.filter(contact =>
            (contact.name && contact.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (contact.phone && contact.phone.includes(searchTerm))
        );
    }, [reportData, searchTerm]);
    
    const stats = reportData?.stats;
    const deliveryBase = stats?.sent || 0;
    const engagementBase = stats?.delivered || 0;

    const deliveryRate = deliveryBase > 0 ? ((stats.delivered || 0) / deliveryBase) * 100 : 0;
    const readRate = engagementBase > 0 ? ((stats.read || 0) / engagementBase) * 100 : 0;
    const repliedRate = engagementBase > 0 ? ((stats.responded || 0) / engagementBase) * 100 : 0;

    if (isLoading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /><span className="ml-4 text-lg">Carregando relatório...</span></div>;
    }
    
    if (error) {
        return <div className="text-red-500 text-center p-8">Erro ao carregar o relatório: {error}</div>;
    }

    if (!reportData) {
        return <div className="text-center p-8">Nenhum dado encontrado para esta campanha.</div>;
    }

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered': return 'bg-blue-500';
            case 'read': return 'bg-green-500';
            case 'responded': return 'bg-purple-600';
            case 'failed': return 'bg-red-500';
            case 'sent': return 'bg-yellow-500 text-black';
            default: return 'bg-gray-400';
        }
    };
    
    return (
        <>
            <Helmet><title>Relatório - {reportData.campaign.name} | LeadFlow</title></Helmet>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Relatório da Campanha</h1>
                    <p className="text-muted-foreground">Análise detalhada de "{reportData.campaign.name}"</p>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card><CardHeader><CardTitle>Total na Lista</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats?.total || 0}</div></CardContent></Card>
                    <Card><CardHeader><CardTitle>Entregues</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats?.delivered || 0}</div><p className="text-xs text-muted-foreground">{deliveryRate.toFixed(1)}% de entrega</p></CardContent></Card>
                    <Card><CardHeader><CardTitle>Lidos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats?.read || 0}</div><p className="text-xs text-muted-foreground">{readRate.toFixed(1)}% dos entregues</p></CardContent></Card>
                    <Card><CardHeader><CardTitle>Respondidos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats?.responded || 0}</div><p className="text-xs text-muted-foreground">{repliedRate.toFixed(1)}% dos entregues</p></CardContent></Card>
                    <Card><CardHeader><CardTitle>Falhas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats?.failed || 0}</div></CardContent></Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Status dos Contatos</CardTitle>
                        <div className="relative mt-2">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar por nome ou telefone..." 
                                className="pl-8 w-full md:w-1/3"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome do Contato</TableHead>
                                    <TableHead>Telefone</TableHead>
                                    <TableHead className="text-right">Status Final</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredContacts.map((contact, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{contact.name}</TableCell>
                                        <TableCell>{contact.phone}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge className={`${getStatusBadge(contact.status)} text-white`}>{contact.status}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default CampaignReport;