import React, { useState } from 'react';
import { ERPProvider, useERP } from './context/ERPContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { CommandPalette } from './components/layout/CommandPalette';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginView } from './components/views/LoginView';

import { DashboardView } from './components/views/DashboardView';
import { FinanceView } from './components/views/FinanceView';
import { SalesView } from './components/views/SalesView';
import { CustomersView } from './components/views/CustomersView';
import { ProductsView } from './components/views/ProductsView';
import { StockView } from './components/views/StockView';
import { SuppliersView } from './components/views/SuppliersView';
import { AccountsView } from './components/views/AccountsView';
import { ReportsView } from './components/views/ReportsView';
import { GoalsView } from './components/views/GoalsView';
import { AgendaView } from './components/views/AgendaView';
import { SettingsView } from './components/views/SettingsView';
import { ProfileView } from './components/views/ProfileView';
import { EmployeesView } from './components/views/EmployeesView';
import { ProLaboreView } from './components/views/ProLaboreView';
import { CategoriesView } from './components/views/CategoriesView';
import { HealthView } from './components/views/HealthView';

const MainLayout: React.FC = () => {
  const { currentUser, activeTab, cloudEnabled, cloudStatus } = useERP();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (cloudEnabled && cloudStatus === 'connecting' && !currentUser) {
    return (
      <div className="min-h-screen w-full bg-[#0D1117] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-purple-500 to-indigo-500 animate-pulse flex items-center justify-center text-white font-extrabold text-xl shadow-xl shadow-purple-900/30">
          N
        </div>
        <p className="text-xs text-gray-500">Conectando ao sistema...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'finance':
        return <FinanceView />;
      case 'sales':
        return <SalesView />;
      case 'customers':
        return <CustomersView />;
      case 'products':
        return <ProductsView />;
      case 'stock':
        return <StockView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'accounts':
        return <AccountsView />;
      case 'reports':
        return <ReportsView />;
      case 'employees':
        return <EmployeesView />;
      case 'prolabore':
        return <ProLaboreView />;
      case 'categories':
        return <CategoriesView />;
      case 'health':
        return <HealthView />;
      case 'goals':
        return <GoalsView />;
      case 'agenda':
        return <AgendaView />;
      case 'settings':
        return <SettingsView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-gray-100 font-sans antialiased flex flex-col">
      <Header onToggleMobileMenu={() => setMobileMenuOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <main className="flex-1 overflow-y-auto pb-16">{renderActiveView()}</main>
      </div>

      <CommandPalette />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ERPProvider>
      <MainLayout />
    </ERPProvider>
  );
}
