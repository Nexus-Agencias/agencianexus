import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Supplier } from '../../types';
import { Truck, Plus, Search, Edit, Trash2, X, Phone, Mail, FileText } from 'lucide-react';
import { formatCPFCNPJ, formatPhone } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';

export const SuppliersView: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useERP();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [document, setDocument] = useState('');
  const [suppliedProducts, setSuppliedProducts] = useState('');
  const [notes, setNotes] = useState('');

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.companyName.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (s?: Supplier) => {
    if (s) {
      setEditingSupplier(s);
      setName(s.name);
      setCompanyName(s.companyName);
      setPhone(s.phone);
      setEmail(s.email);
      setDocument(s.document || '');
      setSuppliedProducts(s.suppliedProducts || '');
      setNotes(s.notes || '');
    } else {
      setEditingSupplier(null);
      setName('');
      setCompanyName('');
      setPhone('');
      setEmail('');
      setDocument('');
      setSuppliedProducts('');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !companyName) return;

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, {
        name,
        companyName,
        phone,
        email,
        document,
        suppliedProducts,
        notes,
      });
    } else {
      addSupplier({
        name,
        companyName,
        phone,
        email,
        document,
        suppliedProducts,
        notes,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Gestão de Fornecedores</h1>
          <p className="text-xs text-gray-400 mt-1">
            Cadastro de parceiros comerciais, distribuidores e prazos de faturamento.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Fornecedor</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por fornecedor ou razão social..."
            className="w-full pl-10 pr-4 py-2 bg-[#0D1117] border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="bg-[#161B22] border border-gray-800 hover:border-purple-500/40 rounded-3xl p-5 shadow-xl transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-gray-500 font-mono">{formatCPFCNPJ(s.document || '')}</span>
              </div>

              <h3 className="text-sm font-bold text-white">{s.name}</h3>
              <p className="text-xs text-gray-400 font-medium mt-0.5">{s.companyName}</p>

              <div className="space-y-1.5 my-4 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-purple-400" />
                  <span>{formatPhone(s.phone)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-purple-400" />
                  <span className="truncate">{s.email}</span>
                </div>
              </div>

              {s.suppliedProducts && (
                <div className="p-2.5 bg-[#0D1117] rounded-xl border border-gray-800 text-[11px] text-gray-300">
                  <span className="text-gray-500 font-bold block mb-0.5 uppercase tracking-wider text-[9px]">
                    Linha de Fornecimento:
                  </span>
                  {s.suppliedProducts}
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-gray-800 flex items-center justify-between text-xs">
              <span className="text-[10px] text-gray-500">{s.notes || 'Sem observações.'}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenModal(s)}
                  className="p-1.5 text-gray-400 hover:text-white bg-gray-800/60 rounded-lg"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteId(s.id)}
                  className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-500/10 rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
              <h3 className="text-base font-bold text-white">
                {editingSupplier ? 'Editar Fornecedor' : 'Cadastrar Novo Fornecedor'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Nome Fantasia / Fornecedor</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: TechDistribuidora SP"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Razão Social</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Tech Distribuição de Equipamentos Ltda"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">CNPJ / Documento</label>
                  <input
                    type="text"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 3344-5566"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">E-mail Comercial</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vendas@fornecedor.com.br"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Produtos Fornecidos</label>
                <input
                  type="text"
                  value={suppliedProducts}
                  onChange={(e) => setSuppliedProducts(e.target.value)}
                  placeholder="Monitores, Periféricos e Cabos"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Condições & Observações</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Prazo faturado, contrato de garantia..."
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs resize-none"
                />
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
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30"
                >
                  Salvar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Excluir Fornecedor"
        message="Tem certeza que deseja remover este fornecedor?"
        onConfirm={() => {
          if (deleteId) deleteSupplier(deleteId);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
