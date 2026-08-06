import { Product, Transaction } from '../types';

export type AlertSeverity = 'danger' | 'warning' | 'success' | 'info';

export interface FinancialAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  actionLabel?: string;
  actionTab?: string;
}

export interface HealthScore {
  score: number;
  label: string;
}

export interface HealthInput {
  todayStr: string;
  transactions: Transaction[];
  products: Product[];
  goalTarget: number;
  goalProgress: number;
  monthIncome: number;
  monthProfit: number;
  prev3MonthsAvgProfit: number;
  monthNetFlow: number;
  proLaboreAmount: number;
  proLaborePaid: number;
  proLaboreMode: 'fixed' | 'percent_profit' | 'percent_revenue';
}

const daysBetween = (a: string, b: string) =>
  Math.floor((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000);

export function buildAlerts(input: HealthInput): FinancialAlert[] {
  const alerts: FinancialAlert[] = [];
  const { transactions, products, todayStr } = input;

  const push = (alert: FinancialAlert) => alerts.push(alert);

  // 1. Fluxo de caixa negativo
  if (input.monthNetFlow < 0) {
    push({
      id: 'negative-cashflow',
      severity: 'danger',
      title: 'Fluxo de caixa negativo',
      description: `As saídas do mês superam as entradas em R$ ${Math.abs(input.monthNetFlow).toLocaleString('pt-BR')}. Revise despesas e cobranças.`,
      actionLabel: 'Ver fluxo',
      actionTab: 'accounts',
    });
  }

  // 2. Contas a pagar vencidas
  const overduePayable = transactions.filter(
    (t) => t.type === 'Saída' && t.status === 'Pendente' && t.date < todayStr
  );
  if (overduePayable.length > 0) {
    const total = overduePayable.reduce((a, t) => a + t.amount, 0);
    push({
      id: 'overdue-payable',
      severity: 'danger',
      title: `${overduePayable.length} conta(s) em atraso`,
      description: `Total de R$ ${total.toLocaleString('pt-BR')} vencido. Regularize para evitar juros.`,
      actionLabel: 'Quitar contas',
      actionTab: 'finance',
    });
  }

  // 3. Contas a pagar vencendo nos próximos 7 dias
  const dueInWeek = transactions.filter((t) => {
    if (t.type !== 'Saída' || t.status !== 'Pendente') return false;
    const diff = daysBetween(todayStr, t.date);
    return diff >= 0 && diff <= 7;
  });
  if (dueInWeek.length > 0) {
    const total = dueInWeek.reduce((a, t) => a + t.amount, 0);
    push({
      id: 'due-payable',
      severity: 'warning',
      title: `${dueInWeek.length} conta(s) vencem em até 7 dias`,
      description: `R$ ${total.toLocaleString('pt-BR')} a pagar em breve. Prepare o caixa.`,
      actionLabel: 'Ver contas',
      actionTab: 'finance',
    });
  }

  // 4. Contas a receber vencidas
  const overdueReceivable = transactions.filter(
    (t) => t.type === 'Entrada' && t.status === 'Pendente' && t.date < todayStr
  );
  if (overdueReceivable.length > 0) {
    const total = overdueReceivable.reduce((a, t) => a + t.amount, 0);
    push({
      id: 'overdue-receivable',
      severity: 'warning',
      title: `${overdueReceivable.length} recebimento(s) em atraso`,
      description: `R$ ${total.toLocaleString('pt-BR')} a receber vencido. Acione a cobrança.`,
      actionLabel: 'Cobrar clientes',
      actionTab: 'accounts',
    });
  }

  // 5. Estoque baixo
  const lowStock = products.filter((p) => p.stockQuantity <= p.minStockQuantity);
  if (lowStock.length > 0) {
    push({
      id: 'low-stock',
      severity: lowStock.length >= 3 ? 'danger' : 'warning',
      title: `${lowStock.length} produto(s) com estoque baixo`,
      description: `Inclui: ${lowStock.slice(0, 3).map((p) => p.name).join(', ')}${lowStock.length > 3 ? '...' : ''}.`,
      actionLabel: 'Repor estoque',
      actionTab: 'stock',
    });
  }

  // 6. Meta mensal
  if (input.goalTarget > 0) {
    if (input.goalProgress >= 100) {
      push({
        id: 'goal-hit',
        severity: 'success',
        title: 'Meta mensal atingida',
        description: `Faturamento de ${Math.round(input.goalProgress)}% da meta. Excelente desempenho!`,
        actionLabel: 'Ver metas',
        actionTab: 'goals',
      });
    } else if (input.goalProgress < 40) {
      push({
        id: 'goal-far',
        severity: 'warning',
        title: 'Meta distante',
        description: `Apenas ${Math.round(input.goalProgress)}% da meta atingida (R$ ${input.goalTarget.toLocaleString('pt-BR')}).`,
        actionLabel: 'Ver metas',
        actionTab: 'goals',
      });
    }
  }

  // 7. Pró-labore acima do recomendado (máx. 30% do líquido)
  if (input.proLaboreMode !== 'fixed' && input.monthProfit > 0) {
    const ratio = input.proLaboreAmount / input.monthProfit;
    if (ratio > 0.3) {
      push({
        id: 'prolabore-high',
        severity: 'warning',
        title: 'Pró-labore acima do recomendado',
        description: `O pró-labore representa ${Math.round(ratio * 100)}% do líquido (recomendado: até 30%).`,
        actionLabel: 'Ajustar',
        actionTab: 'prolabore',
      });
    }
  }

  // 8. Líquido abaixo da média
  if (input.prev3MonthsAvgProfit > 0 && input.monthProfit < input.prev3MonthsAvgProfit * 0.8) {
    push({
      id: 'profit-below-average',
      severity: 'warning',
      title: 'Líquido abaixo da média',
      description: `Líquido do mês (R$ ${input.monthProfit.toLocaleString('pt-BR')}) está ${Math.round(
        (1 - input.monthProfit / input.prev3MonthsAvgProfit) * 100
      )}% abaixo da média dos últimos 3 meses.`,
      actionTab: 'finance',
    });
  }

  return alerts;
}

export function computeHealthScore(input: HealthInput): HealthScore {
  let score = 100;

  if (input.monthNetFlow < 0) score -= 20;
  const overduePayable = input.transactions.filter(
    (t) => t.type === 'Saída' && t.status === 'Pendente' && t.date < input.todayStr
  ).length;
  score -= overduePayable * 8;
  const lowStock = input.products.filter((p) => p.stockQuantity <= p.minStockQuantity).length;
  score -= lowStock * 3;
  if (input.prev3MonthsAvgProfit > 0 && input.monthProfit < input.prev3MonthsAvgProfit * 0.8) score -= 10;
  if (
    input.proLaboreMode !== 'fixed' &&
    input.monthProfit > 0 &&
    input.proLaboreAmount / input.monthProfit > 0.3
  ) {
    score -= 10;
  }
  if (input.goalTarget > 0 && input.goalProgress < 40) score -= 10;
  if (input.goalTarget > 0 && input.goalProgress >= 100) score += 5;

  score = Math.max(10, Math.min(100, score));

  const label =
    score >= 80
      ? 'Excelente'
      : score >= 60
      ? 'Boa'
      : score >= 40
      ? 'Atenção'
      : 'Crítica';

  return { score, label };
}
