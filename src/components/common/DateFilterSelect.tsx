import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Calendar, ChevronDown } from 'lucide-react';
import { DateFilterType } from '../../types';

export const DateFilterSelect: React.FC = () => {
  const { dateFilter, setDateFilter, customDateRange, setCustomDateRange } = useERP();
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  const options: { id: DateFilterType; label: string }[] = [
    { id: 'today', label: 'Hoje' },
    { id: 'yesterday', label: 'Ontem' },
    { id: '7days', label: 'Últimos 7 dias' },
    { id: '30days', label: 'Últimos 30 dias' },
    { id: '90days', label: 'Últimos 90 dias' },
    { id: 'thisMonth', label: 'Este mês' },
    { id: 'thisYear', label: 'Este ano' },
    { id: 'custom', label: 'Personalizado' },
  ];

  const currentLabel = options.find((o) => o.id === dateFilter)?.label || 'Este mês';

  const handleSelect = (id: DateFilterType) => {
    if (id === 'custom') {
      setIsCustomModalOpen(true);
    } else {
      setDateFilter(id);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2 bg-[#161B22] border border-gray-800 hover:border-purple-500/50 rounded-xl text-sm font-medium text-gray-200 hover:text-white transition-all shadow-xs"
      >
        <Calendar className="w-4 h-4 text-purple-400" />
        <span>{currentLabel}</span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#161B22] border border-gray-800 rounded-xl shadow-2xl py-1 z-30">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors flex items-center justify-between ${
                dateFilter === opt.id
                  ? 'bg-purple-600/10 text-purple-400 font-semibold'
                  : 'text-gray-300 hover:bg-gray-800/60 hover:text-white'
              }`}
            >
              {opt.label}
              {dateFilter === opt.id && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
            </button>
          ))}
        </div>
      )}

      {/* Custom Date Range Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#161B22] border border-gray-800 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-4">Filtrar por Período Personalizado</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Data Inicial</label>
                <input
                  type="date"
                  value={customDateRange.startDate}
                  onChange={(e) =>
                    setCustomDateRange({ ...customDateRange, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Data Final</label>
                <input
                  type="date"
                  value={customDateRange.endDate}
                  onChange={(e) =>
                    setCustomDateRange({ ...customDateRange, endDate: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setDateFilter('custom');
                  setIsCustomModalOpen(false);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-xl transition-all shadow-md shadow-purple-900/20"
              >
                Aplicar Filtro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
