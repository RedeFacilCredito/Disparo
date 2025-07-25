// src/pages/AudienceManagement.jsx

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Users, Upload, Trash2, Plus, Eye, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useData } from '@/contexts/DataContext';

const AudienceManagement = () => {
    const { toast } = useToast();
    // A busca inicial de 'audiences' e a função 'fetchAudiences' agora vêm do nosso DataContext.
    const { audiences, fetchAudiences: refetchAudiences } = useData();
    const [isLoading, setIsLoading] = useState(true);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [listName, setListName] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    // Pega o token para usar nas ações que não estão no DataContext, como Upload e Delete.
    const token = localStorage.getItem('leadflow_token');

    // A lógica de carregamento agora só gerencia o estado de "loading" da tela.
    // A busca de dados em si é feita pelo DataContext, que já é autenticado.
    useEffect(() => {
        if (audiences) {
            setIsLoading(false);
        }
    }, [audiences]);

    const showNotImplementedToast = () => {
        toast({
            title: "🚧 Funcionalidade em Desenvolvimento",
            description: "Esta ação será implementada em breve.",
        });
    };

    const handleDeleteAudience = async (id) => {
        if (!token) return toast({ title: "Erro de autenticação", variant: "destructive" });
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/audiences/${id}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${token}` // << AUTENTICAÇÃO
                }
            });
            if (!response.ok) throw new Error("Falha ao deletar lista");
            toast({ title: "Sucesso", description: "Lista deletada com sucesso." });
            if(refetchAudiences) refetchAudiences();
        } catch (error) {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    };

    // Em src/pages/AudienceManagement.jsx

    const handleUpload = async () => {
        if (!selectedFile || !listName.trim()) {
            toast({ title: "Erro", description: "Por favor, preencha o nome da lista e selecione um arquivo.", variant: "destructive" });
            return;
        }
        if (!token) return toast({ title: "Erro de autenticação", variant: "destructive" });

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('name', listName);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/audiences/upload`, {
                method: 'POST',
                headers: {
                    // NÃO adicione 'Content-Type' aqui. O navegador fará isso.
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            // ======================= MUDANÇA PRINCIPAL AQUI =======================
            // Lê a resposta como texto, pois tanto o sucesso quanto o erro podem ser texto.
            const responseBody = await response.text(); 
            
            if (!response.ok) {
                // Se a resposta não for OK, lança um erro com a mensagem do corpo da resposta.
                throw new Error(responseBody || "Falha no upload com status " + response.status);
            }
            // =======================================================================

            toast({ title: "Sucesso!", description: responseBody });
            
            setUploadDialogOpen(false);
            setSelectedFile(null);
            setListName('');
            if(refetchAudiences) refetchAudiences();
        } catch (error) {
            // Agora o 'error.message' conterá a mensagem real do backend.
            toast({ title: "Erro no Upload", description: error.message, variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Minhas Listas - LeadFlow</title>
                <meta name="description" content="Gerencie suas listas de contatos e públicos." />
            </Helmet>

            <div className="space-y-8">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Minhas Listas</h1>
                        <p className="text-gray-300">Gerencie suas listas de contatos e públicos</p>
                    </div>
                    
                    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">
                                <Plus className="w-4 h-4 mr-2" />
                                Nova Lista
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-white/20 text-white">
                            <DialogHeader>
                                <DialogTitle>Upload de Nova Lista</DialogTitle>
                                <DialogDescription className="text-gray-300">
                                    Envie um arquivo CSV com cabeçalho (ex: 'name', 'phone').
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="listName">Nome da Lista</Label>
                                    <Input id="listName" placeholder="Ex: Clientes VIP Q3" value={listName} onChange={(e) => setListName(e.target.value)} className="bg-white/10 border-white/20 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="csvFile">Arquivo CSV</Label>
                                    <Input id="csvFile" type="file" accept=".csv" onChange={(e) => setSelectedFile(e.target.files[0])} className="bg-white/10 border-white/20 text-white file:text-white" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={handleUpload} disabled={isUploading}>
                                    {isUploading ? 'Enviando...' : 'Confirmar e Salvar'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
                    <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center">
                                <Users className="w-5 h-5 mr-2" /> Listas de Contatos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <p className="text-center p-8 text-gray-400">Carregando listas...</p>
                            ) : audiences && audiences.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-white/20 hover:bg-transparent">
                                            <TableHead className="text-gray-300">Nome da Lista</TableHead>
                                            <TableHead className="text-gray-300">Contatos</TableHead>
                                            <TableHead className="text-gray-300">Data de Upload</TableHead>
                                            <TableHead className="text-right pr-6">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {audiences.map((audience) => (
                                            <TableRow key={audience.id} className="border-white/20">
                                                <TableCell className="text-white font-medium">{audience.name}</TableCell>
                                                <TableCell className="text-gray-300">{audience.contactCount.toLocaleString()}</TableCell>
                                                <TableCell className="text-gray-300">{new Date(audience.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end space-x-1">
                                                        <Button variant="ghost" size="icon" className="text-blue-400 hover:text-blue-300" onClick={showNotImplementedToast}>
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-green-400 hover:text-green-300" onClick={showNotImplementedToast}>
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300" onClick={() => handleDeleteAudience(audience.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-12">
                                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-white mb-2">Nenhuma lista de contatos</h3>
                                    <p className="text-gray-400 mb-6">Faça o upload do seu primeiro arquivo CSV para começar.</p>
                                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700" onClick={() => setUploadDialogOpen(true)}>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Fazer Upload
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </>
    );
};

export default AudienceManagement;