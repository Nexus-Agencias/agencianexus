import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Search,
  X,
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { formatBRL } from '../../utils/formatters';

export const CommandPalette: React.FC = () => {
  const {
    isCommandOpen,
    setIsCommandOpen,
    products,
    customers,
    sales,
    setActiveTab,
    setSelectedSaleForReceipt,
  } = useERP();

  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(!isCommandOpen);
      } else if (e.key === 'Escape' && isCommandOpen) {
        setIsCommandOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandOpen, setIsCommandOpen]);

  if (!isCommandOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  const matchedProducts = cleanQuery
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(cleanQuery) ||
          p.code.toLowerCase().includes(cleanQuery) ||
          p.category.toLowerCase().includes(cleanQuery)
      )
    : products.slice(0, 3);

  const matchedCustomers = cleanQuery
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(cleanQuery) ||
          c.email.toLowerCase().includes(cleanQuery) ||
          c.document.includes(cleanQuery)
      )
    : customers.slice(0, 3);

  const matchedSales = cleanQuery
    ? sales.filter(
        (s) =>
          s.code.toLowerCase().includes(cleanQuery) ||
          s.customerName.toLowerCase().includes(cleanQuery)
      )
    : sales.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#161B22] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Input */}
        <div className="p-4 border-b border-gray-800 flex items-center gap-3 bg-[#0D1117]/50">
          <Search className="w-5 h-5 text-purple-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite para buscar produtos, clientes, vendas ou comandos..."
            className="w-full bg-transparent text-sm text-white focus:outline-hidden placeholder-gray-500"
          />
          <button
            onClick={() => setIsCommandOpen(false)}
            className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {/* Products Section */}
          {matchedProducts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-2 pb-1.5 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                <Package className="w-3.5 h-3.5 text-purple-400" />
                Produtos ({matchedProducts.length})
              </div>
              <div className="space-y-1">
                {matchedProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActiveTab('products');
                      setIsCommandOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-800/60 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-purple-900/30 border border-purple-500/20 text-purple-400 font-bold flex items-center justify-center text-xs">
                          {p.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          SKU: {p.code} • Estoque: {p.stockQuantity} un
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">{formatBRL(p.salePrice)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers Section */}
          {matchedCustomers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-2 pb-1.5 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                Clientes ({matchedCustomers.length})
              </div>
              <div className="space-y-1">
                {matchedCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActiveTab('customers');
                      setIsCommandOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-800/60 transition-colors cursor-pointer group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {c.email} • {c.phone}
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-800 px-2 py-0.5 rounded-md">
                      {c.city} - {c.state}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sales Section */}
          {matchedSales.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-2 pb-1.5 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
                Vendas ({matchedSales.length})
              </div>
              <div className="space-y-1">
                {matchedSales.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelectedSaleForReceipt(s);
                      setIsCommandOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-800/60 transition-colors cursor-pointer group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
                        {s.code} • {s.customerName}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {s.items.length} itens • {s.paymentMethod}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-white block">{formatBRL(s.total)}</span>
                      <span className="text-[10px] text-emerald-400">Ver Recibo</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-[#0D1117] border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 bg-gray-800 rounded-xs text-gray-300">↑</kbd>{' '}
              <kbd className="px-1 py-0.5 bg-gray-800 rounded-xs text-gray-300">↓</kbd> Navegar
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-gray-800 rounded-xs text-gray-300">ESC</kbd> Fechar
            </span>
          </div>
          <span className="flex items-center gap-1 text-purple-400 font-medium">
            <Sparkles className="w-3 h-3" /> Busca Instantânea Nexus
          </span>
        </div>
      </div>
    </div>
  );
};
