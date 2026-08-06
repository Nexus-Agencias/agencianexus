export type UserRole = 'Administrador' | 'Gerente' | 'Funcionário';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  password?: string;
  createdAt: string;
  permissions?: string[];
  companyId?: string;
  companyCode?: string;
}

export type TransactionType = 'Entrada' | 'Saída';
export type TransactionStatus = 'Pago' | 'Pendente' | 'Cancelado';
export type PaymentMethod = 'PIX' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Boleto' | 'Dinheiro' | 'Transferência';

export type TransactionCategory =
  | 'Aluguel'
  | 'Salário'
  | 'Pró-Labore'
  | 'Marketing'
  | 'Fornecedor'
  | 'Internet'
  | 'Energia'
  | 'Água'
  | 'Combustível'
  | 'Investimentos'
  | 'Vendas'
  | 'Outros';

export type RevenueCategory =
  | 'Desenvolvimento de Sites e Sistemas'
  | 'Gestão de Tráfego Pago'
  | 'Marketing Digital'
  | 'Consultoria/Mentoria'
  | 'Compra e Venda'
  | 'Outros';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  bankAccount: string;
  date: string;
  status: TransactionStatus;
  receiptUrl?: string;
  notes?: string;
  customerId?: string;
  supplierId?: string;
  saleId?: string;
  employeeId?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  costPrice: number;
  salePrice: number;
  stockQuantity: number;
  minStockQuantity: number;
  supplierId?: string;
  supplierName?: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  document: string; // CPF / CNPJ
  address: string;
  city: string;
  state: string;
  zipCode: string;
  notes?: string;
  createdAt: string;
  totalSpent?: number;
  lastPurchaseDate?: string;
}

export interface Supplier {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  email: string;
  document?: string;
  suppliedProducts?: string;
  notes?: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export type SaleStatus = 'Concluída' | 'Pendente' | 'Cancelada';

export interface Sale {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number; // R$
  shipping: number; // R$
  total: number;
  paymentMethod: PaymentMethod;
  amountReceived: number;
  change: number;
  status: SaleStatus;
  notes?: string;
  sellerId?: string;
  sellerName?: string;
  category: RevenueCategory;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'Entrada' | 'Saída' | 'Ajuste';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  date: string;
  userName: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountType: 'Corrente' | 'Poupança' | 'Investimento' | 'Caixa Físico';
  accountNumber: string;
  agency?: string;
  balance: number;
  color?: string;
}

export type EmployeeStatus = 'Ativo' | 'Inativo' | 'Afastado';

export interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  hireDate: string;
  salary: number;
  benefits: string;
  commission: number;
  status: EmployeeStatus;
  notes?: string;
  createdAt: string;
}

export interface EmployeePayment {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string; // YYYY-MM
  amount: number;
  status: 'Pago' | 'Pendente';
  paidAt?: string;
  createdAt: string;
}

export type ProLaboreMode = 'fixed' | 'percent_profit' | 'percent_revenue';

export interface ProLaboreConfig {
  mode: ProLaboreMode;
  fixedValue: number;
  percentValue: number;
  paymentDay: number;
  autoPay: boolean;
  bankAccount: string;
  notes?: string;
}

export interface ProLaborePayment {
  id: string;
  month: string; // YYYY-MM
  amount: number;
  status: 'Pago' | 'Pendente';
  paymentType: 'manual' | 'automatic';
  paidAt?: string;
  notes?: string;
  createdAt: string;
}

export type AppointmentType = 'Compromisso' | 'Pagamento' | 'Cobrança' | 'Lembrete';

export interface Appointment {
  id: string;
  title: string;
  type: AppointmentType;
  date: string;
  time: string;
  description?: string;
  status: 'Pendente' | 'Concluído';
  relatedId?: string; // id de venda, transação ou cliente
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  startDate: string;
  endDate: string;
  metric: 'Receita' | 'Vendas' | 'Líquido' | 'Novos Clientes';
  status?: 'Em Andamento' | 'Concluído';
  category?: string;
}

export interface RankingEntry {
  id: string;
  name: string;
  amount: number;
  period?: string;
}

export interface CompanyConfig {
  name: string;
  tradeName: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  logoUrl?: string;
  theme: 'dark' | 'light';
  language: 'pt-BR';
  currency: 'BRL';
}

export interface ERPNotification {
  id: string;
  title: string;
  message: string;
  type: 'low_stock' | 'due_bill' | 'overdue_bill' | 'goal_reached' | 'new_customer' | 'new_sale' | 'info';
  createdAt: string;
  read: boolean;
  linkToTab?: string;
}

export type DateFilterType =
  | 'today'
  | 'yesterday'
  | '7days'
  | '30days'
  | '90days'
  | 'thisMonth'
  | 'thisYear'
  | 'custom';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}
