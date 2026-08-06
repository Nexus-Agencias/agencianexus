import React from 'react';
import { useERP } from '../../context/ERPContext';
import {
  LayoutDashboard,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Layers,
  Truck,
  Landmark,
  FileText,
  Calendar,
  Target,
  Settings,
  User,
  LogOut,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Users2,
  Wallet,
  PieChart,
  HeartPulse,
  X,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onClose }) => {
  const { activeTab, setActiveTab, companyConfig, products, notifications, logout } = useERP();

  // Calculate low stock alert badge count
  const lowStockCount = products.filter((p) => p.stockQuantity <= p.minStockQuantity).length;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'health', label: 'Saúde Financeira', icon: HeartPulse },
    { id: 'finance', label: 'Financeiro', icon: DollarSign },
    { id: 'categories', label: 'Centros de Receita', icon: PieChart },
    { id: 'sales', label: 'Vendas', icon: ShoppingCart },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'stock', label: 'Estoque', icon: Layers, badge: lowStockCount },
    { id: 'suppliers', label: 'Fornecedor', icon: Truck },
    { id: 'employees', label: 'Colaboradores', icon: Users2 },
    { id: 'prolabore', label: 'Pró-Labore', icon: Wallet },
    { id: 'accounts', label: 'Contas & DRE', icon: Landmark },
    { id: 'reports', label: 'Relatórios', icon: FileText },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'settings', label: 'Configurações', icon: Settings },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  const renderNav = () => (
    <>
      <div>
        {/* Company Header */}
        <div className="p-5 border-b border-gray-800/80 flex items-center gap-3">
          <img
            src="/logo.png"
            alt={companyConfig.tradeName || 'Logo'}
            className="h-12 w-auto object-contain drop-shadow-[0_0_8px_rgba(217,70,239,0.45)]"
          />
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-white tracking-wide truncate">
              {companyConfig.tradeName && !companyConfig.tradeName.includes('TECH') && !companyConfig.tradeName.includes('ERP')
                ? companyConfig.tradeName
                : 'NEXUS AGÊNCIA'}
            </h1>
            <p className="text-[10px] font-semibold text-purple-400 tracking-wider uppercase flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3" /> Gestão Comercial
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1 max-h-[calc(100vh-160px)] overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose?.();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-purple-600 text-white font-semibold shadow-lg shadow-purple-900/25'
                    : 'text-gray-400 hover:text-white hover:bg-[#161B22]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-purple-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-gray-800/80 bg-[#0D1117]">
        <button
          onClick={() => {
            logout();
            onClose?.();
          }}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair do Sistema</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#0D1117] border-r border-gray-800/80 h-screen sticky top-0 flex-col justify-between select-none z-40 shrink-0">
        {renderNav()}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-[#0D1117] border-r border-gray-800 flex flex-col justify-between select-none shadow-2xl">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white bg-[#161B22] border border-gray-800 rounded-lg transition-colors z-10"
              aria-label="Fechar menu"
            >
              <X className="w-4 h-4" />
            </button>
            {renderNav()}
          </aside>
        </div>
      )}
    </>
  );
};
