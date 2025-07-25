import React, { useState } from 'react';
import { motion } from 'framer-motion';
// A importação do 'useToast' pode ser removida se não for mais usada em nenhum outro lugar neste arquivo.
import { useToast } from "@/components/ui/use-toast"; 
import { LayoutDashboard, Users, MessageSquare, FileText, LogOut, Menu, X, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';

const DashboardLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast(); // Pode remover se não usar mais

    const allNavigationItems = [
        { name: 'Painel', icon: LayoutDashboard, path: '/dashboard', adminOnly: true },
        { name: 'Usuários', icon: UserCog, path: '/users', adminOnly: true },
        { name: 'Minhas Listas', icon: Users, path: '/audiences', adminOnly: false },
        { name: 'Campanhas', icon: MessageSquare, path: '/campaigns', adminOnly: false },
        { name: 'Modelos', icon: FileText, path: '/templates', adminOnly: false },
    ];

    const navigation = allNavigationItems.filter(item => {
        if (item.adminOnly) {
            return user?.role === 'ADMIN';
        }
        return true;
    });

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    
    // ===== MUDANÇA 1: A função de bloqueio foi removida daqui =====
    // A função showNotImplementedToast foi completamente deletada.

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black">
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <motion.div 
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/10 backdrop-blur-xl border-r border-white/20 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
                initial={{ x: -256 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-6 border-b border-white/20">
                        <div className="flex items-center space-x-3">
                            <img src="/logo.png" alt="LeadFlow Logo" className="w-8 h-8" />
                            <span className="text-xl font-bold text-white">LeadFlow</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden text-white hover:bg-white/10"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <nav className="flex-1 p-4 space-y-2">
                        {navigation.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                // ===== MUDANÇA 2: O onClick foi simplificado =====
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) =>
                                    `w-full justify-start text-white hover:bg-white/10 flex items-center p-2 rounded-md transition-colors ${
                                        isActive ? 'bg-white/20' : 'hover:bg-white/10'
                                    }`
                                }
                            >
                                <item.icon className="w-5 h-5 mr-3" />
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-white/20">
                        <div className="flex items-center space-x-3 mb-4">
                            <img
                                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`}
                                alt={user?.name}
                                className="w-10 h-10 rounded-full"
                            />
                            <div>
                                <p className="text-sm font-medium text-white">{user?.name}</p>
                                <p className="text-xs text-gray-300">{user?.email}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-white hover:bg-white/10"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-5 h-5 mr-3" />
                            Sair
                        </Button>
                    </div>
                </div>
            </motion.div>

            <div className="lg:ml-64">
                <div className="bg-white/10 backdrop-blur-xl border-b border-white/20 p-4">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden text-white hover:bg-white/10"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center space-x-4">
                            <span className="text-white font-medium">Bem-vindo, {user?.name}!</span>
                        </div>
                    </div>
                </div>

                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;