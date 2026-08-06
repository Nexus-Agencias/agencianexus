import {
  User,
  Product,
  Customer,
  Supplier,
  Transaction,
  Sale,
  StockMovement,
  BankAccount,
  Appointment,
  Goal,
  CompanyConfig,
  ERPNotification,
  Employee,
  EmployeePayment,
  ProLaboreConfig,
  ProLaborePayment,
  RankingEntry,
} from '../types';

export const initialUsers: User[] = [];

export const initialSuppliers: Supplier[] = [];

export const initialProducts: Product[] = [];

export const initialCustomers: Customer[] = [];

export const initialBankAccounts: BankAccount[] = [];

export const initialTransactions: Transaction[] = [];

export const initialSales: Sale[] = [];

export const initialStockMovements: StockMovement[] = [];

export const initialAppointments: Appointment[] = [];

export const initialGoals: Goal[] = [];

export const initialCompanyConfig: CompanyConfig = {
  name: 'NEXUS AGÊNCIA',
  tradeName: 'NEXUS AGÊNCIA',
  cnpj: '12.345.678/0001-99',
  phone: '(11) 3003-9000',
  email: 'contato@nexusagencia.com.br',
  address: 'Avenida Faria Lima, 2500 - 15º Andar',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01452-000',
  logoUrl: '',
  theme: 'dark',
  language: 'pt-BR',
  currency: 'BRL',
};

export const initialNotifications: ERPNotification[] = [];

export const initialEmployees: Employee[] = [];

export const initialEmployeePayments: EmployeePayment[] = [];

export const initialProLaboreConfig: ProLaboreConfig = {
  mode: 'percent_profit',
  fixedValue: 12000.0,
  percentValue: 30,
  paymentDay: 5,
  autoPay: false,
  bankAccount: '',
  notes: 'Pró-labore do sócio administrador, definido sobre o líquido do mês.',
};

export const initialProLaborePayments: ProLaborePayment[] = [];

export const initialRanking: RankingEntry[] = [];
