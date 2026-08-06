import React, { useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { REVENUE_CATEGORIES } from '../../utils/revenueCategories';
import { buildAlerts, computeHealthScore } from '../../utils/financialHealth';
import {
  Activity,
  Bell,
  Crown,
  PackageSearch,
  TrendingUp,
  TrendingDown,
  Coins,
  Wallet,
  ArrowLeftRight,
  CalendarRange,
  CalendarClock,
  BarChart3,
} from 'lucide-react';
import { formatBRL, formatNumber, formatDate } from '../../utils/formatters';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const HealthView: React.FC = () => {
  const {
    transactions,
    sales,
    customers,
    products,
    bankAccounts,
    goals,
    setActiveTab,
    proLaboreConfig,
    proLaborePayments,
    computeProLaboreAmount,
    monthIncomeOf,
    monthProfitOf,
  } = useERP();

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthKey = todayStr.slice(0, 7);
  const currentYear = todayStr.slice(0, 4);

  const sumPaidByMonth = (type: 'Entrada' | 'Saída', monthKey: string) =>
    transactions
      .filter((t) => t.type === type && t.status === 'Pago' && t.date.startsWith(monthKey))
      .reduce((acc, t) => acc + t.amount, 0);

  const totalBalance = bankAccounts.reduce((acc, b) => acc + b.balance, 0);
  const monthIncome = sumPaidByMonth('Entrada', currentMonthKey);
  const monthExpenses = sumPaidByMonth('Saída', currentMonthKey);
  const monthProfit = monthIncome - monthExpenses;

  const yearIncome = transactions
    .filter((t) => t.type === 'Entrada' && t.status === 'Pago' && t.date.startsWith(currentYear))
    .reduce((a, t) => a + t.amount, 0);
  const yearExpenses = transactions
    .filter((t) => t.type === 'Saída' && t.status === 'Pago' && t.date.startsWith(currentYear))
    .reduce((a, t) => a + t.amount, 0);
  const yearProfit = yearIncome - yearExpenses;

  const allIncome = transactions
    .filter((t) => t.type === 'Entrada' && t.status === 'Pago')
    .reduce((a, t) => a + t.amount, 0);
  const allExpenses = transactions
    .filter((t) => t.type === 'Saída' && t.status === 'Pago')
    .reduce((a, t) => a + t.amount, 0);
  const accumulatedProfit = allIncome - allExpenses;

  const [refYear, refMonthIdx] = currentMonthKey.split('-').map(Number);
  const prevMonthsProfit = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(refYear, refMonthIdx - 1 - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return sumPaidByMonth('Entrada', key) - sumPaidByMonth('Saída', key);
  }).filter((v) => v !== 0);
  const prev3MonthsAvgProfit = prevMonthsProfit.length
    ? prevMonthsProfit.reduce((a, b) => a + b, 0) / prevMonthsProfit.length
    : 0;

  const receivable = transactions
    .filter((t) => t.type === 'Entrada' && t.status === 'Pendente')
    .reduce((a, t) => a + t.amount, 0);
  const payable = transactions
    .filter((t) => t.type === 'Saída' && t.status === 'Pendente')
    .reduce((a, t) => a + t.amount, 0);
  const stockValue = products.reduce((a, p) => a + p.stockQuantity * p.costPrice, 0);
  const workingCapital = totalBalance + receivable + stockValue - payable;

  const expectedProLabore = computeProLaboreAmount(currentMonthKey);
  const proLaborePaid = proLaborePayments
    .filter((p) => p.month === currentMonthKey && p.status === 'Pago')
    .reduce((a, p) => a + p.amount, 0);

  const goalTarget = goals[0]?.targetAmount || 250000;
  const goalProgress = Math.min(100, (monthIncome / goalTarget) * 100);

  const healthInput = {
    todayStr,
    transactions,
    products,
    goalTarget,
    goalProgress,
    monthIncome,
    monthProfit,
    prev3MonthsAvgProfit,
    monthNetFlow: monthIncome - monthExpenses,
    proLaboreAmount: expectedProLabore,
    proLaborePaid,
    proLaboreMode: proLaboreConfig.mode,
  };
  const alerts = buildAlerts(healthInput);
  const health = computeHealthScore(healthInput);

  // Faturamento médio
  const billingDays = useMemo(() => {
    const paid = transactions.filter((t) => t.type === 'Entrada' && t.status === 'Pago');
    if (paid.length === 0) return 0;
    const dates = paid.map((t) => t.date).sort();
    const first = new Date(dates[0] + 'T00:00:00');
    const last = new Date(todayStr + 'T00:00:00');
    const diff = Math.max(1, Math.floor((last.getTime() - first.getTime()) / 86400000));
    return allIncome / diff;
  }, [transactions, allIncome, todayStr]);

  // Categoria líder
  const categoryRevenue = useMemo(() => {
    const map = new Map<string, number>();
    sales
      .filter((s) => s.status === 'Concluída')
      .forEach((s) => {
        const cat = s.category || 'Outros';
        map.set(cat, (map.get(cat) || 0) + s.total);
      });
    return REVENUE_CATEGORIES.map((c) => ({ category: c, revenue: map.get(c) || 0 })).sort(
      (a, b) => b.revenue - a.revenue
    );
  }, [sales]);

  const topCategory = categoryRevenue[0];
  const totalRevenue = categoryRevenue.reduce((a, c) => a + c.revenue, 0);

  const topCustomer = useMemo(
    () => customers.filter((c) => (c.totalSpent || 0) > 0).sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))[0],
    [customers]
  );

  const topProduct = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    sales
      .filter((s) => s.status === 'Concluída')
      .forEach((s) =>
        s.items.forEach((it) => {
          const cur = map.get(it.productId) || { name: it.productName, qty: 0, revenue: 0 };
          cur.qty += it.quantity;
          cur.revenue += it.subtotal;
          map.set(it.productId, cur);
        })
      );
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty)[0];
  }, [sales]);

  // Série mensal para gráfico de líquidos
  const chartData = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(refYear, refMonthIdx - 1 - (7 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const inc = sumPaidByMonth('Entrada', key);
    const exp = sumPaidByMonth('Saída', key);
    return { name: MONTHS[d.getMonth()], Líquido: inc - exp, Receitas: inc, Despesas: exp };
  });

  const maxChart = Math.max(...chartData.map((d) => Math.max(d.Receitas, d.Despesas)), 1);

  const alertColors: Record<string, string> = {
    danger: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    info: 'bg-sky-500/10 border-sky-500/30 text-sky-300',
  };

  const healthColor =
    health.score >= 80 ? 'text-emerald-400' : health.score >= 60 ? 'text-lime-400' : health.score >= 40 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400">
              <Activity className="w-5 h-5" />
            </span>
            Saúde Financeira
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Painel inteligente com diagnóstico completo da empresa, rankings e inteligência de dados.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-[#161B22] border border-gray-800 rounded-2xl px-5 py-3 text-center">
            <div className={`text-3xl font-extrabold ${healthColor}`}>{health.score}</div>
            <div className="text-[10px] text-gray-500 uppercase font-bold">{health.label}</div>
          </div>
          <div className="hidden sm:block w-28">
            <div className="text-[10px] text-gray-500 mb-1">Nota geral</div>
            <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r from-emerald-500 to-purple-500 rounded-full transition-all duration-700 ${
                  health.score >= 60 ? '' : 'from-amber-500 to-rose-500'
                }`}
                style={{ width: `${health.score}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI de líquidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-[#161B22] border border-gray-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-gray-400 uppercase">Líquido Acumulado</span>
          <div className={`text-xl font-extrabold mt-1 ${accumulatedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatBRL(accumulatedProfit)}
          </div>
          <span className="text-[10px] text-gray-500">Resultado de todo o histórico</span>
        </div>
        <div className="bg-[#161B22] border border-gray-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-gray-400 uppercase">Líquido do Ano ({currentYear})</span>
          <div className={`text-xl font-extrabold mt-1 ${yearProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatBRL(yearProfit)}
          </div>
          <span className="text-[10px] text-gray-500">
            Receitas {formatBRL(yearIncome)} − Despesas {formatBRL(yearExpenses)}
          </span>
        </div>
        <div className="bg-[#161B22] border border-gray-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-gray-400 uppercase">Líquido do Mês</span>
          <div className={`text-xl font-extrabold mt-1 ${monthProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatBRL(monthProfit)}
          </div>
          <span className="text-[10px] text-gray-500">
            {prev3MonthsAvgProfit > 0
              ? `Média 3 meses: ${formatBRL(prev3MonthsAvgProfit)}`
              : 'Sem base para comparação'}
          </span>
        </div>
        <div className="bg-[#161B22] border border-gray-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-gray-400 uppercase">Disponibilidade</span>
          <div className="text-xl font-extrabold text-purple-300 mt-1">{formatBRL(totalBalance)}</div>
          <span className="text-[10px] text-gray-500">Saldo em caixa + bancos</span>
        </div>
      </div>

      {/* Rankings inteligentes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
            <Crown className="w-4 h-4 text-amber-400" /> Melhor Cliente
          </h3>
          {topCustomer ? (
            <>
              <div className="text-sm font-extrabold text-white">{topCustomer.name}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                Compras: <span className="text-emerald-400 font-bold">{formatBRL(topCustomer.totalSpent || 0)}</span>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                Última compra: {topCustomer.lastPurchaseDate ? formatDate(topCustomer.lastPurchaseDate) : '—'}
              </div>
            </>
          ) : (
            <div className="text-xs text-gray-500">Sem dados de clientes ainda.</div>
          )}
        </div>

        <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
            <PackageSearch className="w-4 h-4 text-sky-400" /> Produto Mais Vendido
          </h3>
          {topProduct ? (
            <>
              <div className="text-sm font-extrabold text-white">{topProduct.name}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                {formatNumber(topProduct.qty)} unidades vendidas
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                Faturado: <span className="text-emerald-400 font-bold">{formatBRL(topProduct.revenue)}</span>
              </div>
            </>
          ) : (
            <div className="text-xs text-gray-500">Sem vendas registradas ainda.</div>
          )}
        </div>

        <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-purple-400" /> Centro de Receita Líder
          </h3>
          {topCategory && topCategory.revenue > 0 ? (
            <>
              <div className="text-sm font-extrabold text-white">{topCategory.category}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                Faturado: <span className="text-emerald-400 font-bold">{formatBRL(topCategory.revenue)}</span>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                {totalRevenue > 0
                  ? `${((topCategory.revenue / totalRevenue) * 100).toFixed(1)}% do faturamento total`
                  : 'Sem vendas no período'}
              </div>
            </>
          ) : (
            <div className="text-xs text-gray-500">Sem vendas registradas ainda.</div>
          )}
        </div>
      </div>

      {/* Faturamento médio + Capital */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
            <CalendarRange className="w-4 h-4 text-cyan-400" /> Faturamento Médio
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <div className="text-[10px] text-gray-500 uppercase">Diário</div>
              <div className="text-sm font-extrabold text-white">{formatBRL(billingDays)}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase">Semanal</div>
              <div className="text-sm font-extrabold text-white">{formatBRL(billingDays * 7)}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase">Mensal</div>
              <div className="text-sm font-extrabold text-white">{formatBRL(monthIncome)}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase">Anual</div>
              <div className="text-sm font-extrabold text-white">{formatBRL(yearIncome)}</div>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-3 flex items-center gap-1">
            <CalendarClock className="w-3 h-3" /> Base: receitas confirmadas desde a primeira movimentação até hoje.
          </p>
        </div>

        <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-purple-400" /> Estrutura de Capital
          </h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Caixa e bancos</span>
              <span className="font-bold text-white">{formatBRL(totalBalance)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Contas a receber</span>
              <span className="font-bold text-emerald-400">{formatBRL(receivable)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Estoque</span>
              <span className="font-bold text-amber-300">{formatBRL(stockValue)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Contas a pagar</span>
              <span className="font-bold text-rose-400">{formatBRL(payable)}</span>
            </div>
            <div className="flex items-center justify-between text-sm pt-3 mt-1 border-t border-gray-800">
              <span className="text-gray-300 font-semibold">Capital de Giro Líquido</span>
              <span className={`font-extrabold ${workingCapital >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatBRL(workingCapital)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de líquido mensal */}
      <div className="bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-xl">
        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-6">
          <Coins className="w-5 h-5 text-purple-400" />
          Evolução de Líquidos (últimos 8 meses)
        </h3>
        <div className="h-56">
          <div className="flex items-end gap-2 h-full">
            {chartData.map((d) => (
              <div key={d.name} className="flex-1 flex flex-col items-center gap-1.5 group">
                <div className="relative flex-1 w-full flex items-end">
                  <div className="w-full relative flex items-end justify-center" style={{ height: '100%' }}>
                    <div
                      className={`w-3/5 rounded-t-lg transition-all group-hover:opacity-80 ${
                        d.Líquido >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ height: `${Math.max(4, (Math.abs(d.Líquido) / maxChart) * 100)}%` }}
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 text-center">
                    <span className="text-[9px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatBRL(d.Líquido)}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-gray-500 font-medium">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-800 text-[11px] text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Líquido positivo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Prejuízo
          </span>
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" /> Receitas
          </span>
          <span className="flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> Despesas
          </span>
        </div>
      </div>

      {/* Alertas */}
      <div className="bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            Alertas Inteligentes
          </h3>
          <span className="text-[10px] text-gray-500">{alerts.length} ativo(s)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {alerts.length === 0 ? (
            <div className="text-center text-xs text-gray-500 py-8 border border-dashed border-gray-800 rounded-2xl md:col-span-2">
              Nenhum alerta no momento. Tudo sob controle!
            </div>
          ) : (
            alerts.map((a) => (
              <div key={a.id} className={`flex items-start justify-between gap-3 p-3.5 rounded-2xl border ${alertColors[a.severity]}`}>
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

      {/* Ações rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab('categories')}
          className="bg-[#161B22] border border-gray-800 hover:border-purple-500/40 rounded-2xl p-4 text-left transition-colors"
        >
          <BarChart3 className="w-5 h-5 text-purple-400 mb-2" />
          <div className="text-xs font-bold text-white">Centros de Receita</div>
          <div className="text-[10px] text-gray-500">Faturamento por categoria</div>
        </button>
        <button
          onClick={() => setActiveTab('prolabore')}
          className="bg-[#161B22] border border-gray-800 hover:border-purple-500/40 rounded-2xl p-4 text-left transition-colors"
        >
          <Wallet className="w-5 h-5 text-purple-400 mb-2" />
          <div className="text-xs font-bold text-white">Pró-Labore</div>
          <div className="text-[10px] text-gray-500">Configurar e acompanhar</div>
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className="bg-[#161B22] border border-gray-800 hover:border-purple-500/40 rounded-2xl p-4 text-left transition-colors"
        >
          <Activity className="w-5 h-5 text-purple-400 mb-2" />
          <div className="text-xs font-bold text-white">Funcionários</div>
          <div className="text-[10px] text-gray-500">Folha de pagamento</div>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className="bg-[#161B22] border border-gray-800 hover:border-purple-500/40 rounded-2xl p-4 text-left transition-colors"
        >
          <ArrowLeftRight className="w-5 h-5 text-purple-400 mb-2" />
          <div className="text-xs font-bold text-white">Relatórios</div>
          <div className="text-[10px] text-gray-500">Exportar análises</div>
        </button>
      </div>
    </div>
  );
};
