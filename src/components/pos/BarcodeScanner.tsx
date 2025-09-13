import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, CameraOff, Scan, AlertCircle, CheckCircle } from 'lucide-react';
import Quagga from 'quagga';
import { toast } from 'sonner';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  isActive: boolean;
  onToggle: () => void;
  className?: string;
}

export default function BarcodeScanner({ onScan, isActive, onToggle, className = '' }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);

  useEffect(() => {
    if (isActive && !isInitialized) {
      initializeScanner();
    } else if (!isActive && isInitialized) {
      stopScanner();
    }

    return () => {
      if (isInitialized) {
        stopScanner();
      }
    };
  }, [isActive, isInitialized]);

  const initializeScanner = async () => {
    if (!scannerRef.current) return;

    try {
      // Check for camera permissions
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the test stream

      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment" // Use back camera on mobile
          }
        },
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        numOfWorkers: 2,
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader",
            "code_39_reader",
            "code_39_vin_reader",
            "codabar_reader",
            "upc_reader",
            "upc_e_reader",
            "i2of5_reader"
          ]
        },
        locate: true
      }, (err) => {
        if (err) {
          console.error('Barcode scanner initialization error:', err);
          setError('Failed to initialize camera. Please check permissions.');
          return;
        }
        
        setIsInitialized(true);
        setError(null);
        Quagga.start();
        
        // Listen for successful scans
        Quagga.onDetected((result) => {
          const code = result.codeResult.code;
          if (code && code !== lastScan) {
            setLastScan(code);
            setScanCount(prev => prev + 1);
            onScan(code);
            
            // Visual feedback
            const canvas = Quagga.canvas.ctx.overlay;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.strokeStyle = '#00ff00';
              ctx.lineWidth = 3;
              ctx.strokeRect(
                result.box[0][0],
                result.box[0][1],
                result.box[2][0] - result.box[0][0],
                result.box[2][1] - result.box[0][1]
              );
            }
            
            // Audio feedback
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
            audio.play().catch(() => {}); // Ignore audio errors
          }
        });
      });
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Camera access denied. Please enable camera permissions.');
    }
  };

  const stopScanner = () => {
    if (isInitialized) {
      Quagga.stop();
      setIsInitialized(false);
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
            className={`p-3 rounded-xl transition-all duration-200 ${
              isActive
                ? 'bg-success-500/20 text-success-400 border border-success-500/50'
                : 'bg-dark-700/50 text-gray-400 border border-dark-600/50 hover:border-primary-500/50'
            }`}
          >
            {isActive ? <Camera className="w-6 h-6" /> : <CameraOff className="w-6 h-6" />}
          </motion.button>
          
          <div>
            <h3 className="text-white font-semibold">Barcode Scanner</h3>
            <p className="text-gray-400 text-sm">
              {isActive ? 'Scanning for barcodes...' : 'Click to activate scanner'}
            </p>
          </div>
        </div>
        
        {scanCount > 0 && (
          <div className="text-right">
            <div className="text-primary-400 font-semibold">{scanCount}</div>
            <div className="text-gray-400 text-xs">scans</div>
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
          ref={scannerRef} 
          className="w-full h-64 sm:h-80 flex items-center justify-center"
        >
          {!isActive && (
            <div className="text-center">
              <Scan className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Camera inactive</p>
              <p className="text-gray-500 text-sm mt-2">
                Click the camera button to start scanning
              </p>
            </div>
          )}
        </div>
        
        {/* Scanning Overlay */}
        {isActive && isInitialized && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Scanning line animation */}
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
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
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
              <p className="text-gray-400 text-sm">{error}</p>
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
                className="btn-primary mt-4"
              >
                Retry
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
            <span className="text-sm font-medium">Scanned: {lastScan}</span>
          </motion.div>
        )}
      </div>

      {/* Manual Barcode Entry */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Manual Barcode Entry
        </label>
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
              }
            }}
            className="btn-secondary px-4"
          >
            Add
          </motion.button>
        </div>
      </div>
    </div>
  );
}