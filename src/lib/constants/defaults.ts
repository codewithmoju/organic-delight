import { POSSettings } from '../types';

export const DEFAULT_POS_SETTINGS: POSSettings = {
    store_name: 'Organic Delight Store',
    store_address: 'Shop #12, Main Market',
    store_phone: '+92 300 1234567',
    store_email: 'contact@organicdelight.com',
    store_website: 'www.organicdelight.com',
    store_city: 'Lahore',
    store_country: 'Pakistan',
    tax_rate: 0.08, // 8% tax
    tax_number: 'TAX-12345678',
    currency: 'PKR',
    receipt_header_message: 'Welcome to Organic Delight!',
    receipt_footer_message: 'Thank you for shopping with us!',
    auto_print_receipt: true,
    barcode_scanner_enabled: true,
    thermal_printer_enabled: false,
    quick_access_items: []
};
