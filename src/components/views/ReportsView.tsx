import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Sale } from '../../types';
import { Printer, FileSpreadsheet, FileCode } from 'lucide-react';
import { formatBRL, formatDate, exportToCSV, exportToExcel, triggerPrint } from '../../utils/formatters';

type ReportType =
  | 'fluxo'
  | 'despesas'
  | 'vendas'
  | 'clientes'
  | 'produtos'
  | 'estoque'
  | 'funcionarios'
  | 'prolabore'
  | 'categorias'
  | 'liquidos';

const REPORT_LABELS: Record<ReportType, string> = {
  fluxo: 'Fluxo de Caixa',
  despesas: 'Despesas',
  vendas: 'Vendas & Comissões',
  clientes: 'Clientes',
  produtos: 'Catálogo & Margens',
  estoque: 'Posição de Estoque',
  funcionarios: 'Funcionários & Folha',
  prolabore: 'Pró-Labore',
  categorias: 'Centros de Receita',
  liquidos: 'Líquidos Mensais',
};

export const ReportsView: React.FC = () => {
  const {
    transactions,
    sales,
    customers,
    products,
    companyConfig,
    employees,
    employeePayments,
    proLaborePayments,
  } = useERP();

  const [reportType, setReportType] = useState<ReportType>('fluxo');

  const getReportData = (): { name: string; data: Record<string, string | number>[] } => {
    switch (reportType) {
      case 'fluxo':
        return {
          name: 'relatorio_fluxo_caixa',
          data: transactions.map((t) => ({
            Data: formatDate(t.date),
            Tipo: t.type,
            Categoria: t.category,
            Descrição: t.description,
            Valor: t.amount,
            FormaPagamento: t.paymentMethod,
            Status: t.status,
          })),
        };
      case 'despesas':
        return {
          name: 'relatorio_despesas',
          data: transactions
            .filter((t) => t.type === 'Saída')
            .map((t) => ({
              Data: formatDate(t.date),
              Categoria: t.category,
              Descrição: t.description,
              Valor: t.amount,
              FormaPagamento: t.paymentMethod,
              Status: t.status,
            })),
        };
      case 'vendas':
        return {
          name: 'relatorio_vendas',
          data: sales.map((s) => ({
            Código: s.code,
            Cliente: s.customerName,
            Categoria: s.category || 'Outros',
            Data: formatDate(s.createdAt),
            Itens: s.items.length,
            Total: s.total,
            Pagamento: s.paymentMethod,
            Status: s.status,
          })),
        };
      case 'clientes':
        return {
          name: 'relatorio_clientes',
          data: customers.map((c) => ({
            Nome: c.name,
            CPF_CNPJ: c.document,
            Telefone: c.phone,
            Email: c.email,
            Cidade: c.city,
            Estado: c.state,
            TotalComprado: c.totalSpent || 0,
            UltimaCompra: c.lastPurchaseDate ? formatDate(c.lastPurchaseDate) : '—',
          })),
        };
      case 'produtos':
        return {
          name: 'relatorio_produtos',
          data: products.map((p) => ({
            SKU: p.code,
            Nome: p.name,
            Categoria: p.category,
            Custo: p.costPrice,
            Venda: p.salePrice,
            Estoque: p.stockQuantity,
          })),
        };
      case 'estoque':
        return {
          name: 'relatorio_estoque',
          data: products.map((p) => ({
            Produto: p.name,
            EstoqueAtual: p.stockQuantity,
            EstoqueMinimo: p.minStockQuantity,
            Status: p.stockQuantity <= p.minStockQuantity ? 'Reposição Urgente' : 'Normal',
          })),
        };
      case 'funcionarios':
        return {
          name: 'relatorio_funcionarios',
          data: employees.map((e) => {
            const paid = employeePayments
              .filter((p) => p.employeeId === e.id && p.status === 'Pago')
              .reduce((a, p) => a + p.amount, 0);
            return {
              Nome: e.name,
              Cargo: e.role,
              Admissão: formatDate(e.hireDate),
              Salário: e.salary,
              Comissão: `${e.commission}%`,
              Benefícios: e.benefits,
              Status: e.status,
              TotalPago: paid,
            };
          }),
        };
      case 'prolabore':
        return {
          name: 'relatorio_prolabore',
          data: proLaborePayments.map((p) => ({
            Mês: p.month.replace('-', '/'),
            Valor: p.amount,
            Tipo: p.paymentType === 'automatic' ? 'Automático' : 'Manual',
            Status: p.status,
            PagamentoEfetivado: p.paidAt ? formatDate(p.paidAt) : '—',
            Observações: p.notes || '',
          })),
        };
      case 'categorias': {
        const map = new Map<string, { revenue: number; count: number }>();
        sales
          .filter((s) => s.status === 'Concluída')
          .forEach((s) => {
            const cat = s.category || 'Outros';
            const cur = map.get(cat) || { revenue: 0, count: 0 };
            cur.revenue += s.total;
            cur.count += 1;
            map.set(cat, cur);
          });
        return {
          name: 'relatorio_centros_receita',
          data: Array.from(map.entries()).map(([cat, v]) => ({
            Categoria: cat,
            Vendas: v.count,
            Faturamento: v.revenue,
            TicketMedio: v.count > 0 ? v.revenue / v.count : 0,
          })),
        };
      }
      case 'liquidos': {
        const keys = new Set<string>();
        transactions.forEach((t) => keys.add(t.date.slice(0, 7)));
        return {
          name: 'relatorio_liquidos',
          data: Array.from(keys)
            .sort()
            .map((k) => {
              const inc = transactions
                .filter((t) => t.type === 'Entrada' && t.status === 'Pago' && t.date.startsWith(k))
                .reduce((a, t) => a + t.amount, 0);
              const exp = transactions
                .filter((t) => t.type === 'Saída' && t.status === 'Pago' && t.date.startsWith(k))
                .reduce((a, t) => a + t.amount, 0);
              return { Mês: k.replace('-', '/'), Receitas: inc, Despesas: exp, Líquido: inc - exp };
            }),
        };
      }
    }
  };

  const handleExportCSV = () => {
    const { name, data } = getReportData();
    exportToCSV(name, data);
  };

  const handleExportXLSX = () => {
    const { name, data } = getReportData();
    exportToExcel(name, data);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Central de Relatórios Executivos</h1>
          <p className="text-xs text-gray-400 mt-1">
            Gere relatórios customizados com exportação para PDF, Excel (XLSX), CSV e Impressão.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2 no-print">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-xl transition-all"
          >
            <FileCode className="w-4 h-4 text-purple-400" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportXLSX}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-xl transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel (XLSX)</span>
          </button>

          <button
            onClick={triggerPrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex flex-wrap items-center gap-2 bg-[#161B22] p-2 rounded-2xl border border-gray-800 no-print">
        {(Object.keys(REPORT_LABELS) as ReportType[]).map((type) => (
          <button
            key={type}
            onClick={() => setReportType(type)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              reportType === type
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {REPORT_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Printable Report Canvas */}
      <div className="bg-[#161B22] border border-gray-800 rounded-3xl p-4 sm:p-8 shadow-2xl print-area space-y-6">
        {/* Report Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">{companyConfig.name}</h2>
            <p className="text-xs text-purple-400 mt-1 font-semibold">
              RELATÓRIO DE {REPORT_LABELS[reportType].toUpperCase()} • EMITIDO EM{' '}
              {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className="text-left sm:text-right text-xs text-gray-400">
            <p>CNPJ: {companyConfig.cnpj}</p>
            <p>
              {companyConfig.city}/{companyConfig.state}
            </p>
          </div>
        </div>

        {/* ===== Fluxo de Caixa ===== */}
        {reportType === 'fluxo' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1117] text-gray-400 font-semibold border-b border-gray-800">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Descrição</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="p-3 text-gray-400">{formatDate(t.date)}</td>
                    <td className="p-3 font-bold text-white">{t.type}</td>
                    <td className="p-3 text-gray-200">{t.description}</td>
                    <td className="p-3 text-gray-300">{t.category}</td>
                    <td
                      className={`p-3 text-right font-bold ${
                        t.type === 'Entrada' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatBRL(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ===== Despesas ===== */}
        {reportType === 'despesas' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1117] text-gray-400 font-semibold border-b border-gray-800">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Descrição</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {transactions
                  .filter((t) => t.type === 'Saída')
                  .map((t) => (
                    <tr key={t.id}>
                      <td className="p-3 text-gray-400">{formatDate(t.date)}</td>
                      <td className="p-3 text-purple-300">{t.category}</td>
                      <td className="p-3 text-gray-200">{t.description}</td>
                      <td className="p-3 text-gray-400">{t.status}</td>
                      <td className="p-3 text-right font-bold text-rose-400">{formatBRL(t.amount)}</td>
                    </tr>
                  ))}
              </tbody>
              <tfoot className="border-t border-gray-800">
                <tr>
                  <td colSpan={4} className="p-3 text-right font-bold text-gray-300">
                    Total de Despesas
                  </td>
                  <td className="p-3 text-right font-extrabold text-rose-400">
                    {formatBRL(transactions.filter((t) => t.type === 'Saída').reduce((a, t) => a + t.amount, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ===== Vendas ===== */}
        {reportType === 'vendas' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1117] text-gray-400 font-semibold border-b border-gray-800">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Data</th>
                  <th className="p-3">Forma Pagto</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {sales.map((s) => (
                  <tr key={s.id}>
                    <td className="p-3 font-bold text-white">{s.code}</td>
                    <td className="p-3 text-gray-200">{s.customerName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-300">
                        {s.category || 'Outros'}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400">{formatDate(s.createdAt)}</td>
                    <td className="p-3 text-purple-300">{s.paymentMethod}</td>
                    <td className="p-3 text-right font-extrabold text-emerald-400">{formatBRL(s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ===== Clientes ===== */}
        {reportType === 'clientes' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1117] text-gray-400 font-semibold border-b border-gray-800">
                <tr>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Contato</th>
                  <th className="p-3">Cidade</th>
                  <th className="p-3 text-right">Total Comprado</th>
                  <th className="p-3">Última Compra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="p-3 font-bold text-white">{c.name}</td>
                    <td className="p-3 text-gray-300">{c.phone || c.email}</td>
                    <td className="p-3 text-gray-400">{c.city}</td>
                    <td className="p-3 text-right font-bold text-emerald-400">{formatBRL(c.totalSpent || 0)}</td>
                    <td className="p-3 text-gray-400">
                      {c.lastPurchaseDate ? formatDate(c.lastPurchaseDate) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ===== Produtos / Margens ===== */}
        {reportType === 'produtos' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1117] text-gray-400 font-semibold border-b border-gray-800">
                <tr>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Produto</th>
                  <th className="p-3">Preço Custo</th>
                  <th className="p-3">Preço Venda</th>
                  <th className="p-3 text-right">Margem %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {products.map((p) => {
                  const profit = p.salePrice - p.costPrice;
                  const margin = p.salePrice > 0 ? (profit / p.salePrice) * 100 : 0;
                  return (
                    <tr key={p.id}>
                      <td className="p-3 text-gray-400">{p.code}</td>
                      <td className="p-3 font-bold text-white">{p.name}</td>
                      <td className="p-3 text-gray-300">{formatBRL(p.costPrice)}</td>
                      <td className="p-3 text-emerald-400 font-semibold">{formatBRL(p.salePrice)}</td>
                      <td className="p-3 text-right font-bold text-purple-300">{margin.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ===== Estoque ===== */}
        {reportType === 'estoque' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1117] text-gray-400 font-semibold border-b border-gray-800">
                <tr>
                  <th className="p-3">Produto</th>
                  <th className="p-3">Estoque Atual</th>
                  <th className="p-3">Estoque Mínimo</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3 font-bold text-white">{p.name}</td>
                    <td className="p-3 font-bold text-purple-300">{p.stockQuantity} un</td>
                    <td className="p-3 text-gray-400">{p.minStockQuantity} un</td>
                    <td className="p-3 text-right">
                      {p.stockQuantity <= p.minStockQuantity ? (
                        <span className="text-rose-400 font-bold">Reposição Urgente</span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ===== Funcionários ===== */}
        {reportType === 'funcionarios' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1117] text-gray-400 font-semibold border-b border-gray-800">
                <tr>
                  <th className="p-3">Funcionário</th>
                  <th className="p-3">Cargo</th>
                  <th className="p-3">Salário</th>
                  <th className="p-3">Comissão</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Total Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {employees.map((e) => {
                  const paid = employeePayments
                    .filter((p) => p.employeeId === e.id && p.status === 'Pago')
                    .reduce((a, p) => a + p.amount, 0);
                  return (
                    <tr key={e.id}>
                      <td className="p-3 font-bold text-white">{e.name}</td>
                      <td className="p-3 text-gray-300">{e.role}</td>
                      <td className="p-3 text-rose-300">{formatBRL(e.salary)}</td>
                      <td className="p-3 text-purple-300">{e.commission}%</td>
                      <td className="p-3 text-gray-400">{e.status}</td>
                      <td className="p-3 text-right font-bold text-emerald-400">{formatBRL(paid)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-gray-800">
                <tr>
                  <td colSpan={5} className="p-3 text-right font-bold text-gray-300">
                    Folha Mensal (Ativos)
                  </td>
                  <td className="p-3 text-right font-extrabold text-rose-400">
                    {formatBRL(employees.filter((e) => e.status === 'Ativo').reduce((a, e) => a + e.salary, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ===== Pró-Labore ===== */}
        {reportType === 'prolabore' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1117] text-gray-400 font-semibold border-b border-gray-800">
                <tr>
                  <th className="p-3">Mês</th>
                  <th className="p-3 text-right">Valor</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Pagamento Efetivado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {proLaborePayments
                  .slice()
                  .sort((a, b) => b.month.localeCompare(a.month))
                  .map((p) => (
                    <tr key={p.id}>
                      <td className="p-3 font-bold text-white">{p.month.replace('-', '/')}</td>
                      <td className="p-3 text-right font-extrabold text-purple-300">{formatBRL(p.amount)}</td>
                      <td className="p-3 text-gray-400">
                        {p.paymentType === 'automatic' ? 'Automático' : 'Manual'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            p.status === 'Pago'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3 text-gray-400">{p.paidAt ? formatDate(p.paidAt) : '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ===== Centros de Receita ===== */}
        {reportType === 'categorias' && (
          <CategoryReport sales={sales} />
        )}

        {/* ===== Líquidos Mensais ===== */}
        {reportType === 'liquidos' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1117] text-gray-400 font-semibold border-b border-gray-800">
                <tr>
                  <th className="p-3">Mês</th>
                  <th className="p-3 text-right">Receitas</th>
                  <th className="p-3 text-right">Despesas</th>
                  <th className="p-3 text-right">Líquido</th>
                  <th className="p-3 text-right">Margem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {(() => {
                  const keys = new Set<string>();
                  transactions.forEach((t) => keys.add(t.date.slice(0, 7)));
                  return Array.from(keys)
                    .sort()
                    .map((k) => {
                      const inc = transactions
                        .filter((t) => t.type === 'Entrada' && t.status === 'Pago' && t.date.startsWith(k))
                        .reduce((a, t) => a + t.amount, 0);
                      const exp = transactions
                        .filter((t) => t.type === 'Saída' && t.status === 'Pago' && t.date.startsWith(k))
                        .reduce((a, t) => a + t.amount, 0);
                      const profit = inc - exp;
                      const margin = inc > 0 ? (profit / inc) * 100 : 0;
                      return (
                        <tr key={k}>
                          <td className="p-3 font-bold text-white">{k.replace('-', '/')}</td>
                          <td className="p-3 text-right text-emerald-400 font-semibold">{formatBRL(inc)}</td>
                          <td className="p-3 text-right text-rose-400 font-semibold">{formatBRL(exp)}</td>
                          <td className={`p-3 text-right font-extrabold ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatBRL(profit)}
                          </td>
                          <td className="p-3 text-right text-purple-300">{margin.toFixed(1)}%</td>
                        </tr>
                      );
                    });
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const CategoryReport: React.FC<{ sales: Sale[] }> = ({ sales }) => {
  const map = new Map<string, { revenue: number; count: number }>();
  sales
    .filter((s) => s.status === 'Concluída')
    .forEach((s) => {
      const cat = s.category || 'Outros';
      const cur = map.get(cat) || { revenue: 0, count: 0 };
      cur.revenue += s.total;
      cur.count += 1;
      map.set(cat, cur);
    });

  const total = Array.from(map.values()).reduce((a, v) => a + v.revenue, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-[#0D1117] text-gray-400 font-semibold border-b border-gray-800">
          <tr>
            <th className="p-3">Categoria</th>
            <th className="p-3 text-right">Vendas</th>
            <th className="p-3 text-right">Faturamento</th>
            <th className="p-3 text-right">Ticket Médio</th>
            <th className="p-3 text-right">Participação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60">
          {Array.from(map.entries()).map(([cat, v]) => (
            <tr key={cat}>
              <td className="p-3 font-bold text-white">{cat}</td>
              <td className="p-3 text-right text-gray-300">{v.count}</td>
              <td className="p-3 text-right font-bold text-emerald-400">{formatBRL(v.revenue)}</td>
              <td className="p-3 text-right text-purple-300">
                {formatBRL(v.count > 0 ? v.revenue / v.count : 0)}
              </td>
              <td className="p-3 text-right text-gray-400">
                {total > 0 ? `${((v.revenue / total) * 100).toFixed(1)}%` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
