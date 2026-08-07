import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { ProLaboreMode } from '../../types';
import {
  Wallet,
  Settings2,
  Plus,
  CheckCircle2,
  Clock3,
  Trash2,
  X,
  Percent,
  TrendingUp,
  Building2,
} from 'lucide-react';
import { formatBRL, formatDate, formatPercent } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';

const MODE_LABELS: Record<ProLaboreMode, string> = {
  fixed: 'Valor Fixo',
  percent_profit: '% do Líquido',
  percent_revenue: '% do Faturamento',
};

export const ProLaboreView: React.FC = () => {
  const {
    proLaboreConfig,
    updateProLaboreConfig,
    proLaborePayments,
    registerProLaborePayment,
    markProLaborePaid,
    deleteProLaborePayment,
    computeProLaboreAmount,
    monthIncomeOf,
    monthProfitOf,
    bankAccounts,
    addBankAccount,
  } = useERP();

  const [form, setForm] = useState({
    mode: proLaboreConfig.mode,
    fixedValue: String(proLaboreConfig.fixedValue),
    percentValue: String(proLaboreConfig.percentValue),
    paymentDay: String(proLaboreConfig.paymentDay),
    autoPay: proLaboreConfig.autoPay,
    bankAccount: proLaboreConfig.bankAccount || '',
  });
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [manualMonth, setManualMonth] = useState(new Date().toISOString().slice(0, 7));
  const [manualAmount, setManualAmount] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newAccountType, setNewAccountType] = useState<'Corrente' | 'Poupança' | 'Investimento' | 'Caixa Físico'>('Corrente');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newBalance, setNewBalance] = useState('');

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName || !newBalance) return;
    const newAcc = addBankAccount({
      bankName: newBankName,
      accountType: newAccountType,
      accountNumber: newAccountNumber || '00000-0',
      balance: parseFloat(newBalance) || 0,
      color: '#7C3AED',
    });
    setForm((prev) => ({ ...prev, bankAccount: newAcc.id }));
    setNewBankName('');
    setNewAccountNumber('');
    setNewBalance('');
    setIsAccountModalOpen(false);
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const revenue = monthIncomeOf(currentMonth);
  const profit = monthProfitOf(currentMonth);
  const expectedAmount = computeProLaboreAmount(currentMonth);

  const monthPayments = proLaborePayments.filter((p) => p.month === currentMonth);
  const paidAmount = monthPayments
    .filter((p) => p.status === 'Pago')
    .reduce((acc, p) => acc + p.amount, 0);
  const pendingAmount = monthPayments
    .filter((p) => p.status === 'Pendente')
    .reduce((acc, p) => acc + p.amount, 0);

  const handleSaveConfig = () => {
    updateProLaboreConfig({
      mode: form.mode,
      fixedValue: parseFloat(form.fixedValue) || 0,
      percentValue: parseFloat(form.percentValue) || 0,
      paymentDay: parseInt(form.paymentDay) || 5,
      autoPay: form.autoPay,
      bankAccount: form.bankAccount,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Pró-Labore</h1>
          <p className="text-xs text-gray-400 mt-1">
            Remuneração do(s) sócio(s). Configure o modo de cálculo e acompanhe os pagamentos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${
              form.autoPay
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            {form.autoPay ? 'Pagamento Automático' : 'Pagamento Manual'}
          </span>
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Pagamento</span>
          </button>
        </div>
      </div>

      {/* Resumo do Mês */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#161B22] border border-gray-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-gray-400 uppercase">Valor do Mês</span>
          <div className="text-2xl font-extrabold text-white mt-1">{formatBRL(expectedAmount)}</div>
          <div className="text-[10px] text-gray-500 mt-1">
            Modo: {MODE_LABELS[form.mode]}
          </div>
        </div>
        <div className="bg-[#161B22] border border-gray-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-gray-400 uppercase">Pago</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{formatBRL(paidAmount)}</div>
          <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Faturamento do mês: {formatBRL(revenue)}
          </div>
        </div>
        <div className="bg-[#161B22] border border-gray-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-gray-400 uppercase">Pendente</span>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">{formatBRL(pendingAmount)}</div>
          <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
            <Clock3 className="w-3 h-3" /> Líquido do mês: {formatBRL(profit)}
          </div>
        </div>
        <div className="bg-[#161B22] border border-gray-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-gray-400 uppercase">Participação</span>
          <div className="text-2xl font-extrabold text-purple-300 mt-1">
            {formatPercent(revenue > 0 ? (expectedAmount / revenue) * 100 : 0)}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">Sobre o faturamento</div>
        </div>
      </div>

      {/* Configuração */}
      <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-5">
          <Settings2 className="w-4 h-4 text-purple-400" />
          Configuração do Pró-Labore
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Modo de Cálculo</label>
            <select
              value={form.mode}
              onChange={(e) => setForm({ ...form, mode: e.target.value as ProLaboreMode })}
              className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
            >
              <option value="fixed">Valor Fixo</option>
              <option value="percent_profit">% do Líquido</option>
              <option value="percent_revenue">% do Faturamento</option>
            </select>
          </div>

          {form.mode === 'fixed' ? (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Valor Fixo (R$)</label>
              <input
                type="number"
                step="0.01"
                value={form.fixedValue}
                onChange={(e) => setForm({ ...form, fixedValue: e.target.value })}
                className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs font-bold"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Percentual (%) — {form.mode === 'percent_profit' ? 'sobre o líquido' : 'sobre o faturamento'}
              </label>
              <input
                type="number"
                step="0.1"
                value={form.percentValue}
                onChange={(e) => setForm({ ...form, percentValue: e.target.value })}
                className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs font-bold"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Dia do Pagamento</label>
            <input
              type="number"
              min={1}
              max={31}
              value={form.paymentDay}
              onChange={(e) => setForm({ ...form, paymentDay: e.target.value })}
              className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Conta Bancária</label>
        <div className="flex flex-wrap items-center gap-2">
              <select
                value={form.bankAccount}
                onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
                className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
              >
                <option value="">Selecionar conta...</option>
                {bankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(true)}
                className="flex items-center gap-1 px-3 py-2 bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600 hover:text-white rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer"
                title="Cadastrar nova conta bancária"
              >
                <Plus className="w-3.5 h-3.5" />
                Nova Conta
              </button>
            </div>
            {bankAccounts.length === 0 && (
              <p className="text-[10px] text-gray-500 mt-1">
                Nenhuma conta cadastrada ainda. Clique em "Nova Conta" para adicionar a conta que receberá o pró-labore.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-5 pt-5 border-t border-gray-800">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.autoPay}
              onChange={(e) => setForm({ ...form, autoPay: e.target.checked })}
              className="w-4 h-4 accent-purple-600"
            />
            <span className="text-xs font-semibold text-gray-300">
              Gerar pagamento automaticamente no dia {form.paymentDay || 5} de cada mês
            </span>
          </label>
          <button
            onClick={handleSaveConfig}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
          >
            {saved ? 'Configuração Salva ✓' : 'Salvar Configuração'}
          </button>
        </div>
      </div>

      {/* Histórico de Pagamentos */}
      <div className="bg-[#161B22] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Wallet className="w-4 h-4 text-purple-400" />
            Histórico de Pagamentos
          </h2>
          <span className="text-[10px] text-gray-500">Ordenado por mês (mais recente)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0D1117] text-gray-400 font-semibold border-b border-gray-800">
              <tr>
                <th className="p-4">Mês / Referência</th>
                <th className="p-4 text-right">Valor</th>
                <th className="p-4 text-center">Tipo</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4">Pagamento Efetivado</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {proLaborePayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Nenhum pagamento registrado ainda.
                  </td>
                </tr>
              ) : (
                proLaborePayments
                  .slice()
                  .sort((a, b) => b.month.localeCompare(a.month))
                  .map((p) => (
                    <tr key={p.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-4 font-bold text-white">{p.month.replace('-', '/')}</td>
                      <td className="p-4 text-right font-extrabold text-purple-300">{formatBRL(p.amount)}</td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                            p.paymentType === 'automatic'
                              ? 'bg-sky-500/10 text-sky-400'
                              : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          {p.paymentType === 'automatic' ? 'Automático' : 'Manual'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                            p.status === 'Pago'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400">{p.paidAt ? formatDate(p.paidAt) : '—'}</td>
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        {p.status === 'Pendente' && (
                          <button
                            onClick={() => markProLaborePaid(p.id)}
                            className="px-2.5 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors text-[11px] font-medium"
                          >
                            Marcar Pago
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteId(p.id)}
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

      {/* Registrar Pagamento Manual */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" />
                Registrar Pró-Labore
              </h3>
              <button onClick={() => setIsRegisterOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Mês / Referência</label>
                <input
                  type="month"
                  value={manualMonth}
                  onChange={(e) => setManualMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  placeholder={formatBRL(expectedAmount).replace('R$ ', '')}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs resize-none"
                />
              </div>
              <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-3 text-[11px] text-gray-400 flex items-start gap-2">
                <Percent className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  Sugestão do mês: <strong className="text-purple-300">{formatBRL(expectedAmount)}</strong> — o valor
                  ficará como <strong className="text-amber-300">Pendente</strong> até você marcá-lo como pago.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (!manualAmount || parseFloat(manualAmount) <= 0) return;
                    registerProLaborePayment({
                      month: manualMonth,
                      amount: parseFloat(manualAmount),
                      status: 'Pendente',
                      paymentType: 'manual',
                      notes: manualNotes,
                    });
                    setIsRegisterOpen(false);
                    setManualAmount('');
                    setManualNotes('');
                  }}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30"
                >
                  Registrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nova Conta Bancária */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                Cadastrar Nova Conta Bancária
              </h3>
              <button onClick={() => setIsAccountModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Nome da Instituição / Banco</label>
                <input
                  type="text"
                  required
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  placeholder="Ex: Banco Itaú / Nubank PJ"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Tipo de Conta</label>
                <select
                  value={newAccountType}
                  onChange={(e) => setNewAccountType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                >
                  <option value="Corrente">Conta Corrente</option>
                  <option value="Poupança">Conta Poupança</option>
                  <option value="Investimento">Conta de Investimento</option>
                  <option value="Caixa Físico">Caixa Físico / PDV</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Número da Conta / Agência</label>
                <input
                  type="text"
                  value={newAccountNumber}
                  onChange={(e) => setNewAccountNumber(e.target.value)}
                  placeholder="12345-6"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Saldo Atual (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30"
                >
                  Salvar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        title="Excluir Pagamento"
        message="Tem certeza que deseja remover este registro de pró-labore? A transação financeira vinculada permanecerá."
        onConfirm={() => {
          if (deleteId) deleteProLaborePayment(deleteId);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
