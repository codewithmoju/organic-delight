import { POSTransaction, POSSettings } from '../types';
import { formatCurrency } from './notifications';
import { format } from 'date-fns';

export interface ReceiptData {
  transaction: POSTransaction;
  settings: POSSettings;
}

export function generateReceiptText(data: ReceiptData): string {
  const { transaction, settings } = data;
  
  let receipt = '';
  
  // Store Header
  receipt += centerText(settings.store_name, 32) + '\n';
  receipt += centerText(settings.store_address, 32) + '\n';
  receipt += centerText(settings.store_phone, 32) + '\n';
  receipt += ''.padEnd(32, '-') + '\n\n';
  
  // Transaction Info
  receipt += `Transaction #: ${transaction.transaction_number}\n`;
  receipt += `Date: ${format(transaction.created_at, 'MM/dd/yyyy HH:mm')}\n`;
  receipt += `Cashier: ${transaction.cashier_id}\n`;
  if (transaction.customer_name) {
    receipt += `Customer: ${transaction.customer_name}\n`;
  }
  receipt += ''.padEnd(32, '-') + '\n\n';
  
  // Items
  transaction.items.forEach(item => {
    const itemLine = `${item.item_name.substring(0, 20).padEnd(20)} ${formatCurrency(item.line_total).padStart(8)}`;
    receipt += itemLine + '\n';
    receipt += `  ${item.quantity} x ${formatCurrency(item.unit_price)}`;
    if (item.barcode) {
      receipt += ` #${item.barcode}`;
    }
    receipt += '\n';
  });
  
  receipt += ''.padEnd(32, '-') + '\n';
  
  // Totals
  receipt += `${'Subtotal:'.padEnd(20)} ${formatCurrency(transaction.subtotal).padStart(8)}\n`;
  receipt += `${'Tax:'.padEnd(20)} ${formatCurrency(transaction.tax_amount).padStart(8)}\n`;
  if (transaction.discount_amount > 0) {
    receipt += `${'Discount:'.padEnd(20)} ${('-' + formatCurrency(transaction.discount_amount)).padStart(8)}\n`;
  }
  receipt += `${'TOTAL:'.padEnd(20)} ${formatCurrency(transaction.total_amount).padStart(8)}\n\n`;
  
  // Payment Info
  receipt += `Payment: ${transaction.payment_method.toUpperCase()}\n`;
  receipt += `Amount Paid: ${formatCurrency(transaction.payment_amount)}\n`;
  if (transaction.change_amount > 0) {
    receipt += `Change: ${formatCurrency(transaction.change_amount)}\n`;
  }
  receipt += '\n';
  
  // Footer
  receipt += centerText(settings.receipt_footer_message, 32) + '\n';
  receipt += centerText('Powered by StockSuite POS', 32) + '\n';
  
  return receipt;
}

function centerText(text: string, width: number): string {
  if (text.length >= width) return text.substring(0, width);
  const padding = Math.floor((width - text.length) / 2);
  return ' '.repeat(padding) + text + ' '.repeat(width - text.length - padding);
}

