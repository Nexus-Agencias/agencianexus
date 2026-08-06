import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  User,
  UserRole,
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
  DateFilterType,
  DateRange,
  ToastMessage,
  TransactionType,
  TransactionStatus,
  Employee,
  EmployeePayment,
  ProLaboreConfig,
  ProLaborePayment,
  RankingEntry,
} from '../types';
import {
  initialUsers,
  initialSuppliers,
  initialProducts,
  initialCustomers,
  initialBankAccounts,
  initialTransactions,
  initialSales,
  initialStockMovements,
  initialAppointments,
  initialGoals,
  initialCompanyConfig,
  initialNotifications,
  initialEmployees,
  initialEmployeePayments,
  initialProLaboreConfig,
  initialProLaborePayments,
  initialRanking,
} from '../data/mockData';
import { getDateRange } from '../utils/formatters';

interface ERPContextType {
  // User & Auth
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  registerUser: (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    companyName?: string;
    companyCode?: string;
  }) => Promise<boolean>;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Cloud
  cloudEnabled: boolean;
  cloudStatus: 'off' | 'connecting' | 'synced' | 'error';
  companyCode: string | null;
  refreshCloudData: () => Promise<void>;
  migrateLocalDataToCloud: () => Promise<boolean>;

  // Navigation & UI
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCommandOpen: boolean;
  setIsCommandOpen: (open: boolean) => void;
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  removeToast: (id: string) => void;
  selectedSaleForReceipt: Sale | null;
  setSelectedSaleForReceipt: (sale: Sale | null) => void;

  // Date Filter
  dateFilter: DateFilterType;
  setDateFilter: (filter: DateFilterType) => void;
  customDateRange: DateRange;
  setCustomDateRange: (range: DateRange) => void;
  filteredDateRange: DateRange;

  // Entities & CRUD
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Employees
  employees: Employee[];
  addEmployee: (data: Omit<Employee, 'id' | 'createdAt'>) => void;
  updateEmployee: (id: string, data: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  employeePayments: EmployeePayment[];
  payEmployeeSalary: (employeeId: string, month: string) => void;

  // Pró-Labore
  proLaboreConfig: ProLaboreConfig;
  updateProLaboreConfig: (cfg: Partial<ProLaboreConfig>) => void;
  proLaborePayments: ProLaborePayment[];
  registerProLaborePayment: (data: {
    month: string;
    amount: number;
    status: 'Pago' | 'Pendente';
    paymentType: 'manual' | 'automatic';
    notes?: string;
  }) => void;
  markProLaborePaid: (id: string) => void;
  deleteProLaborePayment: (id: string) => void;
  computeProLaboreAmount: (monthKey: string) => number;
  monthIncomeOf: (monthKey: string) => number;
  monthProfitOf: (monthKey: string) => number;

  sales: Sale[];
  addSale: (saleData: Omit<Sale, 'id' | 'code' | 'createdAt'>) => Sale;
  cancelSale: (id: string) => void;

  stockMovements: StockMovement[];
  addStockMovement: (mov: Omit<StockMovement, 'id' | 'date'>) => void;

  bankAccounts: BankAccount[];
  addBankAccount: (acc: Omit<BankAccount, 'id'>) => BankAccount;
  updateBankAccount: (id: string, acc: Partial<BankAccount>) => void;

  appointments: Appointment[];
  addAppointment: (app: Omit<Appointment, 'id'>) => void;
  updateAppointment: (id: string, app: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  toggleAppointmentStatus: (id: string) => void;

  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;

  ranking: RankingEntry[];
  addRanking: (data: Omit<RankingEntry, 'id'>) => void;
  updateRanking: (id: string, data: Partial<RankingEntry>) => void;
  deleteRanking: (id: string) => void;

  companyConfig: CompanyConfig;
  updateCompanyConfig: (cfg: Partial<CompanyConfig>) => void;

  notifications: ERPNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // System actions
  triggerCelebration: () => void;
  exportBackupJSON: () => void;
  importBackupJSON: (jsonString: string) => boolean;
  resetToDemoData: () => void;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

// Data keys stored per-account (scoped by user id). Users/currentUser stay global.
const scopedDataKeys = [
  'products',
  'customers',
  'suppliers',
  'transactions',
  'employees',
  'employeePayments',
  'proLaboreConfig',
  'proLaborePayments',
  'sales',
  'stockMovements',
  'bankAccounts',
  'appointments',
  'goals',
  'ranking',
  'companyConfig',
  'notifications',
] as const;

function hasGlobalData(): boolean {
  return scopedDataKeys.some((key) => localStorage.getItem(`nexus_erp_v2_${key}`) !== null);
}

function supabaseAuthErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials') || m.includes('invalid email or password'))
    return 'E-mail ou senha incorretos. Tente novamente.';
  if (m.includes('already registered') || m.includes('already exists')) return 'Este e-mail já está cadastrado.';
  if (m.includes('rate limit')) return 'Muitas tentativas. Aguarde alguns segundos e tente novamente.';
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de fazer login.';
  return message;
}

function migrateGlobalDataToScope(userId: string) {
  scopedDataKeys.forEach((key) => {
    const globalVal = localStorage.getItem(`nexus_erp_v2_${key}`);
    if (globalVal !== null) {
      localStorage.setItem(`nexus_erp_v2_${userId}_${key}`, globalVal);
      localStorage.removeItem(`nexus_erp_v2_${key}`);
    }
  });
}

// Pre-render migration: if a real (password-protected) user is already logged in and
// legacy global data still exists, move that data into the user's private scope.
(function migrateGlobalDataForLoggedUser() {
  try {
    const raw = localStorage.getItem('nexus_erp_v2_currentUser');
    if (!raw) return;
    const user = JSON.parse(raw);
    if (!user || !user.id || !user.password) return;
    if (!hasGlobalData()) return;
    migrateGlobalDataToScope(user.id);
  } catch {
    // ignore
  }
})();

const VALID_TAB_PATHS = new Set([
  'dashboard',
  'health',
  'finance',
  'categories',
  'sales',
  'customers',
  'products',
  'stock',
  'suppliers',
  'employees',
  'prolabore',
  'accounts',
  'reports',
  'agenda',
  'goals',
  'settings',
  'profile',
]);

const getTabFromPath = (): string => {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  return path && VALID_TAB_PATHS.has(path) ? path : 'dashboard';
};

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Helper for localStorage
  // Per-account scoped persistence. `scope` = user id ('' = global, e.g. login screen / shared users list).
  const usePersistentState = <T,>(
    scope: string,
    key: string,
    initialValue: T
  ): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const storageKey = scope ? `nexus_erp_v2_${scope}_${key}` : `nexus_erp_v2_${key}`;
    const prevKeyRef = useRef(storageKey);

    const [state, setState] = useState<T>(() => {
      try {
        const item = localStorage.getItem(storageKey);
        return item ? JSON.parse(item) : initialValue;
      } catch {
        return initialValue;
      }
    });

    useEffect(() => {
      if (prevKeyRef.current !== storageKey) {
        prevKeyRef.current = storageKey;
        try {
          const item = localStorage.getItem(storageKey);
          setState(item ? JSON.parse(item) : initialValue);
        } catch {
          setState(initialValue);
        }
        return;
      }
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (err) {
        console.error('Error saving state to localStorage', err);
      }
    }, [storageKey, state]);

    return [state, setState];
  };

  // Auth & User State (global, not scoped per user)
  const [users, setUsers] = usePersistentState<User[]>('', 'users', initialUsers);
  const [currentUser, setCurrentUser] = usePersistentState<User | null>('', 'currentUser', null);

  // Cloud mode: data is shared per company; localStorage mode: data is isolated per user account.
  const dataScope = isSupabaseConfigured ? (currentUser?.companyId ?? '') : (currentUser ? currentUser.id : '');

  // Navigation
  const [activeTab, setActiveTab] = useState<string>(getTabFromPath);
  const [isCommandOpen, setIsCommandOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);

  // Keep URL path in sync with active tab (e.g. /funcionarios)
  useEffect(() => {
    const path = activeTab === 'dashboard' ? '/' : `/${activeTab}`;
    window.history.replaceState(null, '', path);
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => setActiveTab(getTabFromPath());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Date Filter
  const [dateFilter, setDateFilter] = useState<DateFilterType>('thisMonth');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const filteredDateRange = getDateRange(dateFilter, customDateRange);

  // Entities
  const [products, setProducts] = usePersistentState<Product[]>(dataScope, 'products', initialProducts);
  const [customers, setCustomers] = usePersistentState<Customer[]>(dataScope, 'customers', initialCustomers);
  const [suppliers, setSuppliers] = usePersistentState<Supplier[]>(dataScope, 'suppliers', initialSuppliers);
  const [transactions, setTransactions] = usePersistentState<Transaction[]>(dataScope, 'transactions', initialTransactions);
  const [employees, setEmployees] = usePersistentState<Employee[]>(dataScope, 'employees', initialEmployees);
  const [employeePayments, setEmployeePayments] = usePersistentState<EmployeePayment[]>(
    dataScope,
    'employeePayments',
    initialEmployeePayments
  );
  const [proLaboreConfig, setProLaboreConfig] = usePersistentState<ProLaboreConfig>(
    dataScope,
    'proLaboreConfig',
    initialProLaboreConfig
  );
  const [proLaborePayments, setProLaborePayments] = usePersistentState<ProLaborePayment[]>(
    dataScope,
    'proLaborePayments',
    initialProLaborePayments
  );
  const [sales, setSales] = usePersistentState<Sale[]>(dataScope, 'sales', initialSales);
  const [stockMovements, setStockMovements] = usePersistentState<StockMovement[]>(dataScope, 'stockMovements', initialStockMovements);
  const [bankAccounts, setBankAccounts] = usePersistentState<BankAccount[]>(dataScope, 'bankAccounts', initialBankAccounts);
  const [appointments, setAppointments] = usePersistentState<Appointment[]>(dataScope, 'appointments', initialAppointments);
  const [goals, setGoals] = usePersistentState<Goal[]>(dataScope, 'goals', initialGoals);
  const [ranking, setRanking] = usePersistentState<RankingEntry[]>(dataScope, 'ranking', initialRanking);
  const [companyConfig, setCompanyConfig] = usePersistentState<CompanyConfig>(dataScope, 'companyConfig', initialCompanyConfig);
  const [notifications, setNotifications] = usePersistentState<ERPNotification[]>(dataScope, 'notifications', initialNotifications);

  // ---------------------------------------------------------------------------
  // Cloud sync (Supabase). Only active when isSupabaseConfigured.
  // ---------------------------------------------------------------------------
  const [cloudStatus, setCloudStatus] = useState<'off' | 'connecting' | 'synced' | 'error'>(isSupabaseConfigured ? 'connecting' : 'off');
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  const lastSavedSnapshotRef = useRef<string>('');

  const buildSnapshot = () => ({
    products,
    customers,
    suppliers,
    transactions,
    employees,
    employeePayments,
    proLaboreConfig,
    proLaborePayments,
    sales,
    stockMovements,
    bankAccounts,
    appointments,
    goals,
    ranking,
    companyConfig,
    notifications,
  });

  const applySnapshot = (data: any) => {
    setProducts(data.products ?? initialProducts);
    setCustomers(data.customers ?? initialCustomers);
    setSuppliers(data.suppliers ?? initialSuppliers);
    setTransactions(data.transactions ?? initialTransactions);
    setEmployees(data.employees ?? initialEmployees);
    setEmployeePayments(data.employeePayments ?? initialEmployeePayments);
    setProLaboreConfig(data.proLaboreConfig ?? initialProLaboreConfig);
    setProLaborePayments(data.proLaborePayments ?? initialProLaborePayments);
    setSales(data.sales ?? initialSales);
    setStockMovements(data.stockMovements ?? initialStockMovements);
    setBankAccounts(data.bankAccounts ?? initialBankAccounts);
    setAppointments(data.appointments ?? initialAppointments);
    setGoals(data.goals ?? initialGoals);
    setRanking(data.ranking ?? initialRanking);
    setCompanyConfig(data.companyConfig ?? initialCompanyConfig);
    setNotifications(data.notifications ?? initialNotifications);
  };

  const refreshCloudData = async () => {
    if (!supabase) return;
    setCloudStatus('connecting');
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setCloudStatus('off');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (!profile) {
      setCloudStatus('off');
      return;
    }

    const companyId = profile.company_id as string;
    setCurrentUser({
      id: profile.id,
      name: profile.name,
      email: profile.email ?? user.email ?? '',
      role: profile.role,
      avatar: profile.avatar,
      phone: profile.phone,
      companyId,
      createdAt: profile.created_at,
    });

    const [profilesRes, companyRes, stateRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('company_id', companyId),
      supabase.from('companies').select('code, name').eq('id', companyId).single(),
      supabase.from('company_state').select('data').eq('company_id', companyId).single(),
    ]);

    if (profilesRes.data) {
      setUsers(
        profilesRes.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          email: p.email ?? '',
          role: p.role,
          avatar: p.avatar,
          phone: p.phone,
          companyId: p.company_id,
          createdAt: p.created_at,
        }))
      );
    }
    if (companyRes.data) setCompanyCode((companyRes.data as any).code ?? null);
    applySnapshot(stateRes.data?.data ?? {});
    setCloudStatus('synced');
  };

  // Session bootstrap + auth state listener
  useEffect(() => {
    if (!supabase) return;
    const bootstrap = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) await refreshCloudData();
      else setCloudStatus('off');
    };
    bootstrap();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        refreshCloudData();
      } else {
        setCurrentUser(null);
        setUsers([]);
        setCompanyCode(null);
        setCloudStatus('off');
      }
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced save of the whole company snapshot to the cloud
  useEffect(() => {
    if (!supabase || !currentUser?.companyId) return;
    const snapshot = buildSnapshot();
    const timer = setTimeout(async () => {
      lastSavedSnapshotRef.current = JSON.stringify(snapshot);
      const { error } = await supabase
        .from('company_state')
        .upsert({ company_id: currentUser.companyId, data: snapshot }, { onConflict: 'company_id' });
      if (error) {
        console.error('NEXUS sync error:', error);
        setCloudStatus('error');
      } else {
        setCloudStatus('synced');
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [
    products,
    customers,
    suppliers,
    transactions,
    employees,
    employeePayments,
    proLaboreConfig,
    proLaborePayments,
    sales,
    stockMovements,
    bankAccounts,
    appointments,
    goals,
    ranking,
    companyConfig,
    notifications,
    currentUser?.companyId,
  ]);

  // Realtime: apply changes made by other team members
  useEffect(() => {
    if (!supabase || !currentUser?.companyId) return;
    const channel = supabase
      .channel(`company_state_${currentUser.companyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'company_state',
          filter: `company_id=eq.${currentUser.companyId}`,
        },
        (payload: any) => {
          const incoming = payload.new?.data;
          if (incoming && JSON.stringify(incoming) !== lastSavedSnapshotRef.current) {
            applySnapshot(incoming);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.companyId]);

  // Migrate existing localStorage data into the current company's cloud state
  const migrateLocalDataToCloud = async (): Promise<boolean> => {
    if (!supabase || !currentUser?.companyId) return false;
    const merged: Record<string, any> = {};
    const setOrMerge = (key: string, value: any) => {
      if (Array.isArray(value)) {
        const existing = Array.isArray(merged[key]) ? merged[key] : [];
        const byId = new Map(existing.map((x: any) => [x.id, x]));
        value.forEach((x: any) => {
          if (x && x.id) byId.set(x.id, x);
        });
        merged[key] = Array.from(byId.values());
      } else {
        merged[key] = value;
      }
    };
    for (const key of scopedDataKeys) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k === `nexus_erp_v2_${key}` || k.endsWith(`_${key}`)) {
          try {
            const parsed = JSON.parse(localStorage.getItem(k)!);
            if (parsed) setOrMerge(key, parsed);
          } catch {
            // ignore malformed entries
          }
        }
      }
    }
    const snapshot = { ...buildSnapshot(), ...merged };
    const { error } = await supabase
      .from('company_state')
      .upsert({ company_id: currentUser.companyId, data: snapshot }, { onConflict: 'company_id' });
    if (error) {
      addToast('error', `Falha ao migrar dados: ${error.message}`);
      return false;
    }
    await refreshCloudData();
    addToast('success', 'Dados do navegador migrados para a nuvem com sucesso!');
    return true;
  };

  // Remove legacy/demo users (accounts without private password) from storage
  useEffect(() => {
    if (isSupabaseConfigured) return;
    const hasPassword = (u: User) => Boolean(u.password && u.password.trim() !== '');
    if (users.some((u) => !hasPassword(u))) {
      setUsers((prev) => prev.filter(hasPassword));
      setCurrentUser((prev) => (prev && hasPassword(prev) ? prev : null));
      addToast('info', 'Perfis de demonstração removidos. Cadastre seus usuários.');
    }
  }, []);

  // Auto-migrate old company name from localStorage if present
  useEffect(() => {
    const isLegacyName =
      companyConfig.tradeName?.includes('ERP') ||
      companyConfig.tradeName?.includes('TECH') ||
      companyConfig.name?.includes('TECNOLOGIA');

    const tradeNameDiverged = companyConfig.tradeName !== companyConfig.name;

    if (isLegacyName) {
      setCompanyConfig((prev) => ({
        ...prev,
        name: 'NEXUS AGÊNCIA',
        tradeName: 'NEXUS AGÊNCIA',
        email: prev.email?.includes('nexus-erp') ? 'contato@nexusagencia.com.br' : prev.email,
      }));
    } else if (tradeNameDiverged && companyConfig.name) {
      setCompanyConfig((prev) => ({ ...prev, tradeName: prev.name }));
    }
  }, []);

  // Toast Helpers
  const addToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7C3AED', '#A855F7', '#22C55E', '#3B82F6'],
      });
    } catch {
      // ignore
    }
  };

  // Auth Functions
  const login = async (email: string, password: string): Promise<boolean> => {
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        addToast('error', supabaseAuthErrorMessage(error.message));
        return false;
      }
      return true;
    }

    const userFound = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (userFound && userFound.password && userFound.password === password) {
      if (hasGlobalData()) migrateGlobalDataToScope(userFound.id);
      setCurrentUser(userFound);
      addToast('success', `Bem-vindo de volta, ${userFound.name}!`);
      return true;
    }
    if (userFound) {
      addToast('error', 'Senha incorreta. Tente novamente.');
    } else {
      addToast('error', 'E-mail não cadastrado. Crie sua conta para acessar.');
    }
    return false;
  };

  const logout = () => {
    if (supabase) {
      supabase.auth.signOut();
      return;
    }
    setCurrentUser(null);
    addToast('info', 'Você saiu do sistema com segurança.');
  };

  const registerUser = async (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    companyName?: string;
    companyCode?: string;
  }): Promise<boolean> => {
    if (supabase) {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });
      if (error || !signUpData.user) {
        addToast('error', supabaseAuthErrorMessage(error?.message ?? 'Falha ao criar conta.'));
        return false;
      }
      if (!signUpData.session) {
        addToast('warning', 'Confirme seu e-mail para ativar o acesso ao sistema.');
        return true;
      }
      const rpcParams = data.companyCode
        ? { p_code: data.companyCode, p_user_name: data.name, p_email: data.email, p_role: data.role }
        : {
            p_company_name: data.companyName || 'Minha Empresa',
            p_user_name: data.name,
            p_email: data.email,
            p_role: data.role,
          };
      const rpcName = data.companyCode ? 'join_company' : 'create_company';
      const { data: rpcData, error: rpcError } = await supabase.rpc(rpcName, rpcParams);
      if (rpcError) {
        addToast('error', rpcError.message);
        return false;
      }
      if (data.companyCode) {
        addToast('success', `Bem-vindo(a) à empresa! Você entrou com o código ${data.companyCode.toUpperCase()}.`);
      } else {
        const code = (rpcData as any)?.code;
        addToast('success', code ? `Empresa criada! Seu código de equipe: ${code}` : 'Empresa criada com sucesso!');
      }
      return true;
    }

    const exists = users.some((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (exists) {
      addToast('error', 'Já existe um usuário com este e-mail.');
      return false;
    }
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: data.name,
      email: data.email,
      role: data.role,
      password: data.password,
      createdAt: new Date().toISOString(),
    };

    // First account: move the existing (global) data into this user's private scope
    if (users.length === 0 && hasGlobalData()) {
      migrateGlobalDataToScope(newUser.id);
    }

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    addToast('success', `Acesso privado criado para ${newUser.name}!`);
    return true;
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    if (supabase) {
      addToast('info', 'Membros da equipe usam o código da empresa para criar o próprio acesso.');
      return;
    }
    const newUser: User = {
      ...userData,
      id: `usr_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    addToast('success', `Usuário "${newUser.name}" cadastrado!`);
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...userData } : u)));
    if (currentUser?.id === id) {
      setCurrentUser((prev) => (prev ? { ...prev, ...userData } : null));
    }
    if (supabase) {
      const { password: pwd, ...profileData } = userData;
      if (pwd) {
        supabase.auth.updateUser({ password: pwd });
      }
      if (Object.keys(profileData).length > 0) {
        const { name, avatar, phone, role } = profileData;
        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (avatar !== undefined) updates.avatar = avatar;
        if (phone !== undefined) updates.phone = phone;
        if (role !== undefined) updates.role = role;
        if (Object.keys(updates).length > 0) {
          supabase.from('profiles').update(updates).eq('id', id);
        }
      }
    }
    addToast('success', 'Dados de usuário atualizados!');
  };

  const deleteUser = (id: string) => {
    if (users.length <= 1) {
      addToast('error', 'Não é possível excluir o único usuário do sistema.');
      return;
    }
    if (supabase) {
      supabase.rpc('remove_member', { p_member_id: id }).then(({ error }) => {
        if (error) addToast('error', error.message);
      });
    } else {
      scopedDataKeys.forEach((key) => {
        localStorage.removeItem(`nexus_erp_v2_${id}_${key}`);
      });
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    addToast('success', 'Usuário removido.');
  };

  // Products CRUD
  const addProduct = (prodData: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...prodData,
      id: `prod_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProduct, ...prev]);

    // Check stock alert
    if (newProduct.stockQuantity <= newProduct.minStockQuantity) {
      const notif: ERPNotification = {
        id: `notif_${Date.now()}`,
        title: 'Alerta de Baixo Estoque',
        message: `Produto "${newProduct.name}" cadastrado com estoque baixo (${newProduct.stockQuantity} un).`,
        type: 'low_stock',
        createdAt: new Date().toISOString(),
        read: false,
        linkToTab: 'stock',
      };
      setNotifications((prev) => [notif, ...prev]);
    }

    addToast('success', `Produto "${newProduct.name}" cadastrado com sucesso!`);
  };

  const updateProduct = (id: string, prodData: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...prodData };
          // Trigger stock notification if stock drops below minStock
          if (
            updated.stockQuantity <= updated.minStockQuantity &&
            p.stockQuantity > p.minStockQuantity
          ) {
            const notif: ERPNotification = {
              id: `notif_${Date.now()}`,
              title: 'Alerta de Baixo Estoque',
              message: `Atenção: "${updated.name}" agora possui apenas ${updated.stockQuantity} unidades em estoque.`,
              type: 'low_stock',
              createdAt: new Date().toISOString(),
              read: false,
              linkToTab: 'stock',
            };
            setNotifications((n) => [notif, ...n]);
          }
          return updated;
        }
        return p;
      })
    );
    addToast('success', 'Produto atualizado com sucesso!');
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    addToast('success', 'Produto removido com sucesso.');
  };

  // Customers CRUD
  const addCustomer = (custData: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...custData,
      id: `cli_${Date.now()}`,
      createdAt: new Date().toISOString(),
      totalSpent: 0,
    };
    setCustomers((prev) => [newCustomer, ...prev]);

    const notif: ERPNotification = {
      id: `notif_${Date.now()}`,
      title: 'Novo Cliente Cadastrado',
      message: `Cliente "${newCustomer.name}" foi adicionado ao CRM.`,
      type: 'new_customer',
      createdAt: new Date().toISOString(),
      read: false,
      linkToTab: 'customers',
    };
    setNotifications((prev) => [notif, ...prev]);

    addToast('success', `Cliente "${newCustomer.name}" cadastrado!`);
  };

  const updateCustomer = (id: string, custData: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...custData } : c)));
    addToast('success', 'Cliente atualizado com sucesso!');
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    addToast('success', 'Cliente removido.');
  };

  // Suppliers CRUD
  const addSupplier = (supData: Omit<Supplier, 'id' | 'createdAt'>) => {
    const newSup: Supplier = {
      ...supData,
      id: `sup_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSuppliers((prev) => [newSup, ...prev]);
    addToast('success', `Fornecedor "${newSup.name}" cadastrado!`);
  };

  const updateSupplier = (id: string, supData: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...supData } : s)));
    addToast('success', 'Fornecedor atualizado!');
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    addToast('success', 'Fornecedor removido.');
  };

  // Transactions CRUD
  const addTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [newTx, ...prev]);

    addToast('success', `${newTx.type === 'Entrada' ? 'Receita' : 'Despesa'} registrada com sucesso!`);
  };

  const updateTransaction = (id: string, txData: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === id) {
          const updated = { ...tx, ...txData };
          return updated;
        }
        return tx;
      })
    );
    addToast('success', 'Lançamento atualizado!');
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    addToast('success', 'Lançamento removido.');
  };

  // -------- Helpers de cálculos financeiros --------
  const sumPaidByMonth = (type: TransactionType, monthKey: string) =>
    transactions
      .filter((t) => t.type === type && t.status === 'Pago' && t.date.startsWith(monthKey))
      .reduce((acc, t) => acc + t.amount, 0);

  const monthIncomeOf = (monthKey: string) => sumPaidByMonth('Entrada', monthKey);
  const monthProfitOf = (monthKey: string) =>
    monthIncomeOf(monthKey) - sumPaidByMonth('Saída', monthKey);

  const computeProLaboreAmount = (monthKey: string) => {
    if (proLaboreConfig.mode === 'fixed') return proLaboreConfig.fixedValue;
    if (proLaboreConfig.mode === 'percent_profit') {
      return Math.max(0, monthProfitOf(monthKey)) * (proLaboreConfig.percentValue / 100);
    }
    return monthIncomeOf(monthKey) * (proLaboreConfig.percentValue / 100);
  };

  // -------- Employees (Funcionários) --------
  const addEmployee = (data: Omit<Employee, 'id' | 'createdAt'>) => {
    const newEmployee: Employee = {
      ...data,
      id: `emp_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setEmployees((prev) => [newEmployee, ...prev]);

    if (newEmployee.status === 'Ativo') {
      const monthKey = new Date().toISOString().slice(0, 7);
      const existing = transactions.find(
        (t) => t.employeeId === newEmployee.id && t.date.startsWith(monthKey)
      );
      if (!existing) {
        const tx: Transaction = {
          id: `tx_sal_${newEmployee.id}`,
          type: 'Saída',
          category: 'Salário',
          description: `Salário de ${newEmployee.name} - ${monthKey.replace('-', '/')}`,
          amount: newEmployee.salary,
          paymentMethod: 'Transferência',
          bankAccount: proLaboreConfig.bankAccount || 'acc_1',
          date: `${monthKey}-05`,
          status: 'Pendente',
          employeeId: newEmployee.id,
          notes: `Gerado automaticamente para o funcionário ${newEmployee.name}.`,
          createdAt: new Date().toISOString(),
        };
        setTransactions((prev) => [tx, ...prev]);
      }
    }

    addToast('success', `Funcionário "${newEmployee.name}" cadastrado!`);
  };

  const updateEmployee = (id: string, data: Partial<Employee>) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
    addToast('success', 'Funcionário atualizado!');
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    setEmployeePayments((prev) => prev.filter((p) => p.employeeId !== id));
    addToast('success', 'Funcionário removido.');
  };

  const payEmployeeSalary = (employeeId: string, month: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    if (!employee) return;

    const existingPay = employeePayments.find((p) => p.employeeId === employeeId && p.month === month);
    const todayStr = new Date().toISOString().split('T')[0];

    if (existingPay) {
      setEmployeePayments((prev) =>
        prev.map((p) =>
          p.id === existingPay.id
            ? { ...p, status: 'Pago', paidAt: new Date().toISOString() }
            : p
        )
      );
    } else {
      const newPay: EmployeePayment = {
        id: `epay_${Date.now()}`,
        employeeId: employee.id,
        employeeName: employee.name,
        month,
        amount: employee.salary,
        status: 'Pago',
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      setEmployeePayments((prev) => [newPay, ...prev]);
    }

    setTransactions((prev) =>
      prev.map((t) => {
        if (t.employeeId === employeeId && t.date.startsWith(month)) {
          return { ...t, status: 'Pago' as TransactionStatus, date: todayStr };
        }
        return t;
      })
    );

    addToast('success', `Salário de ${employee.name} marcado como pago!`);
  };

  // -------- Pró-Labore --------
  const updateProLaboreConfig = (cfg: Partial<ProLaboreConfig>) => {
    setProLaboreConfig((prev) => ({ ...prev, ...cfg }));
    addToast('success', 'Configuração de Pró-Labore salva!');
  };

  const registerProLaborePayment = (data: {
    month: string;
    amount: number;
    status: 'Pago' | 'Pendente';
    paymentType: 'manual' | 'automatic';
    notes?: string;
  }) => {
    const existing = proLaborePayments.find((p) => p.month === data.month);
    if (existing) {
      setProLaborePayments((prev) =>
        prev.map((p) =>
          p.month === data.month
            ? {
                ...p,
                amount: data.amount,
                status: data.status,
                paymentType: data.paymentType,
                notes: data.notes ?? p.notes,
                paidAt: data.status === 'Pago' ? p.paidAt ?? new Date().toISOString() : undefined,
              }
            : p
        )
      );
      return;
    }

    const newPay: ProLaborePayment = {
      id: `plp_${Date.now()}`,
      month: data.month,
      amount: data.amount,
      status: data.status,
      paymentType: data.paymentType,
      paidAt: data.status === 'Pago' ? new Date().toISOString() : undefined,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };
    setProLaborePayments((prev) => [newPay, ...prev]);

    const txExists = transactions.find(
      (t) => t.category === 'Pró-Labore' && t.date.startsWith(data.month)
    );
    if (!txExists) {
      const tx: Transaction = {
        id: `tx_pl_${newPay.id}`,
        type: 'Saída',
        category: 'Pró-Labore',
        description: `Pró-Labore do Sócio - ${data.month.replace('-', '/')}`,
        amount: data.amount,
        paymentMethod: 'Transferência',
        bankAccount: proLaboreConfig.bankAccount || 'acc_1',
        date: `${data.month}-05`,
        status: data.status,
        notes: data.notes || 'Pagamento gerado pelo módulo de Pró-Labore.',
        createdAt: new Date().toISOString(),
      };
      setTransactions((prev) => [tx, ...prev]);
    }
  };

  const markProLaborePaid = (id: string) => {
    const payment = proLaborePayments.find((p) => p.id === id);
    if (!payment) return;
    const monthKey = payment.month;
    setProLaborePayments((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: 'Pago' as const, paidAt: new Date().toISOString() }
          : p
      )
    );
    setTransactions((prev) =>
      prev.map((t) =>
        t.category === 'Pró-Labore' && t.date.startsWith(monthKey)
          ? { ...t, status: 'Pago' as TransactionStatus, date: new Date().toISOString().split('T')[0] }
          : t
      )
    );
    addToast('success', 'Pró-Labore marcado como pago!');
  };

  const deleteProLaborePayment = (id: string) => {
    setProLaborePayments((prev) => prev.filter((p) => p.id !== id));
    addToast('success', 'Lançamento de Pró-Labore removido.');
  };

  // Auto-pay do Pró-Labore: quando habilitado, gera o lançamento do mês
  // e marca como pago após o dia configurado (pagamento automático).
  useEffect(() => {
    if (!proLaboreConfig.autoPay) return;
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const existing = proLaborePayments.find((p) => p.month === monthKey);

    if (!existing) {
      const amount = computeProLaboreAmount(monthKey);
      registerProLaborePayment({
        month: monthKey,
        amount,
        status: 'Pendente',
        paymentType: 'automatic',
        notes: 'Gerado automaticamente (pagamento automático habilitado).',
      });
    } else if (existing.status === 'Pendente' && now.getDate() >= proLaboreConfig.paymentDay) {
      const todayStr = now.toISOString().split('T')[0];
      setProLaborePayments((prev) =>
        prev.map((p) =>
          p.month === monthKey
            ? { ...p, status: 'Pago' as const, paidAt: now.toISOString() }
            : p
        )
      );
      setTransactions((prev) =>
        prev.map((t) =>
          t.category === 'Pró-Labore' && t.date.startsWith(monthKey)
            ? { ...t, status: 'Pago' as TransactionStatus, date: todayStr }
            : t
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proLaboreConfig.autoPay, proLaboreConfig.paymentDay]);

  // Sales (PDV / Order Execution)
  const addSale = (saleData: Omit<Sale, 'id' | 'code' | 'createdAt'>): Sale => {
    const now = new Date();
    const code = `VEN-${now.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newSale: Sale = {
      ...saleData,
      id: `sale_${Date.now()}`,
      code,
      createdAt: now.toISOString(),
    };

    // 1. Add Sale
    setSales((prev) => [newSale, ...prev]);

    // 2. Reduce product stock & record stock movements
    newSale.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        const previousStock = prod.stockQuantity;
        const newStock = Math.max(0, previousStock - item.quantity);

        // Update product stock
        updateProduct(item.productId, { stockQuantity: newStock });

        // Add movement log
        const mov: StockMovement = {
          id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          productId: item.productId,
          productName: item.productName,
          type: 'Saída',
          quantity: item.quantity,
          previousStock,
          newStock,
          reason: `Venda ${code}`,
          date: now.toISOString(),
          userName: currentUser?.name || 'Sistema',
        };
        setStockMovements((prev) => [mov, ...prev]);
      }
    });

    // 3. Update Customer LTV
    if (newSale.customerId) {
      const cust = customers.find((c) => c.id === newSale.customerId);
      if (cust) {
        const currentTotal = cust.totalSpent || 0;
        updateCustomer(newSale.customerId, {
          totalSpent: currentTotal + newSale.total,
          lastPurchaseDate: now.toISOString(),
        });
      }
    }

    // 4. Automatically generate a Finance Transaction
    const financeTx: Transaction = {
      id: `tx_sale_${newSale.id}`,
      type: 'Entrada',
      category: 'Vendas',
      description: `Venda ${code} - ${newSale.customerName}`,
      amount: newSale.total,
      paymentMethod: newSale.paymentMethod,
      bankAccount: 'acc_2',
      date: now.toISOString().split('T')[0],
      status: 'Pago',
      saleId: newSale.id,
      customerId: newSale.customerId,
      notes: `Venda contendo ${newSale.items.length} itens.`,
      createdAt: now.toISOString(),
    };
    setTransactions((prev) => [financeTx, ...prev]);

    // 6. Notification & Celebration
    const notif: ERPNotification = {
      id: `notif_${Date.now()}`,
      title: 'Nova Venda Realizada! 🛍️',
      message: `Venda ${code} de R$ ${newSale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} finalizada com sucesso!`,
      type: 'new_sale',
      createdAt: now.toISOString(),
      read: false,
      linkToTab: 'sales',
    };
    setNotifications((prev) => [notif, ...prev]);

    triggerCelebration();
    addToast('success', `Venda ${code} realizada com sucesso!`);

    return newSale;
  };

  const cancelSale = (id: string) => {
    const sale = sales.find((s) => s.id === id);
    if (!sale) return;

    // Restore stock
    sale.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        const previousStock = prod.stockQuantity;
        const newStock = previousStock + item.quantity;
        updateProduct(item.productId, { stockQuantity: newStock });

        const mov: StockMovement = {
          id: `mov_cancel_${Date.now()}`,
          productId: item.productId,
          productName: item.productName,
          type: 'Entrada',
          quantity: item.quantity,
          previousStock,
          newStock,
          reason: `Cancelamento da Venda ${sale.code}`,
          date: new Date().toISOString(),
          userName: currentUser?.name || 'Sistema',
        };
        setStockMovements((prev) => [mov, ...prev]);
      }
    });

    // Update status
    setSales((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'Cancelada' } : s)));

    // Cancel related transaction
    setTransactions((prev) => prev.map((t) => (t.saleId === id ? { ...t, status: 'Cancelado' } : t)));

    addToast('info', `Venda ${sale.code} cancelada. Estoque estornado.`);
  };

  // Stock Movement
  const addStockMovement = (movData: Omit<StockMovement, 'id' | 'date'>) => {
    const newMov: StockMovement = {
      ...movData,
      id: `mov_${Date.now()}`,
      date: new Date().toISOString(),
    };
    setStockMovements((prev) => [newMov, ...prev]);

    // Apply stock adjustment to product
    const prod = products.find((p) => p.id === movData.productId);
    if (prod) {
      let updatedStock = prod.stockQuantity;
      if (movData.type === 'Entrada') updatedStock += movData.quantity;
      else if (movData.type === 'Saída') updatedStock = Math.max(0, updatedStock - movData.quantity);
      else if (movData.type === 'Ajuste') updatedStock = movData.quantity;

      updateProduct(prod.id, { stockQuantity: updatedStock });
    }

    addToast('success', 'Movimentação de estoque registrada!');
  };

  // Bank Accounts
  const addBankAccount = (accData: Omit<BankAccount, 'id'>): BankAccount => {
    const newAcc: BankAccount = { ...accData, id: `acc_${Date.now()}` };
    setBankAccounts((prev) => [...prev, newAcc]);
    addToast('success', 'Conta bancária adicionada!');
    return newAcc;
  };

  const updateBankAccount = (id: string, accData: Partial<BankAccount>) => {
    setBankAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...accData } : a)));
    addToast('success', 'Conta bancária atualizada!');
  };

  // Appointments
  const addAppointment = (appData: Omit<Appointment, 'id'>) => {
    const newApp: Appointment = { ...appData, id: `app_${Date.now()}` };
    setAppointments((prev) => [newApp, ...prev]);
    addToast('success', 'Compromisso agendado!');
  };

  const updateAppointment = (id: string, appData: Partial<Appointment>) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, ...appData } : a)));
    addToast('success', 'Agendamento atualizado!');
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    addToast('success', 'Agendamento excluído.');
  };

  const toggleAppointmentStatus = (id: string) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: a.status === 'Concluído' ? 'Pendente' : 'Concluído' } : a
      )
    );
  };

  // Goals
  const addGoal = (goalData: Omit<Goal, 'id'>) => {
    const newGoal: Goal = { ...goalData, id: `goal_${Date.now()}` };
    setGoals((prev) => [newGoal, ...prev]);
    addToast('success', 'Nova meta adicionada!');
  };

  const updateGoal = (id: string, goalData: Partial<Goal>) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...goalData } : g)));
    addToast('success', 'Meta atualizada!');
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    addToast('success', 'Meta removida.');
  };

  // Ranking de Performance Comercial
  const addRanking = (data: Omit<RankingEntry, 'id'>) => {
    const newEntry: RankingEntry = { ...data, id: `rank_${Date.now()}` };
    setRanking((prev) => [...prev, newEntry]);
    addToast('success', `Colocação "${newEntry.name}" adicionada ao ranking!`);
  };

  const updateRanking = (id: string, data: Partial<RankingEntry>) => {
    setRanking((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
    addToast('success', 'Colocação do ranking atualizada!');
  };

  const deleteRanking = (id: string) => {
    setRanking((prev) => prev.filter((r) => r.id !== id));
    addToast('success', 'Colocação removida do ranking.');
  };

  // Company Config
  const updateCompanyConfig = (cfg: Partial<CompanyConfig>) => {
    setCompanyConfig((prev) => {
      const next = { ...prev, ...cfg };
      if (cfg.name !== undefined) next.tradeName = cfg.name;
      return next;
    });
    addToast('success', 'Configurações salvas com sucesso!');
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast('info', 'Todas as notificações lidas.');
  };

  // Backup & System Reset
  const exportBackupJSON = () => {
    const data = {
      users,
      products,
      customers,
      suppliers,
      transactions,
      employees,
      employeePayments,
      proLaboreConfig,
      proLaborePayments,
      sales,
      stockMovements,
      bankAccounts,
      appointments,
      goals,
      ranking,
      companyConfig,
      notifications,
      exportedAt: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_nexus_erp_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    addToast('success', 'Backup exportado em arquivo JSON com sucesso!');
  };

  const importBackupJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.products && data.customers && data.transactions) {
        if (data.users) setUsers(data.users);
        if (data.products) setProducts(data.products);
        if (data.customers) setCustomers(data.customers);
        if (data.suppliers) setSuppliers(data.suppliers);
        if (data.transactions) setTransactions(data.transactions);
        if (data.employees) setEmployees(data.employees);
        if (data.employeePayments) setEmployeePayments(data.employeePayments);
        if (data.proLaboreConfig) setProLaboreConfig(data.proLaboreConfig);
        if (data.proLaborePayments) setProLaborePayments(data.proLaborePayments);
        if (data.sales) setSales(data.sales);
        if (data.stockMovements) setStockMovements(data.stockMovements);
        if (data.bankAccounts) setBankAccounts(data.bankAccounts);
        if (data.appointments) setAppointments(data.appointments);
        if (data.goals) setGoals(data.goals);
        if (data.ranking) setRanking(data.ranking);
        if (data.companyConfig) setCompanyConfig(data.companyConfig);
        addToast('success', 'Banco de dados restaurado com sucesso!');
        return true;
      }
      throw new Error('Formato de arquivo inválido.');
    } catch (err: any) {
      addToast('error', `Falha ao importar backup: ${err.message || 'Arquivo corrompido.'}`);
      return false;
    }
  };

  const resetToDemoData = () => {
    setUsers(initialUsers);
    setCurrentUser(null);
    setProducts(initialProducts);
    setCustomers(initialCustomers);
    setSuppliers(initialSuppliers);
    setTransactions(initialTransactions);
    setEmployees(initialEmployees);
    setEmployeePayments(initialEmployeePayments);
    setProLaboreConfig(initialProLaboreConfig);
    setProLaborePayments(initialProLaborePayments);
    setSales(initialSales);
    setStockMovements(initialStockMovements);
    setBankAccounts(initialBankAccounts);
    setAppointments(initialAppointments);
    setGoals(initialGoals);
    setRanking(initialRanking);
    setCompanyConfig(initialCompanyConfig);
    setNotifications(initialNotifications);
    addToast('info', 'Sistema restaurado para dados de demonstração originais!');
  };

  return (
    <ERPContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        login,
        logout,
        users,
        addUser,
        registerUser,
        updateUser,
        deleteUser,

        cloudEnabled: isSupabaseConfigured,
        cloudStatus,
        companyCode,
        refreshCloudData,
        migrateLocalDataToCloud,

        activeTab,
        setActiveTab,
        isCommandOpen,
        setIsCommandOpen,
        toasts,
        addToast,
        removeToast,
        selectedSaleForReceipt,
        setSelectedSaleForReceipt,

        dateFilter,
        setDateFilter,
        customDateRange,
        setCustomDateRange,
        filteredDateRange,

        products,
        addProduct,
        updateProduct,
        deleteProduct,

        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,

        suppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,

        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,

        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        employeePayments,
        payEmployeeSalary,

        proLaboreConfig,
        updateProLaboreConfig,
        proLaborePayments,
        registerProLaborePayment,
        markProLaborePaid,
        deleteProLaborePayment,
        computeProLaboreAmount,
        monthIncomeOf,
        monthProfitOf,

        sales,
        addSale,
        cancelSale,

        stockMovements,
        addStockMovement,

        bankAccounts,
        addBankAccount,
        updateBankAccount,

        appointments,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        toggleAppointmentStatus,

        goals,
        addGoal,
        updateGoal,
        deleteGoal,

        ranking,
        addRanking,
        updateRanking,
        deleteRanking,

        companyConfig,
        updateCompanyConfig,

        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,

        triggerCelebration,
        exportBackupJSON,
        importBackupJSON,
        resetToDemoData,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP deve ser utilizado dentro de um ERPProvider');
  }
  return context;
};
