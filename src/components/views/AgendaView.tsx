import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Calendar, Plus, Clock, CheckCircle2, AlertCircle, Trash2, Edit, X } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'Reunião' | 'Vencimento' | 'Cobrança' | 'Entrega';
  priority: 'Alta' | 'Média' | 'Baixa';
  status: 'Pendente' | 'Concluído';
}

export const AgendaView: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [type, setType] = useState<EventItem['type']>('Reunião');
  const [priority, setPriority] = useState<EventItem['priority']>('Média');

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const newEvt: EventItem = {
      id: `e_${Date.now()}`,
      title,
      date,
      time,
      type,
      priority,
      status: 'Pendente',
    };

    setEvents([newEvt, ...events]);
    setTitle('');
    setIsModalOpen(false);
  };

  const toggleStatus = (id: string) => {
    setEvents(
      events.map((e) =>
        e.id === id ? { ...e, status: e.status === 'Pendente' ? 'Concluído' : 'Pendente' } : e
      )
    );
  };

  const deleteEvent = (id: string) => {
    setEvents(events.filter((e) => e.id !== id));
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Agenda Comercial & Compromissos</h1>
          <p className="text-xs text-gray-400 mt-1">
            Gestão de compromissos corporativos, reuniões, entregas e cobranças programadas.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Compromisso</span>
        </button>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="bg-[#161B22] border border-gray-800 rounded-3xl p-10 shadow-2xl flex flex-col items-center justify-center text-center gap-3">
            <div className="p-4 bg-purple-500/10 text-purple-400 rounded-2xl">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-white">Nenhum compromisso na agenda</h3>
            <p className="text-xs text-gray-400 max-w-sm">
              Clique em "Novo Compromisso" para agendar reuniões, entregas, vencimentos e cobranças.
            </p>
          </div>
        ) : (
        events.map((e) => (
          <div
            key={e.id}
            className={`p-4 bg-[#161B22] border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
              e.status === 'Concluído' ? 'border-gray-800 opacity-60' : 'border-gray-800 hover:border-purple-500/40'
            }`}
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleStatus(e.id)}
                className={`p-2 rounded-xl transition-colors ${
                  e.status === 'Concluído' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      e.type === 'Vencimento'
                        ? 'bg-rose-500/20 text-rose-300'
                        : e.type === 'Reunião'
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {e.type}
                  </span>
                  <span className="text-[10px] font-bold text-amber-400">Prioridade: {e.priority}</span>
                </div>

                <h4 className={`text-sm font-bold text-white mt-1 ${e.status === 'Concluído' ? 'line-through text-gray-400' : ''}`}>
                  {e.title}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-between sm:justify-end">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>{formatDate(e.date)} às {e.time}</span>
              </div>

              <button
                onClick={() => deleteEvent(e.id)}
                className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 rounded-xl"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))
        )}
      </div>

      {/* Modal Add Event */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Novo Compromisso</h3>

            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Título do Compromisso</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Reunião com Diretores"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Horário</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Tipo de Evento</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  >
                    <option value="Reunião">Reunião</option>
                    <option value="Vencimento">Vencimento</option>
                    <option value="Cobrança">Cobrança</option>
                    <option value="Entrega">Entrega</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Prioridade</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
