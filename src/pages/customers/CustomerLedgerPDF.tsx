import { forwardRef } from 'react';
import { format } from 'date-fns';
import { Customer, POSSettings } from '../../lib/types';
import { formatCurrency } from '../../lib/utils/notifications';

interface CustomerLedgerPDFProps {
    customer: Customer;
    ledger: any[]; // Contains both payments and credit sales
    settings: POSSettings;
}

const CustomerLedgerPDF = forwardRef<HTMLDivElement, CustomerLedgerPDFProps>(
    ({ customer, ledger, settings }, ref) => {
        return (
            <div
                ref={ref}
                className="bg-white text-black p-8 mx-auto"
                style={{
                    width: '210mm',
                    minHeight: '297mm',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '12px'
                }}
            >
                {/* Company Header */}
                <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 text-primary-600">{settings.store_name}</h1>
                        <div className="text-sm space-y-1 text-gray-600">
                            <div>{settings.store_address}</div>
                            {settings.store_phone && <div>Tel: {settings.store_phone}</div>}
                            {settings.store_email && <div>Email: {settings.store_email}</div>}
                            {settings.tax_number && <div>GST/VAT: {settings.tax_number}</div>}
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-bold text-gray-400 uppercase tracking-widest">Customer Statement</h2>
                        <div className="mt-2 text-sm">
                            <strong>Date:</strong> {format(new Date(), 'dd MMM yyyy')}
                        </div>
                    </div>
                </div>

                {/* Customer Details */}
                <div className="bg-gray-50 p-4 rounded-lg mb-8 border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Customer Details</h3>
                    <div className="flex justify-between">
                        <div>
                            <div className="text-lg font-bold">{customer.name}</div>
                            {customer.email && <div className="text-gray-600">{customer.email}</div>}
                        </div>
                        <div className="text-right text-sm space-y-1 text-gray-600">
                            {customer.phone && <div>PH: {customer.phone}</div>}
                            {customer.address && <div className="max-w-[200px] ml-auto">{customer.address}</div>}
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="flex justify-between mb-8 gap-4">
                    <div className="flex-1 bg-gray-50 p-3 rounded border border-gray-200">
                        <div className="text-xs text-gray-500 uppercase font-bold">Total Purchases</div>
                        <div className="text-lg font-bold">{formatCurrency(customer.total_purchases)}</div>
                    </div>
                    <div className="flex-1 bg-gray-50 p-3 rounded border border-gray-200">
                        <div className="text-xs text-gray-500 uppercase font-bold">Outstanding Balance</div>
                        <div className="text-lg font-bold text-red-600">{formatCurrency(customer.outstanding_balance)}</div>
                    </div>
                </div>

                {/* Ledger Table */}
                <div className="mb-8">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b-2 border-gray-800">
                                <th className="text-left py-3 px-2 font-bold uppercase text-xs">Date</th>
                                <th className="text-left py-3 px-2 font-bold uppercase text-xs">Type</th>
                                <th className="text-left py-3 px-2 font-bold uppercase text-xs">Reference</th>
                                <th className="text-left py-3 px-2 font-bold uppercase text-xs w-1/3">Description</th>
                                <th className="text-right py-3 px-2 font-bold uppercase text-xs">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ledger.map((entry, index) => {
                                const isMoneyOut = entry._type !== 'payment'; // Credit Sale or Charge is money out (debt increases)
                                // In this context for a customer: 
                                // Credit Sale = They bought something -> Debt increases (Positive amount in ledger usually)
                                // Payment = They paid us -> Debt decreases (Negative effect on balance)

                                return (
                                    <tr key={entry.id} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                        <td className="py-2 px-2">{format(entry._date, 'dd/MM/yyyy')}</td>
                                        <td className="py-2 px-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${!isMoneyOut ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {entry._type === 'credit_sale' ? 'Credit Sale' : (entry.type || 'Payment')}
                                            </span>
                                        </td>
                                        <td className="py-2 px-2 text-gray-600 font-mono text-xs">
                                            {entry.reference_number || (entry.transaction_number || entry.id?.slice(0, 8))}
                                        </td>
                                        <td className="py-2 px-2 text-gray-600">
                                            {entry.notes || (entry._type === 'credit_sale' ? 'Items purchase' : 'Payment received')}
                                        </td>
                                        <td className={`py-2 px-2 text-right font-medium ${!isMoneyOut ? 'text-green-700' : 'text-red-700'}`}>
                                            {!isMoneyOut ? '-' : '+'}{formatCurrency(entry.total_amount || entry.amount)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="text-center text-xs text-gray-400 mt-12 pt-8 border-t border-gray-100">
                    <p>Thank you for your business!</p>
                </div>
            </div>
        );
    }
);

CustomerLedgerPDF.displayName = 'CustomerLedgerPDF';

export default CustomerLedgerPDF;
