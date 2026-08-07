import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { PaymentMethod, SaleItem, RevenueCategory } from '../../types';
import { REVENUE_CATEGORIES } from '../../utils/revenueCategories';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  User,
  Search,
  CheckCircle2,
  FileText,
  DollarSign,
  Printer,
  Sparkles,
  X,
  CreditCard,
  Ban,
} from 'lucide-react';
import { formatBRL, formatDate } from '../../utils/formatters';
import { ReceiptModal } from './ReceiptModal';

export const SalesView: React.FC = () => {
  const {
    products,
    customers,
    sales,
    addSale,
    cancelSale,
    selectedSaleForReceipt,
    setSelectedSaleForReceipt,
    currentUser,
    filteredDateRange,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'pdv' | 'history'>('pdv');

  // PDV Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [shipping, setShipping] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [saleCategory, setSaleCategory] = useState<RevenueCategory>('Compra e Venda');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [notes, setNotes] = useState('');

  const nowLocal = new Date();
  const todayStr = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, '0')}-${String(
    nowLocal.getDate()
  ).padStart(2, '0')}`;
  const [saleDate, setSaleDate] = useState<string>(todayStr);

  // History Filter State
  const [historySearch, setHistorySearch] = useState('');

  // Selected customer details
  const currentCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  // Cart calculations
  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const total = Math.max(0, subtotal - discount + shipping);

  const numReceived = parseFloat(amountReceived) || total;
  const change = Math.max(0, numReceived - total);

  // Product Search Results
  const filteredProducts = productSearch
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.code.toLowerCase().includes(productSearch.toLowerCase())
      )
    : products;

  const handleAddToCart = (product: typeof products[0]) => {
    if (product.stockQuantity <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) return prev;
        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.salePrice,
          subtotal: product.salePrice,
        },
      ];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            const prod = products.find((p) => p.id === productId);
            if (prod && newQty > prod.stockQuantity) return item;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as SaleItem[]
    );
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const newSale = addSale({
      customerId: currentCustomer.id,
      customerName: currentCustomer.name,
      items: cart,
      subtotal,
      discount,
      shipping,
      total,
      paymentMethod,
      amountReceived: numReceived,
      change,
      status: 'Concluída',
      sellerId: currentUser?.id,
      sellerName: currentUser?.name,
      category: saleCategory,
      notes,
    }, saleDate);

    // Reset PDV
    setCart([]);
    setDiscount(0);
    setShipping(0);
    setAmountReceived('');
    setNotes('');
    setSaleDate(todayStr);

    // Open Receipt
    setSelectedSaleForReceipt(newSale);
  };

  // Filter Sales History
  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.code.toLowerCase().includes(historySearch.toLowerCase()) ||
      s.customerName.toLowerCase().includes(historySearch.toLowerCase());
    const sDate = s.createdAt.split('T')[0];
    const matchesDate = sDate >= filteredDateRange.startDate && sDate <= filteredDateRange.endDate;
    return matchesSearch && matchesDate;
  });

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Vendas & Ponto de Venda (PDV)</h1>
          <p className="text-xs text-gray-400 mt-1">
            Realize vendas rápidas, emita comprovantes e gerencie o histórico comercial.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap items-center gap-1 bg-[#161B22] p-1 rounded-2xl border border-gray-800">
          <button
            onClick={() => setActiveTab('pdv')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'pdv'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Fazer Nova Venda</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Histórico de Vendas ({sales.length})</span>
          </button>
        </div>
      </div>

      {/* PDV VIEW */}
      {activeTab === 'pdv' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Product Selection Catalog (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-[#161B22] border border-gray-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-purple-400" />
                  Catálogo de Produtos
                </h3>
                <span className="text-xs text-gray-400">{filteredProducts.length} itens disponíveis</span>
              </div>

              {/* Product Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Buscar por nome ou código do produto..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0D1117] border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white focus:outline-hidden"
                />
              </div>

              {/* Product Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredProducts.map((p) => {
                  const isOut = p.stockQuantity <= 0;
                  return (
                    <div
                      key={p.id}
                      onClick={() => !isOut && handleAddToCart(p)}
                      className={`p-3.5 bg-[#0D1117] border rounded-2xl transition-all cursor-pointer flex flex-col justify-between ${
                        isOut
                          ? 'border-gray-800 opacity-50 cursor-not-allowed'
                          : 'border-gray-800 hover:border-purple-500/50 hover:bg-gray-800/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-purple-900/30 text-purple-400 font-bold flex items-center justify-center text-sm shrink-0">
                            {p.name.charAt(0)}
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-semibold text-white truncate">{p.name}</h4>
                          <span className="text-[10px] text-gray-400">SKU: {p.code}</span>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                isOut
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : p.stockQuantity <= p.minStockQuantity
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-emerald-500/20 text-emerald-400'
                              }`}
                            >
                              {isOut ? 'Sem Estoque' : `${p.stockQuantity} em estoque`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-800/80">
                        <span className="text-sm font-extrabold text-emerald-400">{formatBRL(p.salePrice)}</span>
                        <button
                          disabled={isOut}
                          className="px-2.5 py-1 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-bold hover:bg-purple-600 hover:text-white transition-colors"
                        >
                          + Adicionar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Cart & Order Details (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <form onSubmit={handleCheckout} className="bg-[#161B22] border border-gray-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-purple-400" />
                  Resumo da Venda
                </h3>
                <span className="text-xs text-purple-400 font-bold">{cart.length} itens</span>
              </div>

              {/* Select Customer */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Selecionar Cliente</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs font-medium focus:outline-hidden"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.document})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Sale Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Data da Venda</label>
                <input
                  type="date"
                  required
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs font-medium focus:outline-hidden focus:border-purple-500 [color-scheme:dark]"
                />
              </div>

              {/* Select Revenue Category (Obrigatório) */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Centro de Receita (Categoria) <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={saleCategory}
                  onChange={(e) => setSaleCategory(e.target.value as RevenueCategory)}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs font-medium focus:outline-hidden"
                >
                  {REVENUE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cart Items List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-500 border border-dashed border-gray-800 rounded-2xl">
                    Seu carrinho está vazio. Selecione produtos no catálogo ao lado.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between p-2.5 bg-[#0D1117] rounded-2xl border border-gray-800/80"
                    >
                      <div className="overflow-hidden max-w-[160px]">
                        <h5 className="text-xs font-semibold text-white truncate">{item.productName}</h5>
                        <span className="text-[10px] text-gray-400">{formatBRL(item.unitPrice)}/un</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.productId, -1)}
                            className="p-1 hover:text-white text-gray-400"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-white px-1.5">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.productId, 1)}
                            className="p-1 hover:text-white text-gray-400"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-xs font-bold text-white min-w-[60px] text-right">
                          {formatBRL(item.subtotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.productId, -item.quantity)}
                          className="p-1 text-rose-400 hover:text-rose-300"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Discount & Shipping inputs */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-800">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Desconto (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={discount || ''}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Frete (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={shipping || ''}
                    onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              {/* Payment Method & Change calculator */}
              <div className="space-y-3 bg-[#0D1117] p-3 rounded-2xl border border-gray-800">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Forma de Pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-[#161B22] border border-gray-800 text-white rounded-xl text-xs font-semibold"
                  >
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Boleto">Boleto Faturado</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>

                {paymentMethod === 'Dinheiro' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">Valor Recebido (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        placeholder={String(total)}
                        className="w-full px-3 py-1.5 bg-[#161B22] border border-gray-800 text-white rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">Troco a Entregar</label>
                      <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 font-extrabold text-xs rounded-xl">
                        {formatBRL(change)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Total Summary */}
              <div className="p-4 bg-gradient-to-r from-purple-950/40 to-indigo-950/40 rounded-2xl border border-purple-500/30 space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Subtotal:</span>
                  <span>{formatBRL(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs text-rose-400">
                    <span>Desconto:</span>
                    <span>- {formatBRL(discount)}</span>
                  </div>
                )}
                {shipping > 0 && (
                  <div className="flex justify-between text-xs text-gray-300">
                    <span>Frete:</span>
                    <span>+ {formatBRL(shipping)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-purple-500/20">
                  <span>TOTAL FINAL:</span>
                  <span className="text-emerald-400 text-lg">{formatBRL(total)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={cart.length === 0}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold rounded-2xl shadow-xl shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finalizar Venda & Emitir Recibo</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* HISTORY VIEW */
        <div className="space-y-4">
          <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Buscar por código de venda ou nome de cliente..."
                className="w-full pl-10 pr-4 py-2 bg-[#0D1117] border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="bg-[#161B22] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0D1117] text-gray-400 font-semibold border-b border-gray-800">
                  <tr>
                    <th className="p-4">Código</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Categoria</th>
                    <th className="p-4">Data / Hora</th>
                    <th className="p-4">Pagamento</th>
                    <th className="p-4 text-right">Valor Total</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-4 font-bold text-white">{sale.code}</td>
                      <td className="p-4 font-medium text-gray-200">{sale.customerName}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-300">
                          {sale.category}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400">{formatDate(sale.createdAt)}</td>
                      <td className="p-4 font-semibold text-purple-300">{sale.paymentMethod}</td>
                      <td className="p-4 text-right font-extrabold text-emerald-400">{formatBRL(sale.total)}</td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                            sale.status === 'Concluída'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {sale.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedSaleForReceipt(sale)}
                          className="px-2.5 py-1 bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600 hover:text-white rounded-lg transition-colors font-medium text-[11px]"
                        >
                          Ver Recibo
                        </button>
                        {sale.status === 'Concluída' && (
                          <button
                            onClick={() => cancelSale(sale.id)}
                            className="p-1 text-rose-400 hover:text-rose-300 bg-rose-500/10 rounded-lg transition-colors"
                            title="Cancelar Venda"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Printable Modal */}
      <ReceiptModal sale={selectedSaleForReceipt} onClose={() => setSelectedSaleForReceipt(null)} />
    </div>
  );
};
