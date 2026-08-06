import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Layers, ArrowUpRight, ArrowDownRight, AlertTriangle, Plus, Search } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const StockView: React.FC = () => {
  const { products, stockMovements, addStockMovement, currentUser } = useERP();

  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [movementType, setMovementType] = useState<'Entrada' | 'Saída' | 'Ajuste'>('Entrada');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('Reposição de Estoque');

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const lowStockProducts = products.filter((p) => p.stockQuantity <= p.minStockQuantity);

  const handleAddMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity);
    if (!selectedProduct || isNaN(qty) || qty <= 0) return;

    const previousStock = selectedProduct.stockQuantity;
    let newStock = previousStock;

    if (movementType === 'Entrada') newStock += qty;
    else if (movementType === 'Saída') newStock = Math.max(0, previousStock - qty);
    else if (movementType === 'Ajuste') newStock = qty;

    addStockMovement({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      type: movementType,
      quantity: qty,
      previousStock,
      newStock,
      reason,
      userName: currentUser?.name || 'Sistema',
    });

    setQuantity('1');
    setReason('Reposição de Estoque');
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Controle de Estoque</h1>
        <p className="text-xs text-gray-400 mt-1">
          Movimentação física de mercadorias, alertas de baixo estoque e rastreabilidade.
        </p>
      </div>

      {/* Urgent Alert Banner */}
      {lowStockProducts.length > 0 && (
        <div className="p-5 bg-rose-950/20 border border-rose-500/30 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Atenção: {lowStockProducts.length} Produtos com Estoque Crítico</h3>
              <p className="text-xs text-rose-300 mt-0.5">
                Os seguintes itens precisam de reposição urgente fornecedores homologados.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {lowStockProducts.slice(0, 3).map((p) => (
              <span key={p.id} className="text-[11px] font-bold text-rose-300 bg-rose-500/20 px-2.5 py-1 rounded-lg border border-rose-500/30">
                {p.name}: {p.stockQuantity} un
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Add Movement Form + History Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form (4 cols) */}
        <div className="lg:col-span-4 bg-[#161B22] border border-gray-800 rounded-3xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
            <Layers className="w-4 h-4 text-purple-400" />
            Registrar Movimentação
          </h3>

          <form onSubmit={handleAddMovement} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Selecionar Produto</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs font-medium"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Atual: {p.stockQuantity} un)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Tipo de Operação</label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs font-bold"
                >
                  <option value="Entrada">Entrada (+)</option>
                  <option value="Saída">Saída (-)</option>
                  <option value="Ajuste">Ajuste Direto</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Motivo / Justificativa</label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Compra NF-1290, Avaria, Devolução"
                className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
            >
              Confirmar Movimentação
            </button>
          </form>
        </div>

        {/* Right Table: Movements Log (8 cols) */}
        <div className="lg:col-span-8 bg-[#161B22] border border-gray-800 rounded-3xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-gray-800 pb-3">
            Histórico de Movimentações
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1117] text-gray-400 font-semibold border-b border-gray-800">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Produto</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3 text-center">Qtd</th>
                  <th className="p-3 text-center">Anterior → Novo</th>
                  <th className="p-3">Motivo / Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {stockMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-800/30">
                    <td className="p-3 text-gray-400">{formatDate(m.date)}</td>
                    <td className="p-3 font-semibold text-white">{m.productName}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          m.type === 'Entrada'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : m.type === 'Saída'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-white">{m.quantity}</td>
                    <td className="p-3 text-center text-gray-400 font-mono">
                      {m.previousStock} → <span className="text-purple-300 font-bold">{m.newStock}</span>
                    </td>
                    <td className="p-3 text-gray-300">
                      <div>{m.reason}</div>
                      <span className="text-[10px] text-gray-500">{m.userName}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
