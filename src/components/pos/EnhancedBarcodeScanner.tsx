import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, CameraOff, Scan, AlertCircle, CheckCircle, Zap, Settings } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
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
  const scannerRef = useRef<HTMLDivElement>(null);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [scannerConfig, setScannerConfig] = useState({
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0
  });

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
      // Check camera permissions first
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());

      const newScanner = new Html5QrcodeScanner(
        'barcode-scanner-container',
        {
          fps: scannerConfig.fps,
          qrbox: scannerConfig.qrbox,
          aspectRatio: scannerConfig.aspectRatio,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 2,
          supportedScanTypes: [
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
        false
      );

      newScanner.render(
        (decodedText, decodedResult) => {
          // Success callback
          if (decodedText !== lastScan) {
            setLastScan(decodedText);
            setScanCount(prev => prev + 1);
            onScan(decodedText);
            
            // Visual feedback
            toast.success(`Scanned: ${decodedText}`);
            
            // Audio feedback
            playBeepSound();
          }
        },
        (errorMessage) => {
          // Only log significant errors
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
      audio.play().catch(() => {}); // Ignore audio errors
    } catch (error) {
      // Ignore audio errors
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Scanner Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggle}
            className={`p-3 rounded-xl transition-all duration-200 flex items-center gap-2 ${
              isActive
                ? 'bg-success-500/20 text-success-400 border border-success-500/50'
                : 'bg-dark-700/50 text-gray-400 border border-dark-600/50 hover:border-primary-500/50'
            }`}
          >
            {isActive ? <Camera className="w-6 h-6" /> : <CameraOff className="w-6 h-6" />}
            <span className="font-medium">
              {isActive ? 'Scanner Active' : 'Start Scanner'}
            </span>
          </motion.button>
          
          {isActive && (
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Zap className="w-4 h-4 text-success-400" />
              <span>Ready to scan</span>
            </div>
          )}
        </div>
        
        {scanCount > 0 && (
          <div className="text-right">
            <div className="text-primary-400 font-bold text-lg">{scanCount}</div>
            <div className="text-gray-400 text-xs">successful scans</div>
          </div>
        )}
      </div>

      {/* Scanner Display */}
      <div className={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 ${
        isActive 
          ? 'border-success-500/50 bg-black' 
          : 'border-dark-600/50 bg-dark-800/50'
      }`}>
        <div 
          id="barcode-scanner-container"
          ref={scannerRef} 
          className="w-full h-64 sm:h-80 flex items-center justify-center"
        >
          {!isActive && (
            <div className="text-center">
              <Scan className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">Barcode Scanner</p>
              <p className="text-gray-500 text-sm mt-2">
                Click "Start Scanner" to begin scanning barcodes
              </p>
              <div className="mt-4 text-xs text-gray-600">
                <p>Supports: UPC, EAN, Code 128, Code 39, QR codes</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Scanning Overlay */}
        {isActive && isInitialized && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Scanning animation */}
            <motion.div
              animate={{ y: [0, 240, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-0.5 bg-success-400 shadow-glow"
            />
            
            {/* Corner guides */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-success-400" />
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-success-400" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-success-400" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-success-400" />
            
            {/* Instructions */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm font-medium">
              Position barcode within the frame
            </div>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-900/90">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-error-400 mx-auto mb-3" />
              <p className="text-error-400 font-medium mb-2">Scanner Error</p>
              <p className="text-gray-400 text-sm mb-4">{error}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setError(null);
                  if (isActive) {
                    stopScanner();
                    setTimeout(initializeScanner, 1000);
                  }
                }}
                className="btn-primary"
              >
                Retry Scanner
              </motion.button>
            </div>
          </div>
        )}
        
        {/* Last Scan Indicator */}
        {lastScan && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-success-500/20 border border-success-500/50 text-success-400 px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Last: {lastScan}</span>
          </motion.div>
        )}
      </div>

      {/* Manual Entry Fallback */}
      <div className="mt-4 space-y-3">
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-3">
            Scanner not working? Enter barcode manually:
          </p>
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter barcode manually"
            className="flex-1 input-dark"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value.trim();
                if (value) {
                  onScan(value);
                  (e.target as HTMLInputElement).value = '';
                  toast.success(`Manual entry: ${value}`);
                }
              }
            }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const input = document.querySelector('input[placeholder="Enter barcode manually"]') as HTMLInputElement;
              const value = input?.value.trim();
              if (value) {
                onScan(value);
                input.value = '';
                toast.success(`Manual entry: ${value}`);
              }
            }}
            className="btn-secondary px-4"
          >
            Add
          </motion.button>
        </div>
      </div>

      {/* Scanner Settings */}
      <div className="mt-4 p-3 bg-dark-800/30 rounded-lg border border-dark-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 text-sm">Scanner Quality:</span>
          </div>
          <select
            value={scannerConfig.fps}
            onChange={(e) => {
              const fps = parseInt(e.target.value);
              setScannerConfig(prev => ({ ...prev, fps }));
              if (isActive) {
                // Restart scanner with new settings
                stopScanner();
                setTimeout(initializeScanner, 500);
              }
            }}
            className="input-dark text-sm py-1 px-2"
          >
            <option value={5}>Low (5 FPS)</option>
            <option value={10}>Medium (10 FPS)</option>
            <option value={15}>High (15 FPS)</option>
          </select>
        </div>
      </div>
    </div>
  );
}