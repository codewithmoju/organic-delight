import { forwardRef } from 'react';
import { format } from 'date-fns';
import { POSTransaction, POSSettings } from '../../lib/types';
import { formatCurrency } from '../../lib/utils/notifications';

interface ReceiptGeneratorProps {
  transaction: POSTransaction;
  settings: POSSettings;
  className?: string;
}

const ReceiptGenerator = forwardRef<HTMLDivElement, ReceiptGeneratorProps>(
  ({ transaction, settings, className = '' }, ref) => {
    return (
      <div 
        ref={ref} 
        className={`bg-white text-black p-6 max-w-sm mx-auto font-mono text-sm ${className}`}
        style={{ 
          width: '80mm', // Standard thermal receipt width
          fontSize: '12px',
          lineHeight: '1.2'
        }}
      >
        {/* Store Header */}
        <div className="text-center border-b border-gray-300 pb-4 mb-4">
          <h1 className="text-lg font-bold mb-1">{settings.store_name}</h1>
          <div className="text-xs space-y-1">
            <div>{settings.store_address}</div>
            <div>{settings.store_phone}</div>
          </div>
        </div>

        {/* Transaction Info */}
        <div className="border-b border-gray-300 pb-3 mb-3 space-y-1">
          <div className="flex justify-between">
            <span>Transaction #:</span>
            <span className="font-semibold">{transaction.transaction_number}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{format(transaction.created_at, 'MM/dd/yyyy HH:mm')}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span>{transaction.cashier_id}</span>
          </div>
          {transaction.customer_name && (
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{transaction.customer_name}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="border-b border-gray-300 pb-3 mb-3">
          {transaction.items.map((item, index) => (
            <div key={index} className="mb-2">
              <div className="flex justify-between">
                <span className="flex-1 truncate pr-2">{item.item_name}</span>
                <span>{formatCurrency(item.line_total)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>{item.quantity} x {formatCurrency(item.unit_price)}</span>
                {item.barcode && <span>#{item.barcode}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-1 mb-4">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(transaction.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>{formatCurrency(transaction.tax_amount)}</span>
          </div>
          {transaction.discount_amount > 0 && (
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>-{formatCurrency(transaction.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2">
            <span>TOTAL:</span>
            <span>{formatCurrency(transaction.total_amount)}</span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="border-b border-gray-300 pb-3 mb-3 space-y-1">
          <div className="flex justify-between">
            <span>Payment Method:</span>
            <span className="capitalize">{transaction.payment_method}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount Paid:</span>
            <span>{formatCurrency(transaction.payment_amount)}</span>
          </div>
          {transaction.change_amount > 0 && (
            <div className="flex justify-between font-semibold">
              <span>Change:</span>
              <span>{formatCurrency(transaction.change_amount)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs space-y-2">
          <div>{settings.receipt_footer_message}</div>
          <div className="text-gray-500">
            Powered by StockSuite POS
          </div>
          {transaction.customer_phone && (
            <div className="text-gray-500">
              SMS receipt sent to {transaction.customer_phone}
            </div>
          )}
        </div>

        {/* QR Code for Digital Receipt (placeholder) */}
        <div className="text-center mt-4">
          <div className="inline-block p-2 border border-gray-300">
            <div className="w-16 h-16 bg-gray-200 flex items-center justify-center text-xs">
              QR Code
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Scan for digital receipt
          </div>
        </div>
      </div>
    );
  }
);

ReceiptGenerator.displayName = 'ReceiptGenerator';

export default ReceiptGenerator;