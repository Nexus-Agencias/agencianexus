import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Employee, EmployeeStatus } from '../../types';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  CheckCircle2,
  CreditCard,
  Briefcase,
  CalendarClock,
} from 'lucide-react';
import { formatBRL, formatDate, formatNumber } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';

const EMPTY_FORM = {
  name: '',
  role: '',
  phone: '',
  email: '',
  hireDate: new Date().toISOString().split('T')[0],
  salary: '',
  benefits: '',
  commission: '0',
  status: 'Ativo' as EmployeeStatus,
  notes: '',
};

export const EmployeesView: React.FC = () => {
  const {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    employeePayments,
    payEmployeeSalary,
  } = useERP();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const filtered = employees.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const currentMonth = new Date().toISOString().slice(0, 7);
  const totalPayroll = employees
    .filter((e) => e.status === 'Ativo')
    .reduce((acc, e) => acc + e.salary, 0);

  const handleOpenModal = (emp?: Employee) => {
    if (emp) {
      setEditingId(emp.id);
      setForm({
        name: emp.name,
        role: emp.role,
        phone: emp.phone,
        email: emp.email,
        hireDate: emp.hireDate,
        salary: String(emp.salary),
        benefits: emp.benefits,
        commission: String(emp.commission),
        status: emp.status,
        notes: emp.notes || '',
      });
    } else {
      setEditingId(null);
      setForm(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      role: form.role,
      phone: form.phone,
      email: form.email,
      hireDate: form.hireDate,
      salary: parseFloat(form.salary) || 0,
      benefits: form.benefits,
      commission: parseFloat(form.commission) || 0,
      status: form.status,
      notes: form.notes,
    };
    if (editingId) {
      updateEmployee(editingId, payload);
    } else {
      addEmployee(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Colaboradores</h1>
          <p className="text-xs text-gray-400 mt-1">
            Gestão de colaboradores, salários, benefícios, comissões e folha de pagamento.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-[#161B22] border border-gray-800 rounded-2xl px-4 py-2.5 text-right">
            <div className="text-[10px] text-gray-400 font-semibold uppercase">Folha Mensal (Ativos)</div>
            <div className="text-sm font-extrabold text-rose-300">{formatBRL(totalPayroll)}</div>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Colaborador</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#161B22] border border-gray-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Total de Colaboradores</span>
            <div className="text-2xl font-extrabold text-white mt-1">{formatNumber(employees.length)}</div>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-[#161B22] border border-gray-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Ativos</span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">
              {formatNumber(employees.filter((e) => e.status === 'Ativo').length)}
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-[#161B22] border border-gray-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Salários Pagos no Mês</span>
            <div className="text-2xl font-extrabold text-rose-300 mt-1">
              {formatBRL(
                employeePayments
                  .filter((p) => p.month === currentMonth && p.status === 'Pago')
                  .reduce((acc, p) => acc + p.amount, 0)
              )}
            </div>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, cargo ou e-mail..."
            className="w-full pl-10 pr-4 py-2 bg-[#0D1117] border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white focus:outline-hidden"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-[#0D1117] border border-gray-800 text-gray-300 rounded-xl text-xs focus:outline-hidden"
        >
          <option value="all">Todos os Status</option>
          <option value="Ativo">Ativo</option>
          <option value="Inativo">Inativo</option>
          <option value="Afastado">Afastado</option>
        </select>
      </div>

      {/* Employees Table */}
      <div className="bg-[#161B22] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0D1117] text-gray-400 font-semibold border-b border-gray-800">
              <tr>
                <th className="p-4">Colaborador</th>
                <th className="p-4">Cargo</th>
                <th className="p-4">Admissão</th>
                <th className="p-4 text-right">Salário</th>
                <th className="p-4 text-right">Comissão</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Nenhum colaborador encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white">{emp.name}</div>
                      <div className="text-[10px] text-gray-400">{emp.email}</div>
                    </td>
                    <td className="p-4 text-gray-300">{emp.role}</td>
                    <td className="p-4 text-gray-400">{formatDate(emp.hireDate)}</td>
                    <td className="p-4 text-right font-extrabold text-rose-300">{formatBRL(emp.salary)}</td>
                    <td className="p-4 text-right text-purple-300">{emp.commission}%</td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          emp.status === 'Ativo'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : emp.status === 'Afastado'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedEmployee(emp)}
                        className="px-2 py-1 bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600 hover:text-white rounded-lg transition-colors text-[11px] font-medium"
                      >
                        Pagamentos
                      </button>
                      <button
                        onClick={() => handleOpenModal(emp)}
                        className="p-1.5 text-gray-400 hover:text-white bg-gray-800/60 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(emp.id)}
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

      {/* Payment History Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-purple-400" />
                  Histórico de Pagamentos
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">{selectedEmployee.name} • {selectedEmployee.role}</p>
              </div>
              <button onClick={() => setSelectedEmployee(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-[#0D1117] border border-gray-800 rounded-2xl p-4 mb-4">
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Salário</div>
                <div className="text-xl font-extrabold text-white">{formatBRL(selectedEmployee.salary)}</div>
              </div>
              <button
                onClick={() => {
                  payEmployeeSalary(selectedEmployee.id, currentMonth);
                  setSelectedEmployee((prev) => (prev ? { ...prev } : prev));
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pagar Salário do Mês</span>
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {employeePayments
                .filter((p) => p.employeeId === selectedEmployee.id)
                .slice(0, 12)
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 bg-[#0D1117] rounded-2xl border border-gray-800/80"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">
                        {p.month.replace('-', '/')} • {formatBRL(p.amount)}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {p.paidAt ? `Pago em ${formatDate(p.paidAt)}` : 'Pagamento pendente'}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        p.status === 'Pago'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
              {employeePayments.filter((p) => p.employeeId === selectedEmployee.id).length === 0 && (
                <div className="text-center text-xs text-gray-500 py-8 border border-dashed border-gray-800 rounded-2xl">
                  Nenhum pagamento registrado ainda.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-400" />
                {editingId ? 'Editar Colaborador' : 'Novo Colaborador'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Maria Silva"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Cargo</label>
                  <input
                    type="text"
                    required
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    placeholder="Ex: Analista de Tráfego"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Data de Admissão</label>
                  <input
                    type="date"
                    required
                    value={form.hireDate}
                    onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@empresa.com"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Salário (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Comissão sobre Vendas (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={form.commission}
                    onChange={(e) => setForm({ ...form, commission: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Benefícios</label>
                  <input
                    type="text"
                    value={form.benefits}
                    onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                    placeholder="Ex: Plano de saúde, VA/VR R$ 600"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as EmployeeStatus })}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                    <option value="Afastado">Afastado</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Observações</label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30"
                >
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        title="Excluir Colaborador"
        message="Tem certeza que deseja remover este colaborador e seu histórico de pagamentos?"
        onConfirm={() => {
          if (deleteId) deleteEmployee(deleteId);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
