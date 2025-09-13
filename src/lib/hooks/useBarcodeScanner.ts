import { useState, useEffect, useCallback } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScannerState } from 'html5-qrcode';

interface UseBarcodeScanner {
  isScanning: boolean;
  error: string | null;
  lastScan: string | null;
  startScanning: () => void;
  stopScanning: () => void;
  onScan: (callback: (barcode: string) => void) => void;
}

export function useBarcodeScanner(elementId: string): UseBarcodeScanner {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [scanCallback, setScanCallback] = useState<((barcode: string) => void) | null>(null);

  const startScanning = useCallback(async () => {
    if (isScanning || scanner) return;

    try {
      // Check for camera permissions
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      const newScanner = new Html5QrcodeScanner(
        elementId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 2,
          supportedScanTypes: [
            // Support multiple barcode formats
            0, // QR Code
            1, // Data Matrix
            2, // UPC-A
            3, // UPC-E
            4, // EAN-8
            5, // EAN-13
            6, // Code 128
            7, // Code 39
            8, // ITF
            9, // Codabar
          ]
        },
        false // verbose logging
      );

      newScanner.render(
        (decodedText, decodedResult) => {
          // Success callback
          setLastScan(decodedText);
          if (scanCallback) {
            scanCallback(decodedText);
          }
        },
        (errorMessage) => {
          // Error callback - only log significant errors
          if (!errorMessage.includes('No MultiFormat Readers')) {
            console.warn('Barcode scan error:', errorMessage);
          }
        }
      );

      setScanner(newScanner);
      setIsScanning(true);
      setError(null);
    } catch (err: any) {
      console.error('Failed to start barcode scanner:', err);
      setError(err.message || 'Failed to access camera');
    }
  }, [elementId, isScanning, scanner, scanCallback]);

  const stopScanning = useCallback(() => {
    if (scanner && isScanning) {
      scanner.clear().then(() => {
        setScanner(null);
        setIsScanning(false);
      }).catch(err => {
        console.error('Error stopping scanner:', err);
        setScanner(null);
        setIsScanning(false);
      });
    }
  }, [scanner, isScanning]);

  const onScan = useCallback((callback: (barcode: string) => void) => {
    setScanCallback(() => callback);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [scanner]);

  return {
    isScanning,
    error,
    lastScan,
    startScanning,
    stopScanning,
    onScan
  };
}