import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Printer, Wifi, Usb, Bluetooth, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { POSTransaction, POSSettings } from '../../lib/types';
import { generateReceiptHTML, generateThermalPrintCommands, printToThermalPrinter } from '../../lib/utils/receipt';
import LoadingSpinner from '../ui/LoadingSpinner';

interface PrinterDevice {
  id: string;
  name: string;
  type: 'usb' | 'network' | 'bluetooth';
  connected: boolean;
  status: 'ready' | 'busy' | 'error' | 'offline';
}

interface ExternalPrinterIntegrationProps {
  transaction: POSTransaction;
  settings: POSSettings;
  onPrintComplete?: () => void;
  className?: string;
}

export default function ExternalPrinterIntegration({
  transaction,
  settings,
  onPrintComplete,
  className = ''
}: ExternalPrinterIntegrationProps) {
  const [availablePrinters, setAvailablePrinters] = useState<PrinterDevice[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterDevice | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [printHistory, setPrintHistory] = useState<string[]>([]);

  useEffect(() => {
    scanForPrinters();
  }, []);

  const scanForPrinters = async () => {
    setIsScanning(true);
    try {
      const printers: PrinterDevice[] = [];

      // Check for USB printers
      if (navigator.usb) {
        try {
          const devices = await navigator.usb.getDevices();
          devices.forEach((device, index) => {
            if (device.productName?.toLowerCase().includes('printer') ||
              device.manufacturerName?.toLowerCase().includes('epson') ||
              device.manufacturerName?.toLowerCase().includes('star')) {
              printers.push({
                id: `usb-${index}`,
                name: `${device.manufacturerName || 'Unknown'} ${device.productName || 'USB Printer'}`,
                type: 'usb',
                connected: true,
                status: 'ready'
              });
            }
          });
        } catch (error) {
          console.warn('USB printer detection failed:', error);
        }
      }

      // Check for network printers (simulated)
      const networkPrinters = [
        { ip: '192.168.1.100', name: 'Network Printer 1' },
        { ip: '192.168.1.101', name: 'Network Printer 2' }
      ];

      for (const printer of networkPrinters) {
        try {
          printers.push({
            id: `network-${printer.ip}`,
            name: printer.name,
            type: 'network',
            connected: Math.random() > 0.5,
            status: 'ready'
          });
        } catch (error) {
          console.warn('Network printer check failed:', error);
        }
      }

      // Add default system printer
      printers.push({
        id: 'system-default',
        name: 'System Default Printer',
        type: 'usb',
        connected: true,
        status: 'ready'
      });

      setAvailablePrinters(printers);

      // Auto-select first available printer
      const readyPrinter = printers.find(p => p.connected && p.status === 'ready');
      if (readyPrinter) {
        setSelectedPrinter(readyPrinter);
      }
    } catch (error) {
      console.error('Error scanning for printers:', error);
      toast.error('Failed to scan for printers');
    } finally {
      setIsScanning(false);
    }
  };

  const handlePrint = async (format: 'standard' | 'thermal' = 'standard') => {
    if (!selectedPrinter) {
      toast.error('Please select a printer first');
      return;
    }

    setIsPrinting(true);
    try {
      if (selectedPrinter.type === 'usb' && format === 'thermal') {
        const success = await printToThermalPrinter({
          transaction,
          settings
        });

        if (success) {
          toast.success('Receipt printed successfully');
          setPrintHistory(prev => [...prev, `${new Date().toLocaleTimeString()} - Thermal receipt`]);
        } else {
          throw new Error('Thermal printing failed');
        }
      } else {
        const receiptHTML = generateReceiptHTML({ transaction, settings });
        const printWindow = window.open('', '_blank');

        if (printWindow) {
          printWindow.document.write(receiptHTML);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();

          setTimeout(() => {
            printWindow.close();
            toast.success('Receipt sent to printer');
            setPrintHistory(prev => [...prev, `${new Date().toLocaleTimeString()} - Standard receipt`]);
          }, 1000);
        } else {
          throw new Error('Failed to open print window');
        }
      }

      onPrintComplete?.();
    } catch (error: any) {
      console.error('Print error:', error);
      toast.error(error.message || 'Failed to print receipt');
    } finally {
      setIsPrinting(false);
    }
  };

  const connectToPrinter = async (printer: PrinterDevice) => {
    try {
      if (printer.type === 'usb') {
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

        toast.success(`Connected to ${printer.name}`);
        setSelectedPrinter({ ...printer, connected: true, status: 'ready' });
      } else if (printer.type === 'bluetooth') {
        const device = await navigator.bluetooth.requestDevice({
          filters: [
            { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }
          ]
        });

        const server = await device.gatt?.connect();
        if (server) {
          toast.success(`Connected to ${printer.name}`);
          setSelectedPrinter({ ...printer, connected: true, status: 'ready' });
        }
      }
    } catch (error: any) {
      console.error('Printer connection error:', error);
      toast.error(`Failed to connect to ${printer.name}`);
    }
  };

  return (
    <div className={`bg-card rounded-2xl border border-border/50 shadow-sm p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Receipt Printing</h3>
            <p className="text-foreground-muted text-sm">Print professional receipts</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={scanForPrinters}
          disabled={isScanning}
          className="btn-secondary flex items-center gap-2"
        >
          {isScanning ? (
            <LoadingSpinner size="sm" color="primary" />
          ) : (
            <Settings className="w-4 h-4" />
          )}
          {isScanning ? 'Scanning...' : 'Refresh'}
        </motion.button>
      </div>

      {/* Printer Selection */}
      <div className="mb-6">
        <label className="block text-base font-medium text-foreground-muted mb-3">
          Available Printers
        </label>
        <div className="space-y-2">
          {availablePrinters.map((printer) => (
            <motion.div
              key={printer.id}
              whileHover={{ scale: 1.01 }}
              onClick={() => setSelectedPrinter(printer)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${selectedPrinter?.id === printer.id
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-border bg-muted/20 hover:border-primary-500/50'
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${printer.type === 'usb' ? 'bg-blue-500/20 text-blue-400' :
                      printer.type === 'network' ? 'bg-green-500/20 text-green-400' :
                        'bg-purple-500/20 text-purple-400'
                    }`}>
                    {printer.type === 'usb' ? <Usb className="w-4 h-4" /> :
                      printer.type === 'network' ? <Wifi className="w-4 h-4" /> :
                        <Bluetooth className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-foreground font-medium">{printer.name}</div>
                    <div className="text-foreground-muted text-sm capitalize">
                      {printer.type} • {printer.status}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {printer.connected ? (
                    <CheckCircle className="w-5 h-5 text-success-400" />
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        connectToPrinter(printer);
                      }}
                      className="btn-secondary text-xs px-3 py-1"
                    >
                      Connect
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Print Options */}
      {selectedPrinter && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePrint('standard')}
              disabled={isPrinting || !selectedPrinter.connected}
              className="btn-primary flex items-center justify-center gap-2 py-3"
            >
              {isPrinting ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              Print Standard Receipt
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePrint('thermal')}
              disabled={isPrinting || !selectedPrinter.connected || selectedPrinter.type !== 'usb'}
              className="btn-secondary flex items-center justify-center gap-2 py-3"
            >
              {isPrinting ? (
                <LoadingSpinner size="sm" color="primary" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              Print Thermal Receipt
            </motion.button>
          </div>

          {/* Print History */}
          {printHistory.length > 0 && (
            <div className="bg-muted/20 rounded-lg p-4 border border-border/50">
              <h4 className="text-foreground font-medium mb-3">Recent Prints</h4>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {printHistory.slice(-5).map((entry, index) => (
                  <div key={index} className="text-sm text-foreground-muted flex items-center">
                    <CheckCircle className="w-3 h-3 mr-2 text-success-400" />
                    {entry}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Printers Available */}
      {availablePrinters.length === 0 && !isScanning && (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-foreground-muted/30 mx-auto mb-4" />
          <h4 className="text-foreground-muted font-medium mb-2">No Printers Found</h4>
          <p className="text-foreground-muted/60 text-sm mb-4">
            Connect a USB thermal printer or ensure network printers are accessible
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={scanForPrinters}
            className="btn-primary"
          >
            Scan for Printers
          </motion.button>
        </div>
      )}
    </div>
  );
}