import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Product } from '../../types';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  Image as ImageIcon,
  DollarSign,
  Layers,
} from 'lucide-react';
import { formatBRL } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';

export const ProductsView: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, suppliers } = useERP();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Periféricos');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [minStockQuantity, setMinStockQuantity] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Auto Profit calculation
  const numCost = parseFloat(costPrice) || 0;
  const numSale = parseFloat(salePrice) || 0;
  const profit = Math.max(0, numSale - numCost);
  const margin = numSale > 0 ? (profit / numSale) * 100 : 0;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIMENSION = 600;
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setImageUrl(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleOpenModal = (p?: Product) => {
    if (p) {
      setEditingProduct(p);
      setCode(p.code);
      setName(p.name);
      setCategory(p.category);
      setCostPrice(String(p.costPrice));
      setSalePrice(String(p.salePrice));
      setStockQuantity(String(p.stockQuantity));
      setMinStockQuantity(String(p.minStockQuantity));
      setSupplierId(p.supplierId || '');
      setDescription(p.description || '');
      setImageUrl(p.imageUrl || '');
    } else {
      setEditingProduct(null);
      setCode(`PROD-00${products.length + 1}`);
      setName('');
      setCategory('Periféricos');
      setCostPrice('');
      setSalePrice('');
      setStockQuantity('10');
      setMinStockQuantity('5');
      setSupplierId(suppliers[0]?.id || '');
      setDescription('');
      setImageUrl('');
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !salePrice) return;

    const supp = suppliers.find((s) => s.id === supplierId);

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        code,
        name,
        category,
        costPrice: numCost,
        salePrice: numSale,
        stockQuantity: parseInt(stockQuantity) || 0,
        minStockQuantity: parseInt(minStockQuantity) || 0,
        supplierId,
        supplierName: supp?.name || '',
        description,
        imageUrl,
      });
    } else {
      addProduct({
        code,
        name,
        category,
        costPrice: numCost,
        salePrice: numSale,
        stockQuantity: parseInt(stockQuantity) || 0,
        minStockQuantity: parseInt(minStockQuantity) || 0,
        supplierId,
        supplierName: supp?.name || '',
        description,
        imageUrl,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Catálogo de Produtos</h1>
          <p className="text-xs text-gray-400 mt-1">
            Controle de preços de custo, preços de venda, cálculo automático de margem e fotos.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Produto</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou código SKU..."
            className="w-full pl-10 pr-4 py-2 bg-[#0D1117] border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white focus:outline-hidden"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-[#0D1117] border border-gray-800 text-gray-300 rounded-xl text-xs focus:outline-hidden"
        >
          <option value="all">Todas as Categorias</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const itemProfit = p.salePrice - p.costPrice;
          const itemMargin = p.salePrice > 0 ? (itemProfit / p.salePrice) * 100 : 0;
          const isLowStock = p.stockQuantity <= p.minStockQuantity;

          return (
            <div
              key={p.id}
              className="bg-[#161B22] border border-gray-800 hover:border-purple-500/40 rounded-3xl p-5 shadow-xl transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Image and Header */}
                <div className="flex items-start gap-3 mb-4">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-16 h-16 rounded-2xl object-cover shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-purple-900/30 text-purple-400 font-bold flex items-center justify-center text-xl shrink-0">
                      {p.name.charAt(0)}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {p.category}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1 truncate">{p.name}</h3>
                    <p className="text-[10px] text-gray-400">SKU: {p.code}</p>
                  </div>
                </div>

                {/* Stock Alert Badge */}
                <div className="flex items-center justify-between mb-4 p-2 bg-[#0D1117] rounded-xl border border-gray-800">
                  <span className="text-xs text-gray-400 font-medium">Estoque Atual:</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-extrabold ${
                      isLowStock ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {p.stockQuantity} un {isLowStock && '(Baixo!)'}
                  </span>
                </div>

                {/* Financial Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="bg-[#0D1117] p-2.5 rounded-xl border border-gray-800/80">
                    <span className="text-[10px] text-gray-500 block">Preço de Custo</span>
                    <span className="font-semibold text-gray-300">{formatBRL(p.costPrice)}</span>
                  </div>

                  <div className="bg-[#0D1117] p-2.5 rounded-xl border border-gray-800/80">
                    <span className="text-[10px] text-gray-500 block">Preço de Venda</span>
                    <span className="font-extrabold text-emerald-400">{formatBRL(p.salePrice)}</span>
                  </div>
                </div>
              </div>

              {/* Profit & Actions Footer */}
              <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 block">Líquido R$ / Margem %</span>
                  <span className="text-xs font-bold text-purple-300">
                    {formatBRL(itemProfit)} ({itemMargin.toFixed(1)}%)
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(p)}
                    className="p-2 text-gray-400 hover:text-white bg-gray-800/60 rounded-xl transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(p.id)}
                    className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
              <h3 className="text-base font-bold text-white">
                {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Código / SKU</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Categoria</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Nome do Produto</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Monitor UltraWide 34 Curvo"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Preço de Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Preço de Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              {/* Calculated Profit Preview */}
              <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-xl flex items-center justify-between text-xs">
                <span className="text-gray-300 font-medium">Líquido Estimado / Margem:</span>
                <span className="text-purple-300 font-extrabold">
                  {formatBRL(profit)} ({margin.toFixed(1)}%)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Estoque Inicial</label>
                  <input
                    type="number"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Estoque Mínimo (Alerta)</label>
                  <input
                    type="number"
                    required
                    value={minStockQuantity}
                    onChange={(e) => setMinStockQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Foto do Produto</label>
                {imageUrl ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={imageUrl}
                      alt="Prévia do produto"
                      className="w-20 h-20 rounded-xl object-cover border border-gray-800"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="px-3 py-1.5 text-xs text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                    >
                      Remover foto
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-700 hover:border-purple-500/50 rounded-xl p-5 cursor-pointer transition-colors bg-[#0D1117]">
                    <ImageIcon className="w-6 h-6 text-gray-500" />
                    <span className="text-xs text-gray-400">
                      Clique para selecionar uma foto do computador
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Descrição do Produto</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Excluir Produto"
        message="Deseja mesmo remover este produto do catálogo?"
        onConfirm={() => {
          if (deleteId) deleteProduct(deleteId);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
