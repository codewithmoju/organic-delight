// Thermal printer integration utilities

export interface PrinterDevice {
  id: string;
  name: string;
  connected: boolean;
  type: 'usb' | 'bluetooth' | 'network';
}

export class ThermalPrinterManager {
  private device: USBDevice | null = null;
  private isConnected = false;

  async requestDevice(): Promise<boolean> {
    try {
      if (!navigator.usb) {
        throw new Error('Web USB not supported in this browser');
      }

      this.device = await navigator.usb.requestDevice({
        filters: [
          { vendorId: 0x04b8 }, // Epson
          { vendorId: 0x0519 }, // Star Micronics
          { vendorId: 0x154f }, // Citizen
          { vendorId: 0x0fe6 }, // ICS Advent
          { vendorId: 0x20d1 }, // Rongta
        ]
      });

      await this.connect();
      return true;
    } catch (error) {
      console.error('Failed to request printer device:', error);
      return false;
    }
  }

  async connect(): Promise<boolean> {
    if (!this.device) return false;

    try {
      await this.device.open();
      
      if (this.device.configuration === null) {
        await this.device.selectConfiguration(1);
      }
      
      await this.device.claimInterface(0);
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Failed to connect to printer:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.device && this.isConnected) {
      try {
        await this.device.releaseInterface(0);
        await this.device.close();
      } catch (error) {
        console.error('Error disconnecting printer:', error);
      } finally {
        this.isConnected = false;
      }
    }
  }

  async print(data: Uint8Array): Promise<boolean> {
    if (!this.device || !this.isConnected) {
      throw new Error('Printer not connected');
    }

    try {
      // Find the correct endpoint for printing
      const interface_ = this.device.configuration?.interfaces[0];
      const endpoint = interface_?.alternates[0]?.endpoints.find(
        ep => ep.direction === 'out' && ep.type === 'bulk'
      );

      if (!endpoint) {
        throw new Error('No suitable endpoint found for printing');
      }

      await this.device.transferOut(endpoint.endpointNumber, data);
      return true;
    } catch (error) {
      console.error('Print error:', error);
      return false;
    }
  }

  isDeviceConnected(): boolean {
    return this.isConnected;
  }

  getDeviceInfo(): string | null {
    if (!this.device) return null;
    return `${this.device.manufacturerName || 'Unknown'} ${this.device.productName || 'Printer'}`;
  }
}

// ESC/POS command builder
export class ESCPOSBuilder {
  private commands: number[] = [];

  // Initialize printer
  init(): ESCPOSBuilder {
    this.commands.push(0x1B, 0x40); // ESC @
    return this;
  }

  // Text formatting
  text(str: string): ESCPOSBuilder {
    for (let i = 0; i < str.length; i++) {
      this.commands.push(str.charCodeAt(i));
    }
    return this;
  }

  // Line feed
  newLine(count: number = 1): ESCPOSBuilder {
    for (let i = 0; i < count; i++) {
      this.commands.push(0x0A);
    }
    return this;
  }

  // Text alignment
  align(alignment: 'left' | 'center' | 'right'): ESCPOSBuilder {
    const alignmentCodes = { left: 0x00, center: 0x01, right: 0x02 };
    this.commands.push(0x1B, 0x61, alignmentCodes[alignment]);
    return this;
  }

  // Text styling
  bold(enable: boolean = true): ESCPOSBuilder {
    this.commands.push(0x1B, 0x45, enable ? 0x01 : 0x00);
    return this;
  }

  underline(enable: boolean = true): ESCPOSBuilder {
    this.commands.push(0x1B, 0x2D, enable ? 0x01 : 0x00);
    return this;
  }

  // Font size
  fontSize(width: number = 1, height: number = 1): ESCPOSBuilder {
    const size = ((width - 1) << 4) | (height - 1);
    this.commands.push(0x1D, 0x21, size);
    return this;
  }

  // Cut paper
  cut(): ESCPOSBuilder {
    this.commands.push(0x1D, 0x56, 0x41, 0x10);
    return this;
  }

  // Build final command array
  build(): Uint8Array {
    return new Uint8Array(this.commands);
  }

  // Reset builder
  reset(): ESCPOSBuilder {
    this.commands = [];
    return this;
  }
}

// Network printer support
export async function printToNetworkPrinter(
  printerIP: string, 
  port: number = 9100, 
  data: Uint8Array
): Promise<boolean> {
  try {
    // This would require a backend service to handle network printing
    // For now, we'll simulate the call
    const response = await fetch('/api/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Printer-IP': printerIP,
        'X-Printer-Port': port.toString()
      },
      body: data
    });

    return response.ok;
  } catch (error) {
    console.error('Network printer error:', error);
    return false;
  }
}

// Bluetooth printer support (experimental)
export async function printToBluetoothPrinter(data: Uint8Array): Promise<boolean> {
  try {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth not supported');
    }

    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { services: ['000018f0-0000-1000-8000-00805f9b34fb'] } // Serial Port Profile
      ]
    });

    const server = await device.gatt?.connect();
    if (!server) throw new Error('Failed to connect to Bluetooth device');

    // Implementation would depend on specific printer's Bluetooth profile
    console.log('Bluetooth printer connected:', device.name);
    
    return true;
  } catch (error) {
    console.error('Bluetooth printer error:', error);
    return false;
  }
}