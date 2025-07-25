import React from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Users, Send, CheckCircle, Eye } from 'lucide-react';
// import { useData } from '@/contexts/DataContext'; // Comentamos o useData por enquanto

// --- MUDANÇA: Função de badge movida para dentro do arquivo ---
const getStatusBadgeVariant = (status) => {
    switch (status) {
        case 'Completed': return 'bg-green-500 text-white';
        case 'In Progress': return 'bg-blue-500 text-white';
        case 'Scheduled': return 'bg-yellow-500 text-black';
        case 'Error': return 'bg-red-500 text-white';
        default: return 'secondary';
    }
};

const Dashboard = () => {
    const navigate = useNavigate();
    
    // --- MUDANÇA: Substituímos o useData() por dados fictícios (mock) ---

    // Dados para os cards de KPI (Indicadores Chave de Performance)
    const kpi = {
        totalContacts: '12,450',
        contactsChange: '+12% from last month',
        campaignsSent: '215',
        campaignsChange: '+5 campaigns this week',
        deliveryRate: '98.5%',
        deliveryChange: '+0.2% from last campaign',
        readRate: '72.1%',
        readChange: '-1.5% from last campaign'
    };

    // Dados para a tabela de campanhas recentes
    const recentCampaigns = [
        { id: 45, name: 'Promoção Dia dos Pais', status: 'Completed' },
        { id: 46, name: 'Lançamento Coleção Inverno', status: 'In Progress' },
        { id: 47, name: 'Pesquisa de Satisfação Q2', status: 'Scheduled' },
        { id: 48, name: 'Oferta Exclusiva VIP', status: 'Error' },
        { id: 49, name: 'Newsletter Semanal', status: 'Completed' },
    ];

    // Dados para o gráfico de barras
    const chartData = [
        { name: 'Janeiro', sent: 4000, read: 2400 },
        { name: 'Fevereiro', sent: 3000, read: 1398 },
        { name: 'Março', sent: 2000, read: 9800 },
        { name: 'Abril', sent: 2780, read: 3908 },
        { name: 'Maio', sent: 1890, read: 4800 },
        { name: 'Junho', sent: 2390, read: 3800 },
        { name: 'Julho', sent: 3490, read: 4300 },
    ];
    
    // O erro 'Cannot read properties of undefined (reading 'totalContacts')'
    // acontecia porque o useData() retornava 'kpi' como undefined inicialmente.
    // Com os dados fictícios, isso está resolvido.
    if (!kpi || !recentCampaigns || !chartData) {
        return <div>Carregando dados...</div>; // Fallback simples
    }

    return (
        <>
            <Helmet>
                <title>Dashboard | LeadFlow</title>
                <meta name="description" content="Your campaign dashboard." />
            </Helmet>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpi.totalContacts}</div>
                            <p className="text-xs text-muted-foreground">{kpi.contactsChange}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Campanhas Enviadas</CardTitle>
                            <Send className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpi.campaignsSent}</div>
                            <p className="text-xs text-muted-foreground">{kpi.campaignsChange}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpi.deliveryRate}</div>
                            <p className="text-xs text-muted-foreground">{kpi.deliveryChange}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Taxa de Leitura</CardTitle>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpi.readRate}</div>
                            <p className="text-xs text-muted-foreground">{kpi.readChange}</p>
                        </CardContent>
                    </Card>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Atividade das Campanhas</CardTitle>
                            <CardDescription>Mensagens enviadas nos últimos meses.</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}K`} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="sent" name="Enviadas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="read" name="Lidas" fill="hsl(var(--primary) / 0.5)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card className="col-span-4 lg:col-span-3">
                        <CardHeader>
                            <CardTitle>Campanhas Recentes</CardTitle>
                            <CardDescription>Suas últimas 5 campanhas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Campanha</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentCampaigns.map((campaign) => (
                                        <TableRow key={campaign.id}>
                                            <TableCell className="font-medium">{campaign.name}</TableCell>
                                            <TableCell>
                                                <Badge className={getStatusBadgeVariant(campaign.status)}>{campaign.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" onClick={() => navigate(`/campaigns/${campaign.id}/report`)}>Ver Relatório</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
};

export default Dashboard;