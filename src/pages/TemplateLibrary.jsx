// src/pages/TemplateLibrary.jsx

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, PlusCircle, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Função auxiliar para exibir os badges de status coloridos
const getStatusBadge = (status) => {
    // Gupshup usa status como 'APPROVED', 'PENDING', 'REJECTED'
    switch (status) {
        case 'APPROVED':
            return <Badge variant="default" className="bg-green-500 text-white"><CheckCircle className="mr-1 h-3 w-3" />Aprovado</Badge>;
        case 'PENDING':
            return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pendente</Badge>;
        case 'REJECTED':
            return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />Rejeitado</Badge>;
        default:
            return <Badge>{status}</Badge>;
    }
};

const TemplateLibrary = () => {
    const { toast } = useToast();
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    // Pega o token de autenticação para usar nas chamadas de API
    const token = localStorage.getItem('leadflow_token');

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/templates`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Falha ao buscar dados');
            const data = await response.json();
            setTemplates(data);
        } catch (error) {
            console.error("Erro ao buscar templates:", error);
            toast({ title: "Erro ao carregar templates", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchTemplates();
        } else {
            setIsLoading(false);
            toast({ title: "Erro de autenticação", description: "Token não encontrado.", variant: "destructive" });
        }
    }, [token]);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/templates/sync-gupshup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Falha na sincronização');
            }

            const result = await response.json();
            toast({
                title: 'Sincronização Concluída',
                description: `${result.created} templates criados, ${result.updated} atualizados.`,
            });
            fetchTemplates();
        } catch (error) {
            console.error("Erro ao sincronizar:", error);
            toast({
                title: 'Erro na Sincronização',
                description: 'Não foi possível sincronizar com a Gupshup.',
                variant: 'destructive',
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleNewTemplate = () => {
        toast({
            title: '🚧 Funcionalidade não implementada',
            description: "Você pode criar novos templates diretamente na plataforma da Gupshup.",
        });
    }

    if (isLoading) {
        return <div className="text-center p-10">Carregando templates...</div>;
    }

    return (
        <>
            <Helmet>
                <title>Modelos de Mensagem | LeadFlow</title>
                <meta name="description" content="Gerencie e sincronize seus modelos de mensagem do WhatsApp." />
            </Helmet>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Modelos de Mensagem</h1>
                        <p className="text-muted-foreground">Gerencie seus modelos de mensagem do WhatsApp.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleNewTemplate} variant="outline">
                            <PlusCircle className="mr-2 h-4 w-4" /> Criar Novo
                        </Button>
                        <Button onClick={handleSync} disabled={isSyncing}>
                            <motion.div
                                animate={{ rotate: isSyncing ? 360 : 0 }}
                                transition={{ loop: isSyncing ? Infinity : 0, duration: 1, ease: 'linear' }}
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                            </motion.div>
                            {isSyncing ? 'Sincronizando...' : 'Sincronizar com Gupshup'}
                        </Button>
                    </div>
                </div>

                <motion.div
                    className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <AnimatePresence>
                        {templates.map((template, index) => (
                            <motion.div
                                key={template.id}
                                layout
                                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                                <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-lg">{template.name}</CardTitle>
                                            {getStatusBadge(template.status)}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <CardDescription className="text-sm text-foreground/80 italic border-l-4 border-primary/50 pl-4 py-2 bg-muted/50 rounded-r-md">
                                            "{template.body}"
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>
        </>
    );
};

export default TemplateLibrary;