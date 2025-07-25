import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Pencil, Copy, Trash2, BarChart2, Play } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const getStatusBadgeVariant = (status) => {
    switch (status) {
        case 'Completed': return 'bg-green-500 text-white';
        case 'In Progress': return 'bg-blue-500 text-white';
        case 'Scheduled': return 'bg-yellow-500 text-black';
        case 'Draft': return 'secondary';
        default: return 'secondary';
    }
};

const CampaignTable = ({ campaigns, onActionClick, onViewReport, onPlayCampaign }) => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Scheduled Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {campaigns.map(campaign => (
                <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>{campaign.audience.name}</TableCell>
                    <TableCell>{campaign.template.name}</TableCell>
                    <TableCell>{campaign.scheduledAt ? new Date(campaign.scheduledAt).toLocaleString() : 'N/A'}</TableCell>
                    <TableCell>
                        <Badge className={getStatusBadgeVariant(campaign.status)}>{campaign.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onViewReport(campaign.id)}><BarChart2 className="mr-2 h-4 w-4" />View Report</DropdownMenuItem>
                                {campaign.status === 'Draft' && <DropdownMenuItem onClick={onActionClick}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>}
                                <DropdownMenuItem onClick={() => onPlayCampaign(campaign.id)}><Play className="mr-2 h-4 w-4" />Play</DropdownMenuItem>
                                <DropdownMenuItem onClick={onActionClick} className="text-red-500"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);
    
    const showToast = () => {
        toast({
            title: '🚧 Feature Not Implemented',
            description: "You can request this feature in the next prompt! 🚀",
        });
    };

    const handlePlayCampaign = async (id) => {
        try {
            const response = await fetch(`/api/campaigns/${id}/send-manual`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Adicionar token de autenticação aqui se necessário
                },
            });

            if (response.ok) {
                toast({
                    title: 'Campanha Enviada',
                    description: `Campanha ${id} marcada para envio.`, 
                });
                fetchCampaigns();
            } else {
                const errorData = await response.json();
                toast({
                    title: 'Erro ao Enviar Campanha',
                    description: errorData.error || 'Ocorreu um erro ao tentar enviar a campanha.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Erro de Rede',
                description: 'Não foi possível conectar ao servidor.',
                variant: 'destructive',
            });
        }
    };

    const handleViewReport = (id) => {
        navigate(`/report/${id}`);
    };

    const fetchCampaigns = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('leadflow_token'); // Assuming token is stored in localStorage
            const response = await fetch('/api/campaigns', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setCampaigns(data);
        } catch (e) {
            setError(e.message);
            toast({
                title: 'Erro ao carregar campanhas',
                description: e.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchCampaigns();
    }, []); // Fetch campaigns on component mount

    // Filter campaigns based on activeTab
    const filteredCampaigns = React.useMemo(() => {
        if (activeTab === 'all') {
            return campaigns;
        } else if (activeTab === 'scheduled') {
            return campaigns.filter(c => c.status === 'Scheduled');
        } else if (activeTab === 'inprogress') {
            return campaigns.filter(c => c.status === 'In Progress');
        } else if (activeTab === 'completed') {
            return campaigns.filter(c => c.status === 'Completed');
        } else if (activeTab === 'drafts') {
            return campaigns.filter(c => c.status === 'Draft');
        }
        return [];
    }, [campaigns, activeTab]);

    return (
        <>
            <Helmet>
                <title>Campaigns | LeadFlow</title>
                <meta name="description" content="Manage all your campaigns." />
            </Helmet>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Campaigns</h1>
                        <p className="text-muted-foreground">Create, manage, and track your campaigns.</p>
                    </div>
                    <Button onClick={() => navigate('/campaigns/new')}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Create New Campaign
                    </Button>
                </div>
                <Tabs defaultValue="all" className="w-full">
                    <TabsList onValueChange={setActiveTab}>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                        <TabsTrigger value="inprogress">In Progress</TabsTrigger>
                        <TabsTrigger value="completed">Completed</TabsTrigger>
                        <TabsTrigger value="drafts">Drafts</TabsTrigger>
                    </TabsList>
                    <Card className="mt-4">
                        <CardContent className="pt-6">
                            {loading ? (
                                <p>Loading campaigns...</p>
                            ) : error ? (
                                <p className="text-red-500">Error: {error}</p>
                            ) : (
                                <TabsContent value={activeTab} className="mt-0">
                                    <CampaignTable 
                                        campaigns={filteredCampaigns} 
                                        onActionClick={showToast} 
                                        onViewReport={handleViewReport} 
                                        onPlayCampaign={handlePlayCampaign} 
                                    />
                                </TabsContent>
                            )}
                        </CardContent>
                    </Card>
                </Tabs>
            </div>
        </>
    );
};

export default Campaigns;