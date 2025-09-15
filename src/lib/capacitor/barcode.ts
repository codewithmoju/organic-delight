import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';

export class MobileBarcodeService {
  private isScanning = false;

  async startScan(): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Barcode scanning is only available on native platforms');
    }

    try {
      // Check permissions
      const status = await BarcodeScanner.checkPermission({ force: true });
      
      if (status.granted) {
        // Hide background to show camera
        BarcodeScanner.hideBackground();
        
        this.isScanning = true;
        const result = await BarcodeScanner.startScan();
        
        if (result.hasContent) {
          return result.content;
        }
      } else {
        throw new Error('Camera permission denied');
      }
    } catch (error) {
      console.error('Barcode scan error:', error);
      throw error;
    } finally {
      this.isScanning = false;
      BarcodeScanner.showBackground();
      BarcodeScanner.stopScan();
    }

    return null;
  }

  async stopScan(): Promise<void> {
    if (this.isScanning) {
      BarcodeScanner.showBackground();
      BarcodeScanner.stopScan();
      this.isScanning = false;
    }
  }

  async checkPermissions() {
    if (!Capacitor.isNativePlatform()) {
      return { camera: 'granted' };
    }

    try {
      const status = await BarcodeScanner.checkPermission({ force: false });
      return { camera: status.granted ? 'granted' : 'denied' };
    } catch (error) {
      console.error('Barcode permission check error:', error);
      return { camera: 'denied' };
    }
  }

  isCurrentlyScanning(): boolean {
    return this.isScanning;
  }
}

export const mobileBarcodeService = new MobileBarcodeService();