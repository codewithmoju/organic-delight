/**
 * Bill ID Generation Utility
 * Generates unique bill/invoice numbers for purchases and sales
 */

/**
 * Generate a unique bill ID in format: BILL-YYYYMMDD-XXXX
 * Example: BILL-20231221-A7F3
 */
export function generateBillId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `BILL-${dateStr}-${random}`;
}

/**
 * Generate a purchase bill ID
 * Format: PUR-YYYYMMDD-XXXX
 */
export function generatePurchaseBillId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `PUR-${dateStr}-${random}`;
}

/**
 * Generate a sales invoice ID
 * Format: INV-YYYYMMDD-XXXX
 */
export function generateInvoiceId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `INV-${dateStr}-${random}`;
}

/**
 * Validate bill ID format
 */
export function isValidBillId(billId: string): boolean {
    const billPattern = /^(BILL|PUR|INV)-\d{8}-[A-Z0-9]{4}$/;
    return billPattern.test(billId);
}
