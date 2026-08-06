import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Landmark,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  PieChart,
  FileText,
  Wallet,
  Pencil,
  X,
} from 'lucide-react';
import { formatBRL } from '../../utils/formatters';
import { BankAccount } from '../../types';

export const AccountsView: React.FC = () => {
  const { bankAccounts, transactions, addBankAccount, updateBankAccount } = useERP();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState<'Corrente' | 'Poupança' | 'Investimento' | 'Caixa Físico'>('Corrente');
  const [accountNumber, setAccountNumber] = useState('');
  const [balance, setBalance] = useState('');

  // Edit Modal State
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [editBalance, setEditBalance] = useState('');

  // Total Balance
  const totalBalance = bankAccounts.reduce((acc, b) => acc + b.balance, 0);

  // Accounts Payable & Receivable
  const pendingReceivables = transactions
    .filter((t) => t.type === 'Entrada' && t.status === 'Pendente')
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingPayables = transactions
    .filter((t) => t.type === 'Saída' && t.status === 'Pendente')
    .reduce((acc, t) => acc + t.amount, 0);

  // DRE Calculations (Income statement)
  const grossRevenue = transactions
    .filter((t) => t.type === 'Entrada' && t.status === 'Pago')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalCosts = transactions
    .filter((t) => t.type === 'Saída' && t.category === 'Fornecedor' && t.status === 'Pago')
    .reduce((acc, t) => acc + t.amount, 0);

  const grossProfit = grossRevenue - totalCosts;

  const operatingExpenses = transactions
    .filter((t) => t.type === 'Saída' && t.category !== 'Fornecedor' && t.status === 'Pago')
    .reduce((acc, t) => acc + t.amount, 0);

  const netOperatingProfit = grossProfit - operatingExpenses;

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !balance) return;

    addBankAccount({
      bankName,
      accountType,
      accountNumber: accountNumber || '00000-0',
      balance: parseFloat(balance) || 0,
      color: '#7C3AED',
    });

    setBankName('');
    setBalance('');
    setIsModalOpen(false);
  };

  const handleOpenEdit = (acc: BankAccount) => {
    setEditingAccount(acc);
    setEditBalance(String(acc.balance));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    updateBankAccount(editingAccount.id, { balance: parseFloat(editBalance) || 0 });
    setEditingAccount(null);
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Contas Bancárias & DRE Executivo</h1>
          <p className="text-xs text-gray-400 mt-1">
            Gestão de saldos conciliados em bancos, contas a pagar/receber e Demonstrativo do Resultado (DRE).
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Conta Bancária</span>
        </button>
      </div>

      {/* Accounts Payable / Receivable Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#161B22] border border-gray-800 p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Saldo Geral Conciliado</span>
            <div className="text-2xl font-extrabold text-white mt-1">{formatBRL(totalBalance)}</div>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#161B22] border border-gray-800 p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Contas a Receber (A Vencer)</span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">{formatBRL(pendingReceivables)}</div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#161B22] border border-gray-800 p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Contas a Pagar (A Vencer)</span>
            <div className="text-2xl font-extrabold text-rose-400 mt-1">{formatBRL(pendingPayables)}</div>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Bank Accounts Grid */}
      <div>
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Landmark className="w-5 h-5 text-purple-400" />
          Contas Bancárias & Caixas Registrados
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {bankAccounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-[#161B22] border border-gray-800 rounded-3xl p-5 shadow-xl hover:border-purple-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg">
                    {acc.accountType}
                  </span>
                  <span className="text-[10px] text-gray-500">Ag/Cc: {acc.accountNumber}</span>
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{acc.bankName}</h4>
                  <button
                    onClick={() => handleOpenEdit(acc)}
                    className="p-1.5 text-gray-400 hover:text-white bg-gray-800/60 rounded-lg transition-colors cursor-pointer"
                    title="Editar saldo"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-gray-800">
                <span className="text-[10px] text-gray-400 block font-medium">Saldo Atual (Conciliado)</span>
                <span className="text-xl font-extrabold text-emerald-400">{formatBRL(acc.balance)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DRE (Demonstrativo de Resultado do Exercício) */}
      <div className="bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              DRE - Demonstrativo do Resultado do Exercício
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Estrutura contábil e comercial de liquidez referente ao período selecionado.
            </p>
          </div>
          <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-xl">
            Regime de Caixa
          </span>
        </div>

        <div className="space-y-3 text-xs">
          {/* 1. Receita Bruta */}
          <div className="flex justify-between items-center p-3 bg-[#0D1117] rounded-xl border border-gray-800">
            <span className="font-bold text-white">(+) RECEITA BRUTA DAS VENDAS E SERVIÇOS</span>
            <span className="font-extrabold text-emerald-400 text-sm">{formatBRL(grossRevenue)}</span>
          </div>

          {/* 2. Custos */}
          <div className="flex justify-between items-center p-3 bg-[#0D1117] rounded-xl border border-gray-800">
            <span className="font-medium text-rose-300">(-) Custo dos Produtos / Mercadorias Vendidas (CMV)</span>
            <span className="font-bold text-rose-400">- {formatBRL(totalCosts)}</span>
          </div>

          {/* 3. Líquido Bruto */}
          <div className="flex justify-between items-center p-3 bg-purple-950/20 rounded-xl border border-purple-500/30">
            <span className="font-extrabold text-purple-300">(=) LÍQUIDO BRUTO COMERCIAL</span>
            <span className="font-extrabold text-purple-300 text-sm">{formatBRL(grossProfit)}</span>
          </div>

          {/* 4. Despesas Operacionais */}
          <div className="flex justify-between items-center p-3 bg-[#0D1117] rounded-xl border border-gray-800">
            <span className="font-medium text-rose-300">(-) Despesas Operacionais (Aluguel, Salários, Mkt, Conectividade)</span>
            <span className="font-bold text-rose-400">- {formatBRL(operatingExpenses)}</span>
          </div>

          {/* 5. Líquido Final */}
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-950/40 via-[#161B22] to-emerald-950/40 rounded-2xl border border-emerald-500/40">
            <div>
              <span className="font-extrabold text-white text-sm block">(=) RESULTADO LÍQUIDO DO EXERCÍCIO</span>
              <span className="text-[10px] text-gray-400">Líquido operacional limpo disponível para distribuição</span>
            </div>
            <span className="font-extrabold text-emerald-400 text-xl">{formatBRL(netOperatingProfit)}</span>
          </div>
        </div>
      </div>

      {/* Modal Add Bank Account */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Adicionar Nova Conta Bancária</h3>

            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Nome da Instituição / Banco</label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Ex: Banco Itaú / Nubank PJ"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Tipo de Conta</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as any)}
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
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
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
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs font-bold"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Saldo manual e conciliado — não é recalculado automaticamente pelos lançamentos.
                </p>
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
                  Salvar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Saldo */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
              <h3 className="text-base font-bold text-white">Ajustar Saldo</h3>
              <button onClick={() => setEditingAccount(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Saldo Atual de {editingAccount.bankName}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs font-bold"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Informe o saldo que aparece no banco / caixa físico. Este valor é usado no Capital de Giro e na
                  Reserva Financeira.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-4 py-2 text-xs text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl"
                >
                  Salvar Saldo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