export function generateReceiptHTML(data: ReceiptData): string {
  const { transaction, settings } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt - ${transaction.transaction_number}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.2;
          margin: 0;
          padding: 20px;
          width: 80mm;
          background: white;
          color: black;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .large { font-size: 14px; }
        .separator { border-bottom: 1px solid #000; margin: 10px 0; }
        .flex { display: flex; justify-content: space-between; }
        .item { margin-bottom: 8px; }
        .item-details { font-size: 10px; color: #666; }
        @media print {
          body { margin: 0; padding: 10px; }
        }
      </style>
    </head>
    <body>
      <div class="center">
        <div class="bold large">${settings.store_name}</div>
        <div>${settings.store_address}</div>
        <div>${settings.store_phone}</div>
      </div>
      
      <div class="separator"></div>
      
      <div class="flex">
        <span>Transaction #:</span>
        <span class="bold">${transaction.transaction_number}</span>
      </div>
      <div class="flex">
        <span>Date:</span>
        <span>${format(transaction.created_at, 'MM/dd/yyyy HH:mm')}</span>
      </div>
      <div class="flex">
        <span>Cashier:</span>
        <span>${transaction.cashier_id}</span>
      </div>
      ${transaction.customer_name ? `
      <div class="flex">
        <span>Customer:</span>
        <span>${transaction.customer_name}</span>
      </div>
      ` : ''}
      
      <div class="separator"></div>
      
      ${transaction.items.map(item => `
        <div class="item">
          <div class="flex">
            <span style="flex: 1;">${item.item_name}</span>
            <span>${formatCurrency(item.line_total)}</span>
          </div>
          <div class="item-details">
            ${item.quantity} x ${formatCurrency(item.unit_price)}
            ${item.barcode ? ` #${item.barcode}` : ''}
          </div>
        </div>
      `).join('')}
      
      <div class="separator"></div>
      
      <div class="flex">
        <span>Subtotal:</span>
        <span>${formatCurrency(transaction.subtotal)}</span>
      </div>
      <div class="flex">
        <span>Tax:</span>
        <span>${formatCurrency(transaction.tax_amount)}</span>
      </div>
      ${transaction.discount_amount > 0 ? `
      <div class="flex">
        <span>Discount:</span>
        <span>-${formatCurrency(transaction.discount_amount)}</span>
      </div>
      ` : ''}
      <div class="flex bold large">
        <span>TOTAL:</span>
        <span>${formatCurrency(transaction.total_amount)}</span>
      </div>
      
      <div class="separator"></div>
      
      <div class="flex">
        <span>Payment Method:</span>
        <span class="bold">${transaction.payment_method.toUpperCase()}</span>
      </div>
      <div class="flex">
        <span>Amount Paid:</span>
        <span>${formatCurrency(transaction.payment_amount)}</span>
      </div>
      ${transaction.change_amount > 0 ? `
      <div class="flex bold">
        <span>Change:</span>
        <span>${formatCurrency(transaction.change_amount)}</span>
      </div>
      ` : ''}
      
      <div class="separator"></div>
      
      <div class="center">
        <div>${settings.receipt_footer_message}</div>
        <div style="margin-top: 10px; font-size: 10px; color: #666;">
          Powered by StockSuite POS
        </div>
      </div>
    </body>
    </html>
  `;
}

// Thermal printer commands (ESC/POS)
export function generateThermalPrintCommands(data: ReceiptData): Uint8Array {
  const { transaction, settings } = data;
  const commands: number[] = [];
  
  // Initialize printer
  commands.push(0x1B, 0x40); // ESC @
  
  // Store header (centered, bold)
  commands.push(0x1B, 0x61, 0x01); // Center align
  commands.push(0x1B, 0x45, 0x01); // Bold on
  addText(commands, settings.store_name);
  commands.push(0x0A); // Line feed
  commands.push(0x1B, 0x45, 0x00); // Bold off
  addText(commands, settings.store_address);
  commands.push(0x0A);
  addText(commands, settings.store_phone);
  commands.push(0x0A, 0x0A);
  
  // Transaction info (left align)
  commands.push(0x1B, 0x61, 0x00); // Left align
  addText(commands, `Transaction #: ${transaction.transaction_number}`);
  commands.push(0x0A);
  addText(commands, `Date: ${format(transaction.created_at, 'MM/dd/yyyy HH:mm')}`);
  commands.push(0x0A);
  addText(commands, `Cashier: ${transaction.cashier_id}`);
  commands.push(0x0A);
  if (transaction.customer_name) {
    addText(commands, `Customer: ${transaction.customer_name}`);
    commands.push(0x0A);
  }
  commands.push(0x0A);
  
  // Items
  transaction.items.forEach(item => {
    addText(commands, item.item_name);
    commands.push(0x0A);
    addText(commands, `  ${item.quantity} x ${formatCurrency(item.unit_price)} = ${formatCurrency(item.line_total)}`);
    commands.push(0x0A);
  });
  commands.push(0x0A);
  
  // Totals
  addText(commands, `Subtotal: ${formatCurrency(transaction.subtotal)}`);
  commands.push(0x0A);
  addText(commands, `Tax: ${formatCurrency(transaction.tax_amount)}`);
  commands.push(0x0A);
  commands.push(0x1B, 0x45, 0x01); // Bold on
  addText(commands, `TOTAL: ${formatCurrency(transaction.total_amount)}`);
  commands.push(0x1B, 0x45, 0x00); // Bold off
  commands.push(0x0A, 0x0A);
  
  // Payment info
  addText(commands, `Payment: ${transaction.payment_method.toUpperCase()}`);
  commands.push(0x0A);
  addText(commands, `Paid: ${formatCurrency(transaction.payment_amount)}`);
  commands.push(0x0A);
  if (transaction.change_amount > 0) {
    addText(commands, `Change: ${formatCurrency(transaction.change_amount)}`);
    commands.push(0x0A);
  }
  commands.push(0x0A);
  
  // Footer (centered)
  commands.push(0x1B, 0x61, 0x01); // Center align
  addText(commands, settings.receipt_footer_message);
  commands.push(0x0A);
  addText(commands, 'Powered by StockSuite POS');
  commands.push(0x0A, 0x0A, 0x0A);
  
  // Cut paper
  commands.push(0x1D, 0x56, 0x41, 0x10);
  
  return new Uint8Array(commands);
}

function addText(commands: number[], text: string) {
  for (let i = 0; i < text.length; i++) {
    commands.push(text.charCodeAt(i));
  }
}

// Print to thermal printer via Web USB (if supported)
export async function printToThermalPrinter(data: ReceiptData): Promise<boolean> {
  try {
    if (!navigator.usb) {
      throw new Error('Web USB not supported');
    }
    
    // Request USB device (thermal printer)
    const device = await navigator.usb.requestDevice({
      filters: [
        { vendorId: 0x04b8 }, // Epson
        { vendorId: 0x0519 }, // Star Micronics
        { vendorId: 0x154f }, // Citizen
      ]
    });
    
    await device.open();
    await device.selectConfiguration(1);
    await device.claimInterface(0);
    
    // Generate print commands
    const printData = generateThermalPrintCommands(data);
    
    // Send to printer
    await device.transferOut(1, printData);
    
    await device.close();
    return true;
  } catch (error) {
    console.error('Thermal printer error:', error);
    return false;
  }
}