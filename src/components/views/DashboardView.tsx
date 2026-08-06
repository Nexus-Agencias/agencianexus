import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Coins,
  ShoppingCart,
  Users,
  Package,
  HandCoins,
  CreditCard,
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Target,
  BarChart2,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Activity,
  Layers,
  Percent,
  PiggyBank,
  Receipt,
  Bell,
  ShieldCheck,
  UserCog,
  Pencil,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatBRL, formatNumber, formatDate } from '../../utils/formatters';
import { buildAlerts, computeHealthScore } from '../../utils/financialHealth';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const PALETTE = ['#7C3AED', '#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4'];

interface VariationBadgeProps {
  value: number | null;
  label: string;
  invert?: boolean;
}

const VariationBadge: React.FC<VariationBadgeProps> = ({ value, label, invert = false }) => {
  if (value === null || value === undefined || isNaN(value)) {
    return <span className="text-[11px] text-gray-500 font-medium">Sem base de comparação</span>;
  }
  const positive = value >= 0;
  const good = invert ? !positive : positive;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  const color = good ? 'text-emerald-400' : 'text-rose-400';
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      {positive ? '+' : ''}
      {value.toFixed(1)}%
      <span className="text-gray-500 font-normal">{label}</span>
    </span>
  );
};

interface KpiCardProps {
  title: string;
  value: string;
  valueClass?: string;
  icon: React.ReactNode;
  accent: string;
  footer?: React.ReactNode;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, valueClass = 'text-white', icon, accent, footer }) => (
  <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-5 shadow-sm transition-all group hover:border-gray-600">
    <div className="flex items-center justify-between mb-3">
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{title}</span>
      <div className={`p-2 rounded-lg ${accent} transition-transform group-hover:scale-105`}>{icon}</div>
    </div>
    <div className={`text-2xl xl:text-[27px] font-bold tracking-tight leading-none ${valueClass}`}>{value}</div>
    {footer && <div className="mt-3 pt-3 border-t border-gray-800/80">{footer}</div>}
  </div>
);

interface OperationCardProps {
  title: string;
  mainValue: string;
  mainClass?: string;
  icon: React.ReactNode;
  accent: string;
  subs: { label: string; value: string; className?: string }[];
  onClick?: () => void;
}

const OperationCard: React.FC<OperationCardProps> = ({
  title,
  mainValue,
  mainClass = 'text-white',
  icon,
  accent,
  subs,
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`bg-[#161B22] border border-gray-800 rounded-2xl p-4 shadow-sm transition-all group ${
      onClick ? 'cursor-pointer hover:border-purple-500/40' : 'hover:border-gray-600'
    }`}
  >
    <div className="flex items-center justify-between mb-2.5">
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{title}</span>
      <div className={`p-1.5 rounded-lg ${accent} transition-transform group-hover:scale-105`}>{icon}</div>
    </div>
    <div className={`text-xl font-bold tracking-tight leading-none ${mainClass}`}>{mainValue}</div>
    <div className="mt-3 pt-2.5 border-t border-gray-800/80 space-y-1.5">
      {subs.map((s) => (
        <div key={s.label} className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-gray-500">{s.label}</span>
          <span className={`text-[11px] font-semibold ${s.className || 'text-gray-300'}`}>{s.value}</span>
        </div>
      ))}
    </div>
  </div>
);

export const DashboardView: React.FC = () => {
  const {
    transactions,
    sales,
    customers,
    products,
    bankAccounts,
    goals,
    addGoal,
    updateGoal,
    filteredDateRange,
    setActiveTab,
    proLaboreConfig,
    proLaborePayments,
    computeProLaboreAmount,
    monthIncomeOf,
    monthProfitOf,
  } = useERP();

  const [chartType, setChartType] = useState<'area' | 'bar' | 'line'>('area');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalTargetInput, setGoalTargetInput] = useState('');
  const [goalPeriodInput, setGoalPeriodInput] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);

  const todayStr = new Date().toISOString().split('T')[0];
  const refDate = filteredDateRange.endDate || todayStr;
  const currentMonthKey = refDate.slice(0, 7);
  const [refYear, refMonthIdx] = currentMonthKey.split('-').map(Number);
  const prevMonthKey =
    refMonthIdx === 1 ? `${refYear - 1}-12` : `${refYear}-${String(refMonthIdx - 1).padStart(2, '0')}`;

  const refDateObj = new Date(refDate + 'T00:00:00');
  const refYearFull = refDateObj.getFullYear();
  const refMonthZero = refDateObj.getMonth();

  // Filter transactions and sales by current date range
  const rangeTransactions = transactions.filter(
    (t) => t.date >= filteredDateRange.startDate && t.date <= filteredDateRange.endDate
  );
  const rangeSales = sales.filter((s) => {
    const sDate = s.createdAt.split('T')[0];
    return sDate >= filteredDateRange.startDate && sDate <= filteredDateRange.endDate;
  });

  const sumPaidByMonth = (type: 'Entrada' | 'Saída', monthKey: string) =>
    transactions
      .filter((t) => t.type === type && t.status === 'Pago' && t.date.startsWith(monthKey))
      .reduce((acc, t) => acc + t.amount, 0);

  // --- Financial KPIs -----------------------------------------------------
  const totalBalance = bankAccounts.reduce((acc, b) => acc + b.balance, 0);

  const monthIncome = sumPaidByMonth('Entrada', currentMonthKey);
  const monthExpenses = sumPaidByMonth('Saída', currentMonthKey);
  const prevIncome = sumPaidByMonth('Entrada', prevMonthKey);
  const prevExpenses = sumPaidByMonth('Saída', prevMonthKey);

  const netProfit = monthIncome - monthExpenses;
  const profitMargin = monthIncome > 0 ? (netProfit / monthIncome) * 100 : 0;

  const monthNetFlow = monthIncome - monthExpenses;
  const balanceAtStartOfMonth = totalBalance - monthNetFlow;
  const balanceVariation = balanceAtStartOfMonth !== 0 ? (monthNetFlow / balanceAtStartOfMonth) * 100 : null;

  const revenueGrowth = prevIncome > 0 ? ((monthIncome - prevIncome) / prevIncome) * 100 : null;
  const expenseVariation = prevExpenses > 0 ? ((monthExpenses - prevExpenses) / prevExpenses) * 100 : null;

  // --- Operational KPIs ---------------------------------------------------
  const totalSalesCount = rangeSales.length;
  const salesRevenue = rangeSales.reduce((acc, s) => acc + s.total, 0);
  const averageTicket = totalSalesCount > 0 ? salesRevenue / totalSalesCount : 0;

  const activeCustomers = customers.filter((c) => (c.totalSpent || 0) > 0).length;
  const newCustomersThisMonth = customers.filter((c) => (c.createdAt || '').slice(0, 7) === currentMonthKey).length;

  const lowStockProducts = products.filter((p) => p.stockQuantity <= p.minStockQuantity).length;
  const noStockProducts = products.filter((p) => p.stockQuantity <= 0).length;

  const receivableTxs = transactions.filter((t) => t.type === 'Entrada' && t.status === 'Pendente');
  const accountsReceivable = receivableTxs.reduce((acc, t) => acc + t.amount, 0);
  const overdueReceivable = receivableTxs.filter((t) => t.date < todayStr).reduce((acc, t) => acc + t.amount, 0);

  const payableTxs = transactions.filter((t) => t.type === 'Saída' && t.status === 'Pendente');
  const accountsPayable = payableTxs.reduce((acc, t) => acc + t.amount, 0);
  const nextDueDate = payableTxs
    .map((t) => t.date)
    .sort()
    .find((d) => d >= todayStr);

  const cashFlow = monthNetFlow;
  const cashFlowPositive = cashFlow >= 0;

  // --- Pró-Labore ---------------------------------------------------------
  const expectedProLabore = computeProLaboreAmount(currentMonthKey);
  const proLaboreOfMonth = proLaborePayments.filter((p) => p.month === currentMonthKey);
  const proLaborePaid = proLaboreOfMonth
    .filter((p) => p.status === 'Pago')
    .reduce((a, p) => a + p.amount, 0);
  const proLaborePending = proLaboreOfMonth
    .filter((p) => p.status === 'Pendente')
    .reduce((a, p) => a + p.amount, 0);
  const proLaborePctRevenue = monthIncome > 0 ? (expectedProLabore / monthIncome) * 100 : 0;
  const proLaborePctProfit = monthProfitOf(currentMonthKey) > 0 ? (expectedProLabore / monthProfitOf(currentMonthKey)) * 100 : 0;

  // --- KPI avançados (Linha 3) -------------------------------------------
  const prevMonthsProfit = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(refYearFull, refMonthZero - (1 + i), 1);
    return sumPaidByMonth('Entrada', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`) -
      sumPaidByMonth('Saída', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }).filter((v) => v !== 0);
  const prev3MonthsAvgProfit = prevMonthsProfit.length
    ? prevMonthsProfit.reduce((a, b) => a + b, 0) / prevMonthsProfit.length
    : 0;

  const avgMonthExpenses =
    prevMonthsProfit.length > 0
      ? Array.from({ length: 3 }, (_, i) => {
          const d = new Date(refYearFull, refMonthZero - (1 + i), 1);
          return sumPaidByMonth('Saída', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }).reduce((a, b) => a + b, 0) / prevMonthsProfit.length
      : monthExpenses || 1;
  const reserveTarget = avgMonthExpenses * 3;
  const reserveProgress = Math.min(100, (totalBalance / (reserveTarget || 1)) * 100);

  const cogs = rangeSales.reduce(
    (acc, s) =>
      acc +
      s.items.reduce((sum, it) => {
        const p = products.find((prod) => prod.id === it.productId);
        return sum + (p ? p.costPrice * it.quantity : 0);
      }, 0),
    0
  );
  const roi = cogs > 0 ? ((salesRevenue - cogs) / cogs) * 100 : 0;

  const stockValue = products.reduce((acc, p) => acc + p.stockQuantity * p.costPrice, 0);
  const workingCapital = totalBalance + accountsReceivable + stockValue - accountsPayable;

  const goalTargetForMonth = (monthKey: string): number => {
    const g = goals.find((goal) => {
      const gStart = (goal.startDate || '').slice(0, 7);
      const gEnd = (goal.endDate || '').slice(0, 7);
      return gStart <= monthKey && gEnd >= monthKey;
    });
    return g ? g.targetAmount : 0;
  };

  const mainGoal =
    goals.find((g) => {
      const gStart = (g.startDate || '').slice(0, 7);
      const gEnd = (g.endDate || '').slice(0, 7);
      return gStart <= currentMonthKey && gEnd >= currentMonthKey;
    }) ||
    goals[0] ||
    { targetAmount: 250000, currentAmount: monthIncome };
  const goalProgress = Math.min(100, (monthIncome / (mainGoal.targetAmount || 1)) * 100);

  const openGoalEditor = () => {
    setGoalTargetInput(String(mainGoal.targetAmount || ''));
    setGoalPeriodInput(
      mainGoal.startDate?.slice(0, 7) || goalPeriodInput
    );
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(goalTargetInput) || 0;
    if (target <= 0) return;

    const period = goalPeriodInput || `${new Date().getFullYear()}-01`;
    const startDate = `${period}-01`;
    const lastDay = new Date(Number(period.slice(0, 4)), Number(period.slice(5, 7)), 0).getDate();
    const endDate = `${period}-${String(lastDay).padStart(2, '0')}`;

    const existing = goals.find((g) => {
      const gStart = (g.startDate || '').slice(0, 7);
      const gEnd = (g.endDate || '').slice(0, 7);
      return gStart <= period && gEnd >= period;
    });

    if (existing) {
      updateGoal(existing.id, { targetAmount: target, startDate, endDate });
    } else {
      addGoal({
        title: 'Meta Mensal',
        targetAmount: target,
        currentAmount: 0,
        startDate,
        endDate,
        metric: 'Receita',
        status: 'Em Andamento',
      });
    }
    setIsGoalModalOpen(false);
  };

  // --- Alertas e Saúde Financeira ----------------------------------------
  const healthInput = {
    todayStr,
    transactions,
    products,
    goalTarget: mainGoal.targetAmount,
    goalProgress,
    monthIncome,
    monthProfit: netProfit,
    prev3MonthsAvgProfit,
    monthNetFlow: cashFlow,
    proLaboreAmount: expectedProLabore,
    proLaborePaid,
    proLaboreMode: proLaboreConfig.mode,
  };
  const alerts = buildAlerts(healthInput);
  const health = computeHealthScore(healthInput);

  const healthColor =
    health.score >= 80 ? 'text-emerald-400' : health.score >= 60 ? 'text-lime-400' : health.score >= 40 ? 'text-amber-400' : 'text-rose-400';
  const healthBar =
    health.score >= 80 ? 'from-emerald-500 to-lime-400' : health.score >= 60 ? 'from-lime-500 to-amber-400' : health.score >= 40 ? 'from-amber-500 to-orange-400' : 'from-rose-500 to-red-400';
  const alertColors: Record<string, string> = {
    danger: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    info: 'bg-sky-500/10 border-sky-500/30 text-sky-300',
  };

  // --- Charts -------------------------------------------------------------
  const chartData = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(refYearFull, refMonthZero - (7 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const income = sumPaidByMonth('Entrada', key);
    const expenses = sumPaidByMonth('Saída', key);
    return { name: MONTHS[d.getMonth()], Receitas: income, Despesas: expenses, Líquido: income - expenses, Meta: goalTargetForMonth(key) };
  });

  const paymentMethodData = (['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Boleto', 'Dinheiro', 'Transferência'] as const)
    .map((method) => ({ name: method, value: rangeSales.filter((s) => s.paymentMethod === method).length }))
    .filter((d) => d.value > 0)
    .map((d, i) => ({ ...d, color: PALETTE[i % PALETTE.length] }));

  const categoryMap = new Map<string, number>();
  products.forEach((p) => categoryMap.set(p.category, (categoryMap.get(p.category) || 0) + 1));
  const categoryData = Array.from(categoryMap.entries()).map(([name, value], i) => ({
    name,
    value,
    color: PALETTE[i % PALETTE.length],
  }));

  // --- Meta por Mês (tabela comparativa) --------------------------------
  const monthlyGoalData = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(refYearFull, refMonthZero - (7 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const income = sumPaidByMonth('Entrada', key);
    const expenses = sumPaidByMonth('Saída', key);
    const meta = goalTargetForMonth(key);
    return {
      key,
      label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      meta,
      income,
      expenses,
      net: income - expenses,
      pct: meta > 0 ? (income / meta) * 100 : null,
      isCurrent: key === currentMonthKey,
    };
  });

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-900/30 via-[#161B22] to-[#161B22] p-6 rounded-3xl border border-purple-500/20 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold tracking-wider uppercase mb-1">
            <Sparkles className="w-4 h-4" /> Visão Geral da Empresa
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Dashboard Financeiro</h1>
          <p className="text-xs text-gray-400 mt-1">
            Indicadores calculados automaticamente a partir das movimentações financeiras e comerciais.
          </p>
        </div>

        {/* Goal Quick Card */}
        <div className="bg-[#0D1117]/80 p-4 rounded-2xl border border-gray-800/80 min-w-[240px]">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400 font-medium">Meta de Receita Mensal</span>
            <div className="flex items-center gap-1.5">
              <span className="text-purple-400 font-bold">{goalProgress.toFixed(1)}%</span>
              <button
                onClick={openGoalEditor}
                className="p-1 text-gray-400 hover:text-white bg-gray-800/60 rounded-lg transition-colors"
                title="Editar meta mensal"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden my-1.5">
            <div
              className="bg-gradient-to-r from-purple-600 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white font-semibold">{formatBRL(monthIncome)}</span>
            <span className="text-gray-500">Alvo: {formatBRL(mainGoal.targetAmount)}</span>
          </div>
        </div>
      </div>

      {/* ===================== Gráfico de Desempenho Financeiro (topo) ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Revenue x Expenses (2 cols) */}
        <div className="lg:col-span-2 bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-purple-400" />
                Desempenho Financeiro (Receitas x Despesas)
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Evolução mensal de faturamento, custos operacionais e meta</p>
            </div>

            {/* Chart Type Selector */}
            <div className="flex items-center gap-1 bg-[#0D1117] p-1 rounded-xl border border-gray-800 self-start sm:self-auto">
              <button
                onClick={() => setChartType('area')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  chartType === 'area' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="Gráfico de Área"
              >
                <Activity className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  chartType === 'bar' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="Gráfico de Barras"
              >
                <BarChart2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  chartType === 'line' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="Gráfico de Linha"
              >
                <LineChartIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                  <XAxis dataKey="name" stroke="#8B949E" fontSize={11} />
                  <YAxis stroke="#8B949E" fontSize={11} tickFormatter={(val) => `R$${val / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#161B22', borderColor: '#30363D', borderRadius: '12px' }}
                    formatter={(val: any) => [formatBRL(Number(val)), '']}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="Receitas" stroke="#22C55E" fillOpacity={1} fill="url(#colorReceita)" />
                  <Area type="monotone" dataKey="Despesas" stroke="#EF4444" fillOpacity={1} fill="url(#colorDespesa)" />
                  <Line type="monotone" dataKey="Meta" stroke="#7C3AED" strokeWidth={2.5} strokeDasharray="6 4" dot={false} />
                </AreaChart>
              ) : chartType === 'bar' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                  <XAxis dataKey="name" stroke="#8B949E" fontSize={11} />
                  <YAxis stroke="#8B949E" fontSize={11} tickFormatter={(val) => `R$${val / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#161B22', borderColor: '#30363D', borderRadius: '12px' }}
                    formatter={(val: any) => [formatBRL(Number(val)), '']}
                  />
                  <Legend />
                  <Bar dataKey="Receitas" fill="#22C55E" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Despesas" fill="#EF4444" radius={[6, 6, 0, 0]} />
                  <Line type="monotone" dataKey="Meta" stroke="#7C3AED" strokeWidth={2.5} strokeDasharray="6 4" dot={false} />
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                  <XAxis dataKey="name" stroke="#8B949E" fontSize={11} />
                  <YAxis stroke="#8B949E" fontSize={11} tickFormatter={(val) => `R$${val / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#161B22', borderColor: '#30363D', borderRadius: '12px' }}
                    formatter={(val: any) => [formatBRL(Number(val)), '']}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="Receitas" stroke="#22C55E" strokeWidth={3} />
                  <Line type="monotone" dataKey="Despesas" stroke="#EF4444" strokeWidth={3} />
                  <Line type="monotone" dataKey="Líquido" stroke="#06B6D4" strokeWidth={2} strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="Meta" stroke="#7C3AED" strokeWidth={2.5} strokeDasharray="6 4" dot={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Payment Methods breakdown (Donut) */}
        <div className="bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <PieChartIcon className="w-5 h-5 text-purple-400" />
              Métodos de Pagamento
            </h3>
            <p className="text-xs text-gray-400 mb-4">Distribuição de vendas por modalidade</p>

            {paymentMethodData.length > 0 ? (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#161B22', borderColor: '#30363D', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-gray-500">
                Sem vendas no período selecionado.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-800">
            {paymentMethodData.length > 0 ? (
              paymentMethodData.map((m) => (
                <div key={m.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                  <span className="text-xs text-gray-300 font-medium">{m.name}</span>
                </div>
              ))
            ) : (
              <span className="text-xs text-gray-500 col-span-2">Nenhum dado para exibir.</span>
            )}
          </div>
        </div>
      </div>

      {/* ===================== Linha 1 — Indicadores Financeiros ===================== */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-4 rounded-full bg-purple-500" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Indicadores Financeiros</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* 1. Saldo em Caixa */}
          <KpiCard
            title="Saldo em Caixa"
            value={formatBRL(totalBalance)}
            icon={<Wallet className="w-5 h-5" />}
            accent="bg-purple-500/10 text-purple-400"
            footer={
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <VariationBadge value={balanceVariation} label=" no mês" />
                <span className="text-[11px] text-gray-500">Caixa + bancos</span>
              </div>
            }
          />

          {/* 2. Faturamento do Mês */}
          <KpiCard
            title="Faturamento do Mês"
            value={formatBRL(monthIncome)}
            valueClass="text-emerald-400"
            icon={<TrendingUp className="w-5 h-5" />}
            accent="bg-emerald-500/10 text-emerald-400"
            footer={
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <VariationBadge value={revenueGrowth} label=" vs mês anterior" />
                <span className="text-[11px] text-gray-500">Entradas Confirmadas</span>
              </div>
            }
          />

          {/* 3. Despesas do Mês */}
          <KpiCard
            title="Despesas do Mês"
            value={formatBRL(monthExpenses)}
            valueClass="text-rose-400"
            icon={<TrendingDown className="w-5 h-5" />}
            accent="bg-rose-500/10 text-rose-400"
            footer={
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <VariationBadge value={expenseVariation} label=" vs mês anterior" invert />
                <span className="text-[11px] text-gray-500">Custos Operacionais</span>
              </div>
            }
          />

          {/* 4. Líquido */}
          <KpiCard
            title="Líquido"
            value={formatBRL(netProfit)}
            valueClass={netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}
            icon={<Coins className="w-5 h-5" />}
            accent="bg-purple-500/10 text-purple-400"
            footer={
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-gray-500">Faturamento − Despesas</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    profitMargin >= 0 ? 'text-emerald-300 bg-emerald-500/10' : 'text-rose-300 bg-rose-500/10'
                  }`}
                >
                  Margem {profitMargin.toFixed(1)}%
                </span>
              </div>
            }
          />

          {/* 5. Pró-Labore */}
          <KpiCard
            title="Pró-Labore"
            value={formatBRL(proLaborePaid)}
            valueClass="text-purple-300"
            icon={<UserCog className="w-5 h-5" />}
            accent="bg-purple-500/10 text-purple-300"
            footer={
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-gray-500">
                  Previsto {formatBRL(expectedProLabore)} • Pend. {formatBRL(proLaborePending)}
                </span>
                <span className="text-[10px] text-gray-400">Sócio</span>
              </div>
            }
          />
        </div>
      </section>

      {/* ===================== Linha 2 — Indicadores Operacionais ===================== */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-4 rounded-full bg-emerald-500" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Indicadores Operacionais</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* 6. Vendas */}
          <OperationCard
            title="Vendas"
            mainValue={`${formatNumber(totalSalesCount)}`}
            icon={<ShoppingCart className="w-4 h-4" />}
            accent="bg-purple-500/10 text-purple-400"
            onClick={() => setActiveTab('sales')}
            subs={[
              { label: 'Valor faturado', value: formatBRL(salesRevenue), className: 'text-emerald-400' },
              { label: 'Ticket médio', value: formatBRL(averageTicket) },
            ]}
          />

          {/* 7. Clientes */}
          <OperationCard
            title="Clientes"
            mainValue={`${formatNumber(customers.length)}`}
            icon={<Users className="w-4 h-4" />}
            accent="bg-blue-500/10 text-blue-400"
            onClick={() => setActiveTab('customers')}
            subs={[
              { label: 'Clientes ativos', value: `${formatNumber(activeCustomers)}` },
              { label: 'Novos no mês', value: `+${formatNumber(newCustomersThisMonth)}`, className: 'text-emerald-400' },
            ]}
          />

          {/* 8. Produtos */}
          <OperationCard
            title="Produtos"
            mainValue={`${formatNumber(products.length)}`}
            icon={<Package className="w-4 h-4" />}
            accent="bg-amber-500/10 text-amber-400"
            onClick={() => setActiveTab('products')}
            subs={[
              { label: 'Estoque baixo', value: `${formatNumber(lowStockProducts)}`, className: 'text-amber-400' },
              { label: 'Sem estoque', value: `${formatNumber(noStockProducts)}`, className: noStockProducts > 0 ? 'text-rose-400' : 'text-emerald-400' },
            ]}
          />

          {/* 9. Contas a Receber */}
          <OperationCard
            title="Contas a Receber"
            mainValue={formatBRL(accountsReceivable)}
            mainClass="text-emerald-400"
            icon={<HandCoins className="w-4 h-4" />}
            accent="bg-emerald-500/10 text-emerald-400"
            onClick={() => setActiveTab('finance')}
            subs={[
              { label: 'Títulos pendentes', value: `${formatNumber(receivableTxs.length)}` },
              {
                label: 'Valor vencido',
                value: overdueReceivable > 0 ? formatBRL(overdueReceivable) : 'Nenhum',
                className: overdueReceivable > 0 ? 'text-rose-400' : 'text-gray-500',
              },
            ]}
          />

          {/* 10. Contas a Pagar */}
          <OperationCard
            title="Contas a Pagar"
            mainValue={formatBRL(accountsPayable)}
            mainClass="text-rose-400"
            icon={<CreditCard className="w-4 h-4" />}
            accent="bg-rose-500/10 text-rose-400"
            onClick={() => setActiveTab('finance')}
            subs={[
              { label: 'Contas pendentes', value: `${formatNumber(payableTxs.length)}` },
              {
                label: 'Próximos venc.',
                value: nextDueDate ? formatDate(nextDueDate) : '—',
                className: nextDueDate ? 'text-amber-400' : 'text-gray-500',
              },
            ]}
          />

          {/* 11. Fluxo de Caixa */}
          <OperationCard
            title="Fluxo de Caixa"
            mainValue={formatBRL(cashFlow)}
            mainClass={cashFlowPositive ? 'text-emerald-400' : 'text-rose-400'}
            icon={<ArrowLeftRight className="w-4 h-4" />}
            accent="bg-cyan-500/10 text-cyan-400"
            onClick={() => setActiveTab('accounts')}
            subs={[
              {
                label: 'Resultado',
                value: cashFlowPositive ? 'Positivo' : 'Negativo',
                className: cashFlowPositive ? 'text-emerald-400' : 'text-rose-400',
              },
              { label: 'Entradas − Saídas', value: formatBRL(monthIncome) + ' − ' + formatBRL(monthExpenses) },
            ]}
          />
        </div>
      </section>

      {/* ===================== Linha 3 — Indicadores de Desempenho ===================== */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-4 rounded-full bg-cyan-500" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Indicadores de Desempenho</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* 12. Reserva Financeira */}
          <KpiCard
            title="Reserva Financeira"
            value={formatBRL(totalBalance)}
            valueClass={reserveProgress >= 50 ? 'text-emerald-400' : 'text-amber-400'}
            icon={<PiggyBank className="w-4 h-4" />}
            accent="bg-amber-500/10 text-amber-400"
            footer={
              <div className="w-full">
                <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                  <span>Meta: 3× despesas ({formatBRL(reserveTarget)})</span>
                  <span>{reserveProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full"
                    style={{ width: `${reserveProgress}%` }}
                  />
                </div>
              </div>
            }
          />

          {/* 13. ROI */}
          <KpiCard
            title="ROI"
            value={`${roi.toFixed(1)}%`}
            valueClass={roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}
            icon={<Activity className="w-4 h-4" />}
            accent="bg-cyan-500/10 text-cyan-400"
            footer={<span className="text-[11px] text-gray-500">Retorno sobre o custo dos produtos vendidos</span>}
          />

          {/* 14. Ticket Médio */}
          <KpiCard
            title="Ticket Médio"
            value={formatBRL(averageTicket)}
            icon={<Receipt className="w-4 h-4" />}
            accent="bg-purple-500/10 text-purple-400"
            footer={
              <span className="text-[11px] text-gray-500">
                {formatNumber(totalSalesCount)} vendas no período
              </span>
            }
          />

          {/* 15. Margem de Líquido */}
          <KpiCard
            title="Margem de Líquido"
            value={`${profitMargin.toFixed(1)}%`}
            valueClass={profitMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}
            icon={<Percent className="w-4 h-4" />}
            accent="bg-emerald-500/10 text-emerald-400"
            footer={<span className="text-[11px] text-gray-500">Líquido / Faturamento do mês</span>}
          />

          {/* 16. Meta Mensal */}
          <KpiCard
            title="Meta Mensal"
            value={`${goalProgress.toFixed(1)}%`}
            valueClass={goalProgress >= 100 ? 'text-emerald-400' : 'text-purple-300'}
            icon={<Target className="w-5 h-5" />}
            accent="bg-purple-500/10 text-purple-400"
            footer={
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-gray-500">Alvo {formatBRL(mainGoal.targetAmount)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400">{formatBRL(monthIncome)}</span>
                  <button
                    onClick={openGoalEditor}
                    className="p-1.5 text-gray-400 hover:text-white bg-gray-800/60 rounded-lg transition-colors"
                    title="Editar meta mensal"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              </div>
            }
          />

          {/* 17. Capital de Giro */}
          <KpiCard
            title="Capital de Giro"
            value={formatBRL(workingCapital)}
            valueClass={workingCapital >= 0 ? 'text-emerald-400' : 'text-rose-400'}
            icon={<ShieldCheck className="w-4 h-4" />}
            accent="bg-cyan-500/10 text-cyan-400"
            footer={
              <span className="text-[11px] text-gray-500">
                Caixa + a receber + estoque − a pagar
              </span>
            }
          />
        </div>
      </section>

      {/* ===================== Alertas & Saúde Financeira ===================== */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Saúde Financeira */}
          <div className="bg-gradient-to-br from-[#161B22] to-[#0D1117] border border-gray-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Saúde Financeira
                </h3>
                <button
                  onClick={() => setActiveTab('health')}
                  className="text-xs text-purple-400 hover:text-purple-300 font-medium"
                >
                  Painel completo →
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 shrink-0">
                  <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#21262D" strokeWidth="10" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(health.score / 100) * 264} 264`}
                      className={`${healthColor} transition-all duration-700`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-extrabold ${healthColor}`}>{health.score}</span>
                    <span className="text-[9px] text-gray-500 uppercase font-bold">/ 100</span>
                  </div>
                </div>
                <div>
                  <div className={`text-xl font-extrabold ${healthColor}`}>{health.label}</div>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                    Classificação automática com base em fluxo de caixa, atrasos, estoque, metas e pró-labore.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${healthBar} transition-all duration-700`} style={{ width: `${health.score}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1.5">
                <span>{alerts.length} alerta(s) ativo(s)</span>
                <span>{alerts.filter((a) => a.severity === 'danger').length} crítico(s)</span>
              </div>
            </div>
          </div>

          {/* Alertas Inteligentes */}
          <div className="lg:col-span-2 bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                Alertas Inteligentes
              </h3>
              <span className="text-[10px] text-gray-500">Gerados automaticamente</span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="text-center text-xs text-gray-500 py-10 border border-dashed border-gray-800 rounded-2xl">
                  Nenhum alerta no momento. Tudo sob controle!
                </div>
              ) : (
                alerts.map((a) => (
                  <div
                    key={a.id}
                    className={`flex items-start justify-between gap-4 p-3.5 rounded-2xl border ${alertColors[a.severity]}`}
                  >
                    <div>
                      <div className="text-xs font-bold">{a.title}</div>
                      <div className="text-[11px] opacity-90 mt-0.5">{a.description}</div>
                    </div>
                    {a.actionLabel && a.actionTab && (
                      <button
                        onClick={() => setActiveTab(a.actionTab as any)}
                        className="shrink-0 px-3 py-1.5 text-[11px] font-bold bg-black/30 hover:bg-black/50 rounded-lg transition-colors"
                      >
                        {a.actionLabel}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== Meta por Mês ===================== */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-4 rounded-full bg-purple-500" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Meta por Mês</h2>
          <span className="text-[10px] text-gray-500 ml-1">Receitas realizadas vs. meta cadastrada</span>
        </div>

        <div className="bg-[#161B22] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1117] text-gray-400 font-semibold border-b border-gray-800">
                <tr>
                  <th className="p-3.5">Mês</th>
                  <th className="p-3.5 text-right">Meta</th>
                  <th className="p-3.5 text-right">Receitas</th>
                  <th className="p-3.5 text-right">Despesas</th>
                  <th className="p-3.5 text-right">Líquido</th>
                  <th className="p-3.5">% da Meta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {monthlyGoalData.map((m) => (
                  <tr key={m.key} className={`transition-colors ${m.isCurrent ? 'bg-purple-500/5' : 'hover:bg-gray-800/30'}`}>
                    <td className="p-3.5 font-bold text-white">
                      {m.label}
                      {m.isCurrent && (
                        <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold text-purple-300 bg-purple-500/10 rounded-md">
                          ATUAL
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right text-gray-300">
                      {m.meta > 0 ? formatBRL(m.meta) : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="p-3.5 text-right font-extrabold text-emerald-400">{formatBRL(m.income)}</td>
                    <td className="p-3.5 text-right text-rose-400">{formatBRL(m.expenses)}</td>
                    <td className={`p-3.5 text-right font-bold ${m.net >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {formatBRL(m.net)}
                    </td>
                    <td className="p-3.5">
                      {m.pct === null ? (
                        <span className="text-gray-600">Sem meta</span>
                      ) : (
                        <div className="flex items-center gap-2 min-w-[130px]">
                          <div className="w-24 bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                m.pct >= 100
                                  ? 'bg-gradient-to-r from-emerald-500 to-lime-400'
                                  : m.pct >= 50
                                  ? 'bg-gradient-to-r from-purple-600 to-indigo-400'
                                  : 'bg-gradient-to-r from-amber-500 to-orange-400'
                              }`}
                              style={{ width: `${Math.min(100, m.pct)}%` }}
                            />
                          </div>
                          <span className={`text-[11px] font-bold ${m.pct >= 100 ? 'text-emerald-400' : 'text-gray-300'}`}>
                            {m.pct.toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Bottom Lists: Recent Sales & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales List */}
        <div className="bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-purple-400" />
              Últimas Vendas
            </h3>
            <button
              onClick={() => setActiveTab('sales')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium"
            >
              Ver Todas →
            </button>
          </div>

          <div className="space-y-3">
            {rangeSales.slice(0, 4).map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between p-3 bg-[#0D1117] rounded-2xl border border-gray-800/80 hover:border-purple-500/30 transition-colors"
              >
                <div>
                  <div className="text-xs font-semibold text-white">{sale.code}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {sale.customerName} • {sale.items.length} itens
                  </div>
                  <div className="text-[10px] font-semibold text-purple-300 mt-0.5">{formatDate(sale.createdAt)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-400">{formatBRL(sale.total)}</div>
                  <span className="inline-block text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md mt-0.5">
                    {sale.paymentMethod}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Urgent Table */}
        <div className="bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-rose-400" />
              Alertas de Estoque Baixo
            </h3>
            <button
              onClick={() => setActiveTab('stock')}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium"
            >
              Repor Estoque →
            </button>
          </div>

          <div className="space-y-3">
            {products
              .filter((p) => p.stockQuantity <= p.minStockQuantity)
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 bg-rose-950/10 border border-rose-500/20 rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    {p.imageUrl && <img src={p.imageUrl} className="w-9 h-9 rounded-xl object-cover shrink-0" />}
                    <div>
                      <div className="text-xs font-semibold text-white">{p.name}</div>
                      <div className="text-[10px] text-gray-400">SKU: {p.code}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 text-xs font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 rounded-lg">
                      {p.stockQuantity} un (Mín: {p.minStockQuantity})
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Modal Editar Meta Mensal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" />
                Editar Meta Mensal
              </h3>
              <button onClick={() => setIsGoalModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Meta Mensal (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={goalTargetInput}
                  onChange={(e) => setGoalTargetInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs font-bold"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Faturamento atual do mês: {formatBRL(monthIncome)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Mês / Período</label>
                <input
                  type="month"
                  required
                  value={goalPeriodInput}
                  onChange={(e) => setGoalPeriodInput(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
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
