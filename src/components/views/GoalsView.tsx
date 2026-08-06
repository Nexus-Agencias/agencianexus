import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Goal, RankingEntry } from '../../types';
import { Target, Trophy, Award, TrendingUp, Plus, Edit, Trash2, X, Sparkles } from 'lucide-react';
import { formatBRL, formatDate } from '../../utils/formatters';

export const GoalsView: React.FC = () => {
  const { goals, addGoal, updateGoal, deleteGoal, ranking, addRanking, updateRanking, deleteRanking } = useERP();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);
  const [rankingEditingId, setRankingEditingId] = useState<string | null>(null);
  const [rankName, setRankName] = useState('');
  const [rankAmount, setRankAmount] = useState('');

  const sortedRanking = ranking.slice().sort((a, b) => b.amount - a.amount);

  const openRankingCreateModal = () => {
    setRankingEditingId(null);
    setRankName('');
    setRankAmount('');
    setIsRankingModalOpen(true);
  };

  const openRankingEditModal = (entry: RankingEntry) => {
    setRankingEditingId(entry.id);
    setRankName(entry.name);
    setRankAmount(String(entry.amount));
    setIsRankingModalOpen(true);
  };

  const handleRankingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rankName || !rankAmount) return;
    const payload = { name: rankName, amount: parseFloat(rankAmount) || 0 };
    if (rankingEditingId) {
      updateRanking(rankingEditingId, payload);
    } else {
      addRanking(payload);
    }
    setIsRankingModalOpen(false);
  };

  const rankBadgeClass = (index: number) => {
    if (index === 0) return 'bg-amber-500/20 text-amber-300';
    if (index === 1) return 'bg-gray-500/20 text-gray-300';
    if (index === 2) return 'bg-amber-700/20 text-amber-500';
    return 'bg-purple-500/20 text-purple-300';
  };

  const openCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setTargetAmount('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingId(goal.id);
    setTitle(goal.title);
    setTargetAmount(String(goal.targetAmount));
    setStartDate(goal.startDate);
    setEndDate(goal.endDate);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetAmount) return;

    const payload = {
      title,
      targetAmount: parseFloat(targetAmount) || 0,
      startDate,
      endDate,
    };

    if (editingId) {
      updateGoal(editingId, payload);
    } else {
      addGoal({
        ...payload,
        currentAmount: 0,
        metric: 'Receita',
        status: 'Em Andamento',
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Metas & Desempenho Comercial</h1>
          <p className="text-xs text-gray-400 mt-1">
            Acompanhamento de objetivos financeiros, porcentagem de atingimento e ranking.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Nova Meta</span>
        </button>
      </div>

      {/* Goals Progress Cards */}
      {goals.length === 0 ? (
        <div className="bg-[#161B22] border border-gray-800 rounded-3xl p-10 shadow-2xl flex flex-col items-center justify-center text-center gap-3">
          <div className="p-4 bg-purple-500/10 text-purple-400 rounded-2xl">
            <Target className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-white">Nenhuma meta cadastrada</h3>
          <p className="text-xs text-gray-400 max-w-sm">
            Clique em "Criar Nova Meta" para definir um objetivo financeiro e acompanhar o atingimento aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal) => {
          const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const isAchieved = pct >= 100;

          return (
            <div
              key={goal.id}
              className="bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                    {goal.status || 'Em Andamento'}
                  </span>
                  <h3 className="text-base font-bold text-white mt-2">{goal.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Período: {formatDate(goal.startDate)} até {formatDate(goal.endDate)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`p-3 rounded-2xl ${
                      isAchieved ? 'bg-amber-500/10 text-amber-400' : 'bg-purple-500/10 text-purple-400'
                    }`}
                  >
                    {isAchieved ? <Trophy className="w-6 h-6" /> : <Target className="w-6 h-6" />}
                  </div>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-gray-300">
                    Atingido: <span className="text-emerald-400">{formatBRL(goal.currentAmount)}</span>
                  </span>
                  <span className="text-purple-300">{pct}%</span>
                </div>

                <div className="w-full bg-[#0D1117] h-3.5 rounded-full overflow-hidden p-0.5 border border-gray-800">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-400 rounded-full transition-all duration-1000"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>0%</span>
                  <span>Alvo: {formatBRL(goal.targetAmount)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800/80">
                <button
                  onClick={() => openEditModal(goal)}
                  className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-gray-300 hover:text-white bg-gray-800/60 hover:bg-gray-700/60 rounded-lg transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir
                </button>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Seller Performance Hall of Fame */}
      <div className="bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Ranking de Performance Comercial
          </h3>
          <button
            onClick={openRankingCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Colocação
          </button>
        </div>

        {sortedRanking.length === 0 ? (
          <div className="bg-[#0D1117] border border-dashed border-gray-800 rounded-2xl p-8 text-center">
            <p className="text-xs text-gray-500">
              Nenhuma colocação no ranking. Clique em "Adicionar Colocação" para cadastrar um colaborador / canal de vendas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedRanking.map((entry, index) => (
              <div
                key={entry.id}
                className="p-4 bg-[#0D1117] border border-gray-800 rounded-2xl flex items-center gap-3"
              >
                <div
                  className={`w-10 h-10 rounded-xl font-extrabold flex items-center justify-center text-lg shrink-0 ${rankBadgeClass(index)}`}
                >
                  {index + 1}º
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate">{entry.name}</h4>
                  <p className="text-[10px] text-emerald-400 font-bold">{formatBRL(entry.amount)} em vendas</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openRankingEditModal(entry)}
                    className="p-1.5 text-gray-400 hover:text-white bg-gray-800/60 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteRanking(entry.id)}
                    className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-500/10 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Add/Edit Ranking */}
      {isRankingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                {rankingEditingId ? 'Editar Colocação' : 'Adicionar Colocação'}
              </h3>
              <button onClick={() => setIsRankingModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRankingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Nome / Canal</label>
                <input
                  type="text"
                  required
                  value={rankName}
                  onChange={(e) => setRankName(e.target.value)}
                  placeholder="Ex: Maria Silva / Vendas Online"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Valor em Vendas (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={rankAmount}
                  onChange={(e) => setRankAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsRankingModalOpen(false)}
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

      {/* Modal Add/Edit Goal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">
              {editingId ? 'Editar Meta Comercial' : 'Criar Nova Meta Comercial'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Título da Meta</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Meta de Vendas Black Friday"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Valor Alvo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="50000.00"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Data Início</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Data Fim</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  />
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
                  Salvar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
