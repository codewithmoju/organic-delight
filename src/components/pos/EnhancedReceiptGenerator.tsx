import { forwardRef } from 'react';
import { format } from 'date-fns';
import { POSTransaction, POSSettings } from '../../lib/types';
import { formatCurrency } from '../../lib/utils/notifications';

interface EnhancedReceiptGeneratorProps {
  transaction: POSTransaction;
  settings: POSSettings;
  className?: string;
  variant?: 'thermal' | 'standard' | 'email';
}

const EnhancedReceiptGenerator = forwardRef<HTMLDivElement, EnhancedReceiptGeneratorProps>(
  ({ transaction, settings, className = '', variant = 'standard' }, ref) => {
    const getThermalStyles = () => ({
      width: '80mm',
      fontSize: '12px',
      lineHeight: '1.2',
      fontFamily: 'monospace'
    });

    const getStandardStyles = () => ({
      width: '210mm',
      fontSize: '14px',
      lineHeight: '1.4',
      fontFamily: 'Arial, sans-serif'
    });

    const styles = variant === 'thermal' ? getThermalStyles() : getStandardStyles();

    return (
      <div 
        ref={ref} 
        className={`bg-white text-black p-6 mx-auto ${className}`}
        style={styles}
      >
        {/* Store Header */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
          <h1 className="text-2xl font-bold mb-2">{settings.store_name}</h1>
          <div className="space-y-1">
            <div className="font-medium">{settings.store_address}</div>
            <div className="font-medium">{settings.store_phone}</div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Professional Inventory Management System
          </div>
        </div>

        {/* Transaction Header */}
        <div className="border-b border-gray-400 pb-3 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Transaction #:</strong> {transaction.transaction_number}
            </div>
            <div>
              <strong>Date:</strong> {format(transaction.created_at, 'MM/dd/yyyy')}
            </div>
            <div>
              <strong>Time:</strong> {format(transaction.created_at, 'HH:mm:ss')}
            </div>
            <div>
              <strong>Cashier:</strong> {transaction.cashier_id}
            </div>
          </div>
          {transaction.customer_name && (
            <div className="mt-2">
              <strong>Customer:</strong> {transaction.customer_name}
              {transaction.customer_phone && ` (${transaction.customer_phone})`}
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="mb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-800">
                <th className="text-left py-2 font-bold">Item</th>
                <th className="text-center py-2 font-bold">Qty</th>
                <th className="text-right py-2 font-bold">Price</th>
                <th className="text-right py-2 font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {transaction.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-300">
                  <td className="py-2">
                    <div className="font-medium">{item.item_name}</div>
                    {item.barcode && (
                      <div className="text-xs text-gray-600">#{item.barcode}</div>
                    )}
                  </td>
                  <td className="text-center py-2">{item.quantity}</td>
                  <td className="text-right py-2">{formatCurrency(item.unit_price)}</td>
                  <td className="text-right py-2 font-medium">{formatCurrency(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="border-t-2 border-gray-800 pt-3 mb-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">{formatCurrency(transaction.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({((settings.tax_rate || 0) * 100).toFixed(1)}%):</span>
              <span className="font-medium">{formatCurrency(transaction.tax_amount)}</span>
            </div>
            {transaction.discount_amount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span className="font-medium">-{formatCurrency(transaction.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold border-t border-gray-400 pt-2">
              <span>TOTAL:</span>
              <span>{formatCurrency(transaction.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="border-b border-gray-400 pb-3 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Payment Method:</strong>
              <div className="capitalize">{transaction.payment_method}</div>
            </div>
            <div>
              <strong>Amount Paid:</strong>
              <div>{formatCurrency(transaction.payment_amount)}</div>
            </div>
          </div>
          {transaction.change_amount > 0 && (
            <div className="mt-2 text-lg font-bold">
              <strong>Change Due: {formatCurrency(transaction.change_amount)}</strong>
            </div>
          )}
        </div>

        {/* Transaction Summary */}
        <div className="bg-gray-100 p-3 rounded mb-4">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-bold text-lg">{transaction.items.reduce((sum, item) => sum + item.quantity, 0)}</div>
              <div className="text-gray-600">Total Items</div>
            </div>
            <div>
              <div className="font-bold text-lg">{transaction.items.length}</div>
              <div className="text-gray-600">Line Items</div>
            </div>
            <div>
              <div className="font-bold text-lg">
                {formatCurrency(transaction.subtotal / transaction.items.reduce((sum, item) => sum + item.quantity, 0))}
              </div>
              <div className="text-gray-600">Avg. Price</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-3">
          <div className="text-lg font-medium">{settings.receipt_footer_message}</div>
          
          <div className="border-t border-gray-400 pt-3">
            <div className="text-sm text-gray-600 space-y-1">
              <div>Thank you for your business!</div>
              <div>Visit us again soon</div>
              <div className="font-medium">Powered by StockSuite POS</div>
            </div>
          </div>

          {/* Return Policy */}
          <div className="text-xs text-gray-500 border-t border-gray-300 pt-2">
            <div>Returns accepted within 30 days with receipt</div>
            <div>Store credit issued for returns without receipt</div>
          </div>

          {/* QR Code Placeholder */}
          <div className="flex justify-center mt-4">
            <div className="border-2 border-gray-400 p-2">
              <div className="w-16 h-16 bg-gray-200 flex items-center justify-center text-xs font-bold">
                QR CODE
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Scan for digital receipt and loyalty points
          </div>
        </div>

        {/* Print Instructions */}
        <div className="mt-6 text-xs text-gray-400 text-center border-t border-gray-300 pt-2">
          <div>Receipt #{transaction.transaction_number}</div>
          <div>Printed on {format(new Date(), 'MM/dd/yyyy HH:mm:ss')}</div>
        </div>
      </div>
    );
  }
);

EnhancedReceiptGenerator.displayName = 'EnhancedReceiptGenerator';

export default EnhancedReceiptGenerator;