import React from 'react';
import { useERP } from '../../context/ERPContext';
import { Sale } from '../../types';
import { Printer, X, CheckCircle, FileText } from 'lucide-react';
import { formatBRL, formatDateTime, triggerPrint } from '../../utils/formatters';

interface ReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const { companyConfig } = useERP();

  if (!sale) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-[#161B22] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-[#0D1117] border-b border-gray-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Comprovante de Venda {sale.code}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={triggerPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-xl transition-all shadow-md shadow-purple-900/20"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-6 overflow-y-auto print-area space-y-6 text-gray-200">
          {/* Header Business Info */}
          <div className="text-center pb-4 border-b border-gray-800">
            <h2 className="text-lg font-bold text-white tracking-wide">{companyConfig.name}</h2>
            <p className="text-xs text-gray-400 mt-1">CNPJ: {companyConfig.cnpj}</p>
            <p className="text-xs text-gray-400">
              {companyConfig.address} - {companyConfig.city}/{companyConfig.state}
            </p>
            <p className="text-xs text-gray-400">Tel: {companyConfig.phone} • {companyConfig.email}</p>
          </div>

          {/* Sale Metadata */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-[#0D1117] p-4 rounded-xl border border-gray-800/80">
            <div>
              <span className="text-gray-400 block font-medium">Código da Venda:</span>
              <span className="text-white font-bold text-sm">{sale.code}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Data & Hora:</span>
              <span className="text-white font-semibold">{formatDateTime(sale.createdAt)}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Cliente:</span>
              <span className="text-white font-semibold">{sale.customerName}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Forma de Pagamento:</span>
              <span className="text-emerald-400 font-bold">{sale.paymentMethod}</span>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Itens da Compra</h4>
            <div className="border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0D1117] text-gray-400 font-semibold border-b border-gray-800">
                  <tr>
                    <th className="p-3">Produto</th>
                    <th className="p-3 text-center">Qtd</th>
                    <th className="p-3 text-right">Preço Un.</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {sale.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-800/30">
                      <td className="p-3 font-medium text-white">{item.productName}</td>
                      <td className="p-3 text-center text-gray-300 font-semibold">{item.quantity}</td>
                      <td className="p-3 text-right text-gray-400">{formatBRL(item.unitPrice)}</td>
                      <td className="p-3 text-right font-bold text-white">{formatBRL(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="bg-[#0D1117] p-4 rounded-xl border border-gray-800 space-y-2 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal dos Produtos:</span>
              <span>{formatBRL(sale.subtotal)}</span>
            </div>

            {sale.discount > 0 && (
              <div className="flex justify-between text-rose-400 font-medium">
                <span>Desconto Aplicado:</span>
                <span>- {formatBRL(sale.discount)}</span>
              </div>
            )}

            {sale.shipping > 0 && (
              <div className="flex justify-between text-gray-400">
                <span>Frete:</span>
                <span>+ {formatBRL(sale.shipping)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-gray-800">
              <span>VALOR TOTAL PAGO:</span>
              <span className="text-emerald-400 text-base">{formatBRL(sale.total)}</span>
            </div>

            {sale.change > 0 && (
              <div className="flex justify-between text-amber-400 pt-1">
                <span>Troco Entregue:</span>
                <span>{formatBRL(sale.change)}</span>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="text-center pt-2 text-[11px] text-gray-500">
            <p>Obrigado pela preferência! Guarde este comprovante para eventuais trocas.</p>
            <p className="mt-0.5 text-purple-400/80 font-mono">Emitido via NEXUS AGÊNCIA System</p>
          </div>
        </div>
      </div>
    </div>
  );
};
