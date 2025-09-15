import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, X, Flashlight, FlashlightOff, RotateCcw } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { mobileBarcodeService } from '../../lib/capacitor/barcode';
import { hapticsService } from '../../lib/capacitor/haptics';
import { toast } from 'sonner';

interface MobileBarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export default function MobileBarcodeScanner({ isOpen, onClose, onScan }: MobileBarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && Capacitor.isNativePlatform()) {
      checkPermissions();
    }
  }, [isOpen]);

  const checkPermissions = async () => {
    try {
      const permissions = await mobileBarcodeService.checkPermissions();
      setHasPermission(permissions.camera === 'granted');
      
      if (permissions.camera !== 'granted') {
        setError('Camera permission is required for barcode scanning');
      }
    } catch (error) {
      console.error('Permission check error:', error);
      setError('Failed to check camera permissions');
    }
  };

  const startScanning = async () => {
    if (!hasPermission) {
      await checkPermissions();
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      const result = await mobileBarcodeService.startScan();
      
      if (result) {
        await hapticsService.successFeedback();
        onScan(result);
        onClose();
        toast.success(`Scanned: ${result}`);
      }
    } catch (error: any) {
      console.error('Scan error:', error);
      setError(error.message || 'Failed to scan barcode');
      await hapticsService.errorFeedback();
    } finally {
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    try {
      await mobileBarcodeService.stopScan();
      setIsScanning(false);
    } catch (error) {
      console.error('Stop scan error:', error);
    }
  };

  const handleClose = async () => {
    if (isScanning) {
      await stopScanning();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4 safe-area-top">
          <h2 className="text-white text-lg font-semibold">Scan Barcode</h2>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleClose}
            className="p-2 rounded-full bg-black/50 text-white"
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 relative">
        {!hasPermission ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white p-6">
              <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Camera Permission Required</h3>
              <p className="text-gray-300 mb-6">
                Please grant camera permission to scan barcodes
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={checkPermissions}
                className="btn-primary"
              >
                Grant Permission
              </motion.button>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white p-6">
              <div className="text-red-400 text-xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold mb-2">Scanner Error</h3>
              <p className="text-gray-300 mb-6">{error}</p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setError(null);
                  checkPermissions();
                }}
                className="btn-primary"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            {!isScanning ? (
              <div className="text-center text-white p-6">
                <Camera className="w-16 h-16 mx-auto mb-4 text-primary-400" />
                <h3 className="text-xl font-semibold mb-2">Ready to Scan</h3>
                <p className="text-gray-300 mb-6">
                  Position the barcode within the camera view
                </p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={startScanning}
                  className="btn-primary text-lg px-8 py-4"
                >
                  Start Scanning
                </motion.button>
              </div>
            ) : (
              <div className="text-center text-white p-6">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-16 h-16 mx-auto mb-4 border-4 border-primary-400 rounded-full flex items-center justify-center"
                >
                  <Camera className="w-8 h-8 text-primary-400" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">Scanning...</h3>
                <p className="text-gray-300 mb-6">
                  Point your camera at a barcode
                </p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={stopScanning}
                  className="btn-secondary"
                >
                  Stop Scanning
                </motion.button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scanning Overlay */}
      {isScanning && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Scanning frame */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-primary-400 rounded-lg">
            {/* Corner indicators */}
            <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-primary-400 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-primary-400 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-primary-400 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-primary-400 rounded-br-lg" />
            
            {/* Scanning line */}
            <motion.div
              animate={{ y: [0, 240, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-0.5 bg-primary-400 shadow-glow"
            />
          </div>
          
          {/* Instructions */}
          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-6 py-3 rounded-lg">
            <p className="text-center font-medium">Position barcode within the frame</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}