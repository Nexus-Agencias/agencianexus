import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Search,
  Menu,
  Bell,
  CheckCheck,
  Building2,
  Plus,
  UserCheck,
  LogOut,
  ChevronDown,
  Sparkles,
  CloudCheck,
  CloudOff,
  RefreshCw,
} from 'lucide-react';
import { DateFilterSelect } from '../common/DateFilterSelect';
import { formatDate } from '../../utils/formatters';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const {
    companyConfig,
    currentUser,
    users,
    setCurrentUser,
    logout,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setIsCommandOpen,
    setActiveTab,
    cloudEnabled,
    cloudStatus,
    companyCode,
  } = useERP();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const todayFormatted = new Date().toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0D1117]/90 backdrop-blur-md border-b border-gray-800/80 px-4 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Global Search trigger */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-gray-400 hover:text-white bg-[#161B22] border border-gray-800 rounded-xl transition-colors hover:bg-gray-800/50 shrink-0"
          aria-label="Abrir menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsCommandOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-[#161B22] border border-gray-800/90 hover:border-purple-500/50 rounded-xl text-xs text-gray-400 hover:text-gray-200 transition-all shadow-inner group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform shrink-0" />
            <span className="truncate">Buscar clientes, produtos, vendas (Ctrl + K)...</span>
          </div>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 bg-[#0D1117] border border-gray-700/60 rounded-md shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Date Filter */}
        <DateFilterSelect />

        {/* Quick Action */}
        <button
          onClick={() => setActiveTab('sales')}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-purple-900/30 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Venda</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-gray-400 hover:text-white bg-[#161B22] border border-gray-800 rounded-xl transition-colors hover:bg-gray-800/50"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#161B22] border border-gray-800 rounded-2xl shadow-2xl p-4 z-40">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-white">Notificações</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold text-purple-300 bg-purple-500/20 rounded-full">
                      {unreadCount} novas
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Ler todas
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto my-2 space-y-2 divide-y divide-gray-800/50 pr-1">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-500">Nenhuma notificação no momento.</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markNotificationAsRead(notif.id);
                        if (notif.linkToTab) setActiveTab(notif.linkToTab);
                        setIsNotifOpen(false);
                      }}
                      className={`pt-2 p-2 rounded-xl transition-colors cursor-pointer ${
                        !notif.read ? 'bg-purple-950/20 hover:bg-purple-950/30' : 'hover:bg-gray-800/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-white">{notif.title}</span>
                        <span className="text-[10px] text-gray-500 shrink-0">{formatDate(notif.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-300 mt-1 leading-snug">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1.5 pl-2.5 bg-[#161B22] border border-gray-800 hover:border-purple-500/40 rounded-xl transition-all"
          >
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-lg object-cover ring-1 ring-purple-500/40"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="hidden sm:block text-left pr-1">
              <div className="text-xs font-medium text-white truncate max-w-[120px]">
                {currentUser?.name || 'Usuário'}
              </div>
              <div className="text-[10px] text-purple-400 font-medium leading-none mt-0.5">
                {currentUser?.role || 'Acesso'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-[#161B22] border border-gray-800 rounded-2xl shadow-2xl p-2 z-40">
              <div className="p-3 border-b border-gray-800 mb-1">
                <p className="text-xs font-semibold text-white">{currentUser?.name}</p>
                <p className="text-[11px] text-gray-400">{currentUser?.email}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                  {currentUser?.role}
                </span>
              </div>

              {cloudEnabled ? (
                <div className="px-2 py-2 mb-2 space-y-1.5">
                  <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-[#0D1117] border border-gray-800">
                    <span className="text-[11px] text-gray-400 flex items-center gap-1.5">
                      {cloudStatus === 'synced' && <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />}
                      {cloudStatus === 'connecting' && <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" />}
                      {cloudStatus === 'error' && <CloudOff className="w-3.5 h-3.5 text-rose-400" />}
                      {cloudStatus === 'off' && <CloudOff className="w-3.5 h-3.5 text-gray-500" />}
                      {cloudStatus === 'synced' && 'Dados sincronizados na nuvem'}
                      {cloudStatus === 'connecting' && 'Sincronizando...'}
                      {cloudStatus === 'error' && 'Falha na sincronização'}
                      {cloudStatus === 'off' && 'Modo offline'}
                    </span>
                    {companyCode && (
                      <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md font-mono tracking-widest">
                        {companyCode}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                    Alternar Perfil Demo
                  </div>

                  <div className="space-y-1 mb-2">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setCurrentUser(u);
                          setIsUserMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-medium transition-colors ${
                          currentUser?.id === u.id
                            ? 'bg-purple-600/20 text-purple-300 font-semibold'
                            : 'text-gray-300 hover:bg-gray-800/60 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                          <span>{u.name}</span>
                        </div>
                        <span className="text-[10px] text-gray-500">{u.role}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="pt-2 border-t border-gray-800 space-y-1">
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-colors"
                >
                  Meu Perfil & Segurança
                </button>
                <button
                  onClick={() => {
                    logout();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sair do Sistema
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
