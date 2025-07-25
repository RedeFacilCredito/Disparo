// src/pages/UserManagement.jsx

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';

const UserManagement = () => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const token = localStorage.getItem('leadflow_token');

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar usuários');
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Erro desconhecido');
            
            toast({ title: "Sucesso!", description: "Novo usuário criado com sucesso." });
            reset(); // Limpa o formulário
            fetchUsers(); // Atualiza a lista
        } catch (error) {
            toast({ title: "Erro ao Criar Usuário", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Helmet><title>Gerenciar Usuários - LeadFlow</title></Helmet>
            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Criar Novo Usuário</CardTitle>
                        <CardDescription>Preencha os dados para adicionar um novo usuário ao sistema.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="name">Nome Completo</Label>
                                    <Input id="name" {...register("name", { required: "Nome é obrigatório" })} />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" {...register("email", { required: "Email é obrigatório" })} />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="password">Senha</Label>
                                    <Input id="password" type="password" {...register("password", { required: "Senha é obrigatória", minLength: { value: 6, message: "A senha deve ter no mínimo 6 caracteres" } })} />
                                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                                </div>
                            </div>
                            <Button type="submit" disabled={isLoading}>{isLoading ? 'Criando...' : 'Criar Usuário'}</Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Usuários Cadastrados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Data de Criação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.id}</TableCell>
                                        <TableCell>{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
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

export default UserManagement;