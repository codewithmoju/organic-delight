// Barcode validation and formatting utilities

export function validateBarcode(barcode: string): boolean {
  // Remove any spaces or special characters
  const cleanBarcode = barcode.replace(/\s+/g, '').replace(/[^0-9]/g, '');
  
  // Check common barcode formats
  const formats = [
    /^\d{12}$/, // UPC-A
    /^\d{8}$/, // UPC-E
    /^\d{13}$/, // EAN-13
    /^\d{8}$/, // EAN-8
    /^[0-9A-Z\-\.\ \$\/\+\%]{1,43}$/, // Code 128
    /^[0-9A-Z\-\.\ \$\/\+\%]{1,43}$/, // Code 39
  ];
  
  return formats.some(format => format.test(cleanBarcode));
}

export function formatBarcode(barcode: string): string {
  // Clean and format barcode
  const cleaned = barcode.replace(/\s+/g, '').toUpperCase();
  
  // Add formatting based on length
  if (cleaned.length === 12) {
    // UPC-A format: 123456 789012
    return cleaned.replace(/(\d{6})(\d{6})/, '$1 $2');
  } else if (cleaned.length === 13) {
    // EAN-13 format: 1 234567 890123
    return cleaned.replace(/(\d{1})(\d{6})(\d{6})/, '$1 $2 $3');
  }
  
  return cleaned;
}

export function generateBarcode(): string {
  // Generate a simple internal barcode
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `SS${timestamp.slice(-8)}${random}`;
}

export function getBarcodeType(barcode: string): string {
  const cleaned = barcode.replace(/\s+/g, '');
  
  if (/^\d{12}$/.test(cleaned)) return 'UPC-A';
  if (/^\d{8}$/.test(cleaned)) return 'UPC-E';
  if (/^\d{13}$/.test(cleaned)) return 'EAN-13';
  if (/^\d{8}$/.test(cleaned)) return 'EAN-8';
  if (/^[0-9A-Z\-\.\ \$\/\+\%]+$/.test(cleaned)) return 'Code 128';
  
  return 'Unknown';
}

export function calculateCheckDigit(barcode: string): string {
  // Calculate check digit for UPC/EAN barcodes
  const digits = barcode.replace(/\D/g, '').split('').map(Number);
  
  if (digits.length === 11) {
    // UPC-A check digit calculation
    let sum = 0;
    for (let i = 0; i < 11; i++) {
      sum += digits[i] * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return barcode + checkDigit.toString();
  }
  
  if (digits.length === 12) {
    // EAN-13 check digit calculation
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += digits[i] * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return barcode + checkDigit.toString();
  }
  
  return barcode;
}