import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Transaction,
  TransactionType,
  TransactionCategory,
  PaymentMethod,
  TransactionStatus,
} from '../../types';
import {
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Clock,
  Trash2,
  Edit,
  FileText,
  Paperclip,
  X,
  Sparkles,
} from 'lucide-react';
import { formatBRL, formatDate } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';

export const FinanceView: React.FC = () => {
  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    bankAccounts,
    filteredDateRange,
  } = useERP();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [type, setType] = useState<TransactionType>('Saída');
  const [category, setCategory] = useState<TransactionCategory>('Outros');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [bankAccount, setBankAccount] = useState('acc_1');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<TransactionStatus>('Pago');
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');

  const categoriesList: TransactionCategory[] = [
    'Aluguel',
    'Salário',
    'Marketing',
    'Fornecedor',
    'Internet',
    'Energia',
    'Água',
    'Combustível',
    'Investimentos',
    'Vendas',
    'Outros',
  ];

  // Filtered List
  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesDate = t.date >= filteredDateRange.startDate && t.date <= filteredDateRange.endDate;

    return matchesSearch && matchesCat && matchesStatus && matchesType && matchesDate;
  });

  const totalInflow = filtered
    .filter((t) => t.type === 'Entrada' && t.status === 'Pago')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalOutflow = filtered
    .filter((t) => t.type === 'Saída' && t.status === 'Pago')
    .reduce((acc, t) => acc + t.amount, 0);

  const handleOpenModal = (tx?: Transaction, defaultType?: TransactionType) => {
    if (tx) {
      setEditingTx(tx);
      setType(tx.type);
      setCategory(tx.category);
      setDescription(tx.description);
      setAmount(String(tx.amount));
      setPaymentMethod(tx.paymentMethod);
      setBankAccount(tx.bankAccount || 'acc_1');
      setDate(tx.date);
      setStatus(tx.status);
      setNotes(tx.notes || '');
      setReceiptUrl(tx.receiptUrl || '');
    } else {
      setEditingTx(null);
      setType(defaultType || 'Saída');
      setCategory(defaultType === 'Entrada' ? 'Vendas' : 'Outros');
      setDescription('');
      setAmount('');
      setPaymentMethod('PIX');
      setBankAccount('acc_1');
      setDate(new Date().toISOString().split('T')[0]);
      setStatus('Pago');
      setNotes('');
      setReceiptUrl('');
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    if (editingTx) {
      updateTransaction(editingTx.id, {
        type,
        category,
        description,
        amount: parsedAmount,
        paymentMethod,
        bankAccount,
        date,
        status,
        notes,
        receiptUrl,
      });
    } else {
      addTransaction({
        type,
        category,
        description,
        amount: parsedAmount,
        paymentMethod,
        bankAccount,
        date,
        status,
        notes,
        receiptUrl,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Gestão Financeira</h1>
          <p className="text-xs text-gray-400 mt-1">
            Controle de lançamentos de entradas, saídas, receitas e despesas operacionais.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(undefined, 'Entrada')}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Entrada</span>
          </button>

          <button
            onClick={() => handleOpenModal(undefined, 'Saída')}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-900/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Saída</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#161B22] border border-gray-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Entradas (Receitas)</span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">{formatBRL(totalInflow)}</div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#161B22] border border-gray-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Saídas (Despesas)</span>
            <div className="text-2xl font-extrabold text-rose-400 mt-1">{formatBRL(totalOutflow)}</div>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#161B22] border border-gray-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Resultado Período</span>
            <div className="text-2xl font-extrabold text-purple-300 mt-1">{formatBRL(totalInflow - totalOutflow)}</div>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por descrição..."
            className="w-full pl-10 pr-4 py-2 bg-[#0D1117] border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-[#0D1117] border border-gray-800 text-gray-300 rounded-xl text-xs focus:outline-hidden"
          >
            <option value="all">Todas as Categorias</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-[#0D1117] border border-gray-800 text-gray-300 rounded-xl text-xs focus:outline-hidden"
          >
            <option value="all">Todos os Tipos</option>
            <option value="Entrada">Entradas</option>
            <option value="Saída">Saídas</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#0D1117] border border-gray-800 text-gray-300 rounded-xl text-xs focus:outline-hidden"
          >
            <option value="all">Todos os Status</option>
            <option value="Pago">Pago / Recebido</option>
            <option value="Pendente">Pendente</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#161B22] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0D1117] text-gray-400 font-semibold border-b border-gray-800">
              <tr>
                <th className="p-4">Tipo</th>
                <th className="p-4">Descrição</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Data</th>
                <th className="p-4">Forma Pagto</th>
                <th className="p-4 text-right">Valor</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    Nenhum lançamento encontrado para este filtro.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg text-[10px] ${
                          tx.type === 'Entrada'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {tx.type === 'Entrada' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {tx.type}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-white max-w-xs truncate">{tx.description}</td>
                    <td className="p-4 text-gray-300 font-medium">{tx.category}</td>
                    <td className="p-4 text-gray-400">{formatDate(tx.date)}</td>
                    <td className="p-4 text-gray-300">{tx.paymentMethod}</td>
                    <td
                      className={`p-4 text-right font-extrabold ${
                        tx.type === 'Entrada' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {tx.type === 'Entrada' ? '+' : '-'} {formatBRL(tx.amount)}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          tx.status === 'Pago'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : tx.status === 'Pendente'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-gray-800 text-gray-500'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(tx)}
                        className="p-1.5 text-gray-400 hover:text-white bg-gray-800/60 rounded-lg transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(tx.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cadastrar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
              <h3 className="text-base font-bold text-white">
                {editingTx ? 'Editar Lançamento' : 'Novo Lançamento Financeiro'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Tipo de Operação</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as TransactionType)}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  >
                    <option value="Entrada">Entrada (Receita)</option>
                    <option value="Saída">Saída (Despesa)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  >
                    {categoriesList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Pagamento de Fornecedor / Aluguel do Mês"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Forma de Pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  >
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Transferência">Transferência</option>
                  </select>
                </div>
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
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs font-semibold"
                  >
                    <option value="Pago">Pago / Recebido</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informações adicionais do lançamento..."
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Excluir Lançamento Financeiro"
        message="Tem certeza que deseja excluir esta transação? A ação não poderá ser desfeita."
        onConfirm={() => {
          if (deleteId) deleteTransaction(deleteId);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
