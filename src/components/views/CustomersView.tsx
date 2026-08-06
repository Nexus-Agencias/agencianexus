import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Customer } from '../../types';
import {
  Users,
  Plus,
  Search,
  MessageCircle,
  Mail,
  MapPin,
  FileText,
  Edit,
  Trash2,
  X,
  ExternalLink,
  ShoppingBag,
} from 'lucide-react';
import { formatBRL, formatCPFCNPJ, formatDate, formatPhone } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';

export const CustomersView: React.FC = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, sales } = useERP();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedHistoryCust, setSelectedHistoryCust] = useState<Customer | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [document, setDocument] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [notes, setNotes] = useState('');

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.document.includes(search)
  );

  const handleOpenModal = (c?: Customer) => {
    if (c) {
      setEditingCustomer(c);
      setName(c.name);
      setPhone(c.phone);
      setWhatsapp(c.whatsapp);
      setEmail(c.email);
      setDocument(c.document);
      setAddress(c.address);
      setCity(c.city);
      setState(c.state);
      setZipCode(c.zipCode);
      setNotes(c.notes || '');
    } else {
      setEditingCustomer(null);
      setName('');
      setPhone('');
      setWhatsapp('');
      setEmail('');
      setDocument('');
      setAddress('');
      setCity('');
      setState('');
      setZipCode('');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const cleanWhatsapp = whatsapp.replace(/\D/g, '');

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name,
        phone,
        whatsapp: cleanWhatsapp,
        email,
        document,
        address,
        city,
        state,
        zipCode,
        notes,
      });
    } else {
      addCustomer({
        name,
        phone,
        whatsapp: cleanWhatsapp,
        email,
        document,
        address,
        city,
        state,
        zipCode,
        notes,
      });
    }
    setIsModalOpen(false);
  };

  const customerSales = selectedHistoryCust
    ? sales.filter((s) => s.customerId === selectedHistoryCust.id)
    : [];

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Gestão de Clientes (CRM)</h1>
          <p className="text-xs text-gray-400 mt-1">
            Base de contatos, histórico de compras, ticket acumulado e envio direto via WhatsApp.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Cliente</span>
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
            placeholder="Buscar cliente por nome, e-mail ou CPF/CNPJ..."
            className="w-full pl-10 pr-4 py-2 bg-[#0D1117] border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-[#161B22] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0D1117] text-gray-400 font-semibold border-b border-gray-800">
              <tr>
                <th className="p-4">Cliente / Razão Social</th>
                <th className="p-4">Contatos</th>
                <th className="p-4">Cidade / UF</th>
                <th className="p-4">CPF / CNPJ</th>
                <th className="p-4 text-right">Total Comprado</th>
                <th className="p-4">Última Compra</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="p-4 font-bold text-white">
                    {c.name}
                    {c.notes && <p className="text-[10px] text-gray-400 font-normal truncate max-w-xs">{c.notes}</p>}
                  </td>
                  <td className="p-4 space-y-1">
                    <div className="text-gray-300 font-medium">{c.email}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{formatPhone(c.phone)}</span>
                      {c.whatsapp && (
                        <a
                          href={`https://wa.me/${c.whatsapp}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md hover:bg-emerald-500/20"
                        >
                          <MessageCircle className="w-3 h-3" /> WhatsApp
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-gray-300 font-medium">
                    {c.city} - {c.state}
                  </td>
                  <td className="p-4 text-gray-400">{formatCPFCNPJ(c.document)}</td>
                  <td className="p-4 text-right font-extrabold text-emerald-400">
                    {formatBRL(c.totalSpent || 0)}
                  </td>
                  <td className="p-4 text-gray-400">{c.lastPurchaseDate ? formatDate(c.lastPurchaseDate) : 'Sem compras'}</td>
                  <td className="p-4 text-right space-x-1.5">
                    <button
                      onClick={() => setSelectedHistoryCust(c)}
                      className="px-2.5 py-1 bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600 hover:text-white rounded-lg transition-colors font-medium text-[11px]"
                    >
                      Histórico
                    </button>
                    <button
                      onClick={() => handleOpenModal(c)}
                      className="p-1.5 text-gray-400 hover:text-white bg-gray-800/60 rounded-lg"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(c.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-500/10 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
              <h3 className="text-base font-bold text-white">
                {editingCustomer ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Nome Completo / Razão Social</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Ana Beatriz / Inovação Digital Ltda"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">CPF / CNPJ</label>
                  <input
                    type="text"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 98888-7777"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">WhatsApp (apenas números)</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="5511988887777"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Endereço Completo</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, Número, Bairro"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="São Paulo"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="SP"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs uppercase"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-gray-300 mb-1">CEP</label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="01000-000"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Observações Internas</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Preferências, descontos acertados..."
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs resize-none"
                />
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
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Purchase History Modal */}
      {selectedHistoryCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Histórico de Compras</h3>
                <p className="text-xs text-purple-400">{selectedHistoryCust.name}</p>
              </div>
              <button onClick={() => setSelectedHistoryCust(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {customerSales.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-500">Nenhuma compra registrada para este cliente.</div>
              ) : (
                customerSales.map((s) => (
                  <div key={s.id} className="p-3 bg-[#0D1117] border border-gray-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">{s.code}</div>
                      <div className="text-[10px] text-gray-400">{formatDate(s.createdAt)} • {s.items.length} itens</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-emerald-400 block">{formatBRL(s.total)}</span>
                      <span className="text-[10px] text-purple-300">{s.paymentMethod}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Excluir Cliente"
        message="Deseja mesmo remover este cliente do sistema?"
        onConfirm={() => {
          if (deleteId) deleteCustomer(deleteId);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
