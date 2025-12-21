/**
 * SKU (Stock Keeping Unit) Generation Utility
 * Generates unique product identifiers for inventory tracking
 */

/**
 * Generate a unique SKU in format: PROD-{timestamp}-{random}
 * Example: PROD-123456-A7F3
 */
export function generateSKU(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `PROD-${timestamp}-${random}`;
}

/**
 * Validate SKU format
 * @param sku - The SKU to validate
 * @returns true if valid format
 */
export function isValidSKU(sku: string): boolean {
    // Format: PROD-XXXXXX-XXXX (where X is alphanumeric)
    const skuPattern = /^PROD-\d{6}-[A-Z0-9]{4}$/;
    return skuPattern.test(sku);
}

/**
 * Generate a barcode-compatible number (13 digits for EAN-13)
 * Note: This is a simple generator. For production, use proper EAN-13 with checksum
 */
export function generateBarcode(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return (timestamp + random).slice(-13);
}
