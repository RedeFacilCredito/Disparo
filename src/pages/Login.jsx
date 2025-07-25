import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

const Login = ({ setIsAuthenticated }) => {
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        setIsAuthenticated(true);
        navigate('/');
    };

    return (
        <>
            <Helmet>
                <title>Login | LeadFlow</title>
                <meta name="description" content="Login to your LeadFlow account." />
            </Helmet>
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="mx-auto max-w-sm w-[350px]">
                        <CardHeader className="text-center">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
                                <MessageSquare className="h-10 w-10 text-primary mx-auto mb-2"/>
                            </motion.div>
                            <CardTitle className="text-2xl">LeadFlow</CardTitle>
                            <CardDescription>Enter your credentials to access your dashboard</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLogin}>
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="manager@example.com"
                                            defaultValue="manager@example.com"
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="flex items-center">
                                            <Label htmlFor="password">Password</Label>
                                            <a href="#" className="ml-auto inline-block text-sm underline">
                                                Forgot password?
                                            </a>
                                        </div>
                                        <Input id="password" type="password" defaultValue="password" required />
                                    </div>
                                    <Button type="submit" className="w-full">
                                        Login
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </>
    );
};

export default Login;