import { forwardRef } from 'react';
import { format } from 'date-fns';
import { Vendor, POSSettings } from '../../lib/types';
import { formatCurrency } from '../../lib/utils/notifications';

interface LedgerEntry {
    id: string;
    date: Date;
    type: 'purchase' | 'payment';
    reference: string;
    description: string;
    amount: number;
    balance_change: number;
}

interface VendorLedgerPDFProps {
    vendor: Vendor;
    ledger: LedgerEntry[];
    settings: POSSettings;
}

const VendorLedgerPDF = forwardRef<HTMLDivElement, VendorLedgerPDFProps>(
    ({ vendor, ledger, settings }, ref) => {
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
                        <h2 className="text-2xl font-bold text-gray-400 uppercase tracking-widest">Vendor Ledger</h2>
                        <div className="mt-2 text-sm">
                            <strong>Date:</strong> {format(new Date(), 'dd MMM yyyy')}
                        </div>
                    </div>
                </div>

                {/* Vendor Details */}
                <div className="bg-gray-50 p-4 rounded-lg mb-8 border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Vendor Details</h3>
                    <div className="flex justify-between">
                        <div>
                            <div className="text-lg font-bold">{vendor.company}</div>
                            <div className="text-gray-600">{vendor.name}</div>
                        </div>
                        <div className="text-right text-sm space-y-1 text-gray-600">
                            {vendor.phone && <div>PH: {vendor.phone}</div>}
                            {vendor.email && <div>{vendor.email}</div>}
                            {vendor.gst_number && <div>GST: {vendor.gst_number}</div>}
                            {vendor.address && <div className="max-w-[200px] ml-auto">{vendor.address}</div>}
                        </div>
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
                                <th className="text-right py-3 px-2 font-bold uppercase text-xs">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ledger.map((entry, index) => (
                                <tr key={entry.id} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                    <td className="py-2 px-2">{format(entry.date, 'dd/MM/yyyy')}</td>
                                    <td className="py-2 px-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${entry.type === 'purchase' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                            }`}>
                                            {entry.type}
                                        </span>
                                    </td>
                                    <td className="py-2 px-2 font-mono text-xs text-gray-500">{entry.reference}</td>
                                    <td className="py-2 px-2 text-gray-700">{entry.description}</td>
                                    <td className="py-2 px-2 text-right font-medium">{formatCurrency(entry.amount)}</td>
                                    <td className={`py-2 px-2 text-right font-bold ${entry.balance_change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {entry.balance_change > 0 ? '+' : ''}{formatCurrency(entry.balance_change)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary / Footer */}
                <div className="flex justify-end mb-12">
                    <div className="w-64 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">Total Purchases</span>
                            <span className="font-bold">{formatCurrency(vendor.total_purchases)}</span>
                        </div>
                        <div className="border-t border-gray-300 my-2"></div>
                        <div className="flex justify-between items-center text-lg">
                            <span className="font-bold text-gray-800">Outstanding Balance</span>
                            <span className={`font-bold ${vendor.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(vendor.outstanding_balance)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
                    <p>Generated on {format(new Date(), 'dd MMM yyyy HH:mm')}</p>
                    <p className="mt-1 font-bold">STOCK SUITE by NAMS STUDIO</p>
                </div>
            </div>
        );
    }
);

VendorLedgerPDF.displayName = 'VendorLedgerPDF';

export default VendorLedgerPDF;
