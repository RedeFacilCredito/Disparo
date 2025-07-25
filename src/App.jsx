// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import LoginPage from '@/pages/LoginPage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Dashboard from '@/pages/Dashboard';
import AudienceManagement from '@/pages/AudienceManagement';
import CampaignManagement from '@/pages/CampaignManagement';
import TemplateLibrary from '@/pages/TemplateLibrary';
import CampaignReport from '@/pages/CampaignReport';
import CreateCampaign from '@/pages/CreateCampaign';
import UserManagement from '@/pages/UserManagement'; 

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-green-500"></div></div>;
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-green-500"></div></div>;
  }
  // Se logado, redireciona para a nova página padrão: /campaigns
  return !isAuthenticated ? children : <Navigate to="/campaigns" replace />;
}

// --- NOVO COMPONENTE DE ROTA PARA ADMIN ---
function AdminRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-green-500"></div></div>;
  }

  // Verifica se está logado E se o e-mail é o do admin
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';

  return isAdmin ? children : <Navigate to="/campaigns" replace />;
}


function App() {
  return (
    <>
      <Helmet>
        <title>LeadFlow - WhatsApp Campaign Manager</title>
        <meta name="description" content="Manage your WhatsApp marketing campaigns with ease." />
      </Helmet>
      
      <AuthProvider>
        <DataProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              {/* --- ROTA STANDALONE PARA O WIZARD DE CAMPANHA, SEM LAYOUT --- */}
              <Route path="/campaigns/create-standalone" element={<ProtectedRoute><CreateCampaign /></ProtectedRoute>} />
              {/* --- ROTA DO DASHBOARD AGORA PROTEGIDA PELO AdminRoute --- */}
              <Route path="/dashboard" element={<AdminRoute><DashboardLayout><Dashboard /></DashboardLayout></AdminRoute>} />
              <Route path="/users" element={<AdminRoute><DashboardLayout><UserManagement /></DashboardLayout></AdminRoute>} />  
              <Route path="/audiences" element={<ProtectedRoute><DashboardLayout><AudienceManagement /></DashboardLayout></ProtectedRoute>} />
              <Route path="/campaigns" element={<ProtectedRoute><DashboardLayout><CampaignManagement /></DashboardLayout></ProtectedRoute>} />
              <Route path="/campaigns/create" element={<ProtectedRoute><DashboardLayout><CreateCampaign /></DashboardLayout></ProtectedRoute>} />
              <Route path="/campaigns/:id/report" element={<ProtectedRoute><DashboardLayout><CampaignReport /></DashboardLayout></ProtectedRoute>} />
              <Route path="/templates" element={<ProtectedRoute><DashboardLayout><TemplateLibrary /></DashboardLayout></ProtectedRoute>} />
              
              {/* --- REDIRECIONAMENTO PADRÃO ALTERADO PARA /campaigns --- */}
              <Route path="/" element={<Navigate to="/campaigns" replace />} />
              <Route path="*" element={<Navigate to="/campaigns" replace />} />
              
            </Routes>
            <Toaster />
          </Router>
        </DataProvider>
      </AuthProvider>
    </>
  );
}

export default App;
