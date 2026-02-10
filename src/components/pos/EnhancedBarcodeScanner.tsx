import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { toast } from 'sonner';

interface EnhancedBarcodeScannerProps {
  onScan: (barcode: string) => void;
  isActive: boolean;
  onToggle: () => void;
  className?: string;
}

export default function EnhancedBarcodeScanner({
  onScan,
  isActive,
  onToggle,
  className = ''
}: EnhancedBarcodeScannerProps) {
  const { t } = useTranslation();
  const scannerRef = useRef<HTMLDivElement>(null);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<string | null>(null);

  useEffect(() => {
    if (isActive && !isInitialized) {
      initializeScanner();
    } else if (!isActive && scanner) {
      stopScanner();
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [isActive]);

  const initializeScanner = async () => {
    if (!scannerRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());

      const newScanner = new Html5QrcodeScanner(
        'barcode-scanner-container',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 2,
          supportedScanTypes: [
            Html5QrcodeScanType.SCAN_TYPE_CAMERA,
            Html5QrcodeScanType.SCAN_TYPE_FILE
          ]
        },
        false
      );

      newScanner.render(
        (decodedText) => {
          if (decodedText !== lastScan) {
            setLastScan(decodedText);
            onScan(decodedText);
            toast.success(`${t('pos.terminal.successfulScans', 'Scanned')}: ${decodedText}`);
            playBeepSound();
          }
        },
        (errorMessage) => {
          if (!errorMessage.includes('No MultiFormat Readers') &&
            !errorMessage.includes('NotFoundException')) {
            console.warn('Barcode scan error:', errorMessage);
          }
        }
      );

      setScanner(newScanner);
      setIsInitialized(true);
      setError(null);
    } catch (err: any) {
      console.error('Failed to initialize barcode scanner:', err);
      setError(err.message || 'Failed to access camera');
    }
  };

  const stopScanner = () => {
    if (scanner) {
      scanner.clear().then(() => {
        setScanner(null);
        setIsInitialized(false);
      }).catch(err => {
        console.error('Error stopping scanner:', err);
        setScanner(null);
        setIsInitialized(false);
      });
    }
  };

  const playBeepSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
      audio.play().catch(() => { });
    } catch (error) { }
  };

  if (!isActive) return null;

  return (
    <div className={`relative rounded-xl overflow-hidden bg-black border border-border/50 ${className}`}>
      {/* Close Button */}
      <button
        onClick={onToggle}
        className="absolute top-2 right-2 z-20 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div
        id="barcode-scanner-container"
        ref={scannerRef}
        className="w-full h-64 sm:h-80 flex items-center justify-center"
      />

      {/* Scanning Overlay */}
      {isInitialized && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <motion.div
            animate={{ y: [0, 320, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-0.5 bg-success-400 shadow-glow opacity-50"
          />

          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-success-400/50 rounded-lg">
            <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-success-400" />
            <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-success-400" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-success-400" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-success-400" />
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-30">
          <div className="text-center p-4">
            <AlertCircle className="w-10 h-10 text-error-400 mx-auto mb-2" />
            <p className="text-error-400 font-medium mb-1">{t('pos.terminal.scannerError', 'Scanner Error')}</p>
            <p className="text-foreground-muted text-xs mb-3">{error}</p>
            <button
              onClick={() => {
                setError(null);
                stopScanner();
                setTimeout(initializeScanner, 1000);
              }}
              className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Last Scan Indicator */}
      {lastScan && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-success-400 px-3 py-1.5 rounded-full flex items-center space-x-2 z-20"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{lastScan}</span>
        </motion.div>
      )}
    </div>
  );
}