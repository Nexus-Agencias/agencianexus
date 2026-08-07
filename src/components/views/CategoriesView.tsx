import React, { useMemo, useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { RevenueCategory } from '../../types';
import { REVENUE_CATEGORIES, CATEGORY_COLORS } from '../../utils/revenueCategories';
import { PieChart, BarChart3, TrendingUp, Layers, ShoppingBag } from 'lucide-react';
import { formatBRL, formatPercent, formatNumber } from '../../utils/formatters';

interface CategoryStats {
  category: RevenueCategory;
  revenue: number;
  salesCount: number;
  ticketMedio: number;
  cost: number;
  grossProfit: number;
  allocatedExpenses: number;
  netProfit: number;
  netMargin: number;
}

export const CategoriesView: React.FC = () => {
  const { sales, transactions, products } = useERP();
  const [monthFilter, setMonthFilter] = useState('all');

  const months = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((s) => set.add(s.createdAt.split('T')[0].slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [sales]);

  const stats: CategoryStats[] = useMemo(() => {
    const productCost = (productId: string) =>
      products.find((p) => p.id === productId)?.costPrice ?? 0;

    const monthSales = sales.filter((s) => {
      if (s.status !== 'Concluída') return false;
      if (monthFilter === 'all') return true;
      return s.createdAt.split('T')[0].startsWith(monthFilter);
    });

    const categoryData = new Map<RevenueCategory, { revenue: number; count: number; cost: number }>();

    monthSales.forEach((s) => {
      const cat = (s.category || 'Outros') as RevenueCategory;
      const entry = categoryData.get(cat) || { revenue: 0, count: 0, cost: 0 };
      entry.revenue += s.total;
      entry.count += 1;
      entry.cost += s.items.reduce((acc, it) => acc + productCost(it.productId) * it.quantity, 0);
      categoryData.set(cat, entry);
    });

    const totalRevenue = Array.from(categoryData.values()).reduce((a, c) => a + c.revenue, 0);

    const expenses =
      monthFilter === 'all'
        ? transactions
            .filter((t) => t.type === 'Saída' && t.status === 'Pago')
            .reduce((a, t) => a + t.amount, 0)
        : transactions
            .filter((t) => t.type === 'Saída' && t.status === 'Pago' && t.date.startsWith(monthFilter))
            .reduce((a, t) => a + t.amount, 0);

    return REVENUE_CATEGORIES.map((cat) => {
      const data = categoryData.get(cat) || { revenue: 0, count: 0, cost: 0 };
      const allocatedExpenses =
        totalRevenue > 0 ? expenses * (data.revenue / totalRevenue) : 0;
      const grossProfit = data.revenue - data.cost;
      const netProfit = grossProfit - allocatedExpenses;
      return {
        category: cat,
        revenue: data.revenue,
        salesCount: data.count,
        ticketMedio: data.count > 0 ? data.revenue / data.count : 0,
        cost: data.cost,
        grossProfit,
        allocatedExpenses,
        netProfit,
        netMargin: data.revenue > 0 ? netProfit / data.revenue : 0,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [sales, transactions, products, monthFilter]);

  const totalRevenue = stats.reduce((a, s) => a + s.revenue, 0);
  const totalNetProfit = stats.reduce((a, s) => a + s.netProfit, 0);
  const maxRevenue = Math.max(...stats.map((s) => s.revenue), 1);

  const topCategory = stats[0];

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Centros de Receita</h1>
          <p className="text-xs text-gray-400 mt-1">
            Análise de faturamento, líquido, margem e ticket médio por categoria de venda.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="px-3 py-2 bg-[#161B22] border border-gray-800 text-gray-300 rounded-xl text-xs font-semibold focus:outline-hidden"
          >
            <option value="all">Todo o período</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m.replace('-', '/')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#161B22] border border-gray-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Faturamento Total</span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">{formatBRL(totalRevenue)}</div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-[#161B22] border border-gray-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Líquido Estimado</span>
            <div className="text-2xl font-extrabold text-purple-300 mt-1">{formatBRL(totalNetProfit)}</div>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-[#161B22] border border-gray-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Categoria Líder</span>
            <div className="text-xl font-extrabold text-white mt-1">
              {topCategory && topCategory.revenue > 0 ? topCategory.category : '—'}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {topCategory && topCategory.revenue > 0 ? formatBRL(topCategory.revenue) : 'Sem vendas no período'}
            </div>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Gráfico comparativo */}
      <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-5">
          <BarChart3 className="w-4 h-4 text-purple-400" />
          Faturamento por Categoria
        </h2>
        <div className="space-y-3">
          {stats.map((s) => (
            <div key={s.category} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[s.category] }} />
                <span className="w-48 max-w-[60vw] text-xs font-semibold text-gray-300 truncate">{s.category}</span>
                <span className="ml-auto sm:hidden text-xs font-extrabold text-white">{formatBRL(s.revenue)}</span>
              </div>
              <div className="flex flex-1 items-center gap-3 min-w-0">
                <div className="flex-1 h-6 bg-[#0D1117] rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all"
                    style={{
                      width: `${Math.max(2, (s.revenue / maxRevenue) * 100)}%`,
                      backgroundColor: CATEGORY_COLORS[s.category],
                    }}
                  />
                </div>
                <span className="hidden sm:block w-28 text-right text-xs font-extrabold text-white">{formatBRL(s.revenue)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cards por categoria */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.category} className="bg-[#161B22] border border-gray-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[s.category] }} />
                <span className="text-xs font-bold text-white">{s.category}</span>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-800 text-gray-400">
                {formatNumber(s.salesCount)} vendas
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-gray-500 uppercase font-semibold">Faturamento</div>
                <div className="text-base font-extrabold text-emerald-400">{formatBRL(s.revenue)}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase font-semibold">Ticket Médio</div>
                <div className="text-base font-extrabold text-sky-300">{formatBRL(s.ticketMedio)}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase font-semibold">Custo das Vendas</div>
                <div className="text-xs font-bold text-rose-300">{formatBRL(s.cost)}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase font-semibold">Líquido</div>
                <div className="text-xs font-bold text-purple-300">{formatBRL(s.netProfit)}</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Margem Líquida</span>
              <span
                className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold ${
                  s.netMargin > 0
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : s.netMargin < 0
                    ? 'bg-rose-500/10 text-rose-400'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {formatPercent(s.netMargin * 100)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="bg-[#0D1117] border border-dashed border-gray-800 rounded-2xl p-4 text-[11px] text-gray-500 flex items-start gap-2">
        <PieChart className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <span>
          <strong className="text-gray-300">Como é calculado:</strong> Faturamento = soma das vendas concluídas por
          categoria. Custo das vendas = custo dos produtos vendidos. Líquido = faturamento − custo das vendas −
          despesas operacionais do período rateadas proporcionalmente ao faturamento de cada categoria.
        </span>
      </div>
    </div>
  );
};
