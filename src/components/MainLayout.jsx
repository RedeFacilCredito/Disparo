import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, MessageSquare, Users, Send, LayoutDashboard, LogOut, Settings, LifeBuoy } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/audience', icon: Users, label: 'Audience' },
    { to: '/campaigns', icon: Send, label: 'Campaigns' },
    { to: '/templates', icon: MessageSquare, label: 'Templates' },
];

const SidebarContent = ({ closeSheet }) => {
    const commonProps = {
        onClick: closeSheet,
        className: "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
    };
    return (
        <div className="flex flex-col gap-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                LeadFlow
            </h2>
            <div className="flex-1">
                <nav className="grid items-start gap-3 px-2 text-sm font-medium lg:px-4">
                    {navItems.map(item => (
                        <NavLink key={item.to} to={item.to} {...commonProps} end>
                            {({ isActive }) => (
                                <span className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive ? 'bg-muted text-primary' : 'hover:text-primary'}`}>
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </div>
        </div>
    )
};


const MainLayout = ({ children }) => {
    const navigate = useNavigate();
    const [open, setOpen] = React.useState(false);

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <aside className="hidden border-r bg-muted/40 md:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                        <a href="/" className="flex items-center gap-2 font-semibold">
                            <MessageSquare className="h-6 w-6 text-primary" />
                            <span className="">LeadFlow</span>
                        </a>
                    </div>
                    <SidebarContent />
                </div>
            </aside>
            <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col">
                            <SidebarContent closeSheet={() => setOpen(false)} />
                        </SheetContent>
                    </Sheet>
                    <div className="w-full flex-1">
                        {/* Can add a global search here if needed */}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="rounded-full">
                                <Avatar>
                                    <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User" />
                                    <AvatarFallback>MM</AvatarFallback>
                                </Avatar>
                                <span className="sr-only">Toggle user menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem><Settings className="mr-2 h-4 w-4" />Settings</DropdownMenuItem>
                            <DropdownMenuItem><LifeBuoy className="mr-2 h-4 w-4" />Support</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate('/login')}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>
                <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background/95">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;