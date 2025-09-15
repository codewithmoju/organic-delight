import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';

export class CapacitorService {
  private static instance: CapacitorService;
  private isNative: boolean;
  private platform: string;

  private constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.platform = Capacitor.getPlatform();
  }

  public static getInstance(): CapacitorService {
    if (!CapacitorService.instance) {
      CapacitorService.instance = new CapacitorService();
    }
    return CapacitorService.instance;
  }

  async initialize(): Promise<void> {
    if (!this.isNative) return;

    try {
      // Configure status bar
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#020617' });

      // Hide splash screen after app is ready
      await SplashScreen.hide();

      // Configure keyboard
      if (this.platform === 'ios') {
        Keyboard.addListener('keyboardWillShow', () => {
          document.body.classList.add('keyboard-open');
        });

        Keyboard.addListener('keyboardWillHide', () => {
          document.body.classList.remove('keyboard-open');
        });
      }

      // Monitor network status
      Network.addListener('networkStatusChange', status => {
        console.log('Network status changed', status);
        if (!status.connected) {
          // Handle offline state
          document.body.classList.add('offline');
        } else {
          document.body.classList.remove('offline');
        }
      });

      console.log('Capacitor initialized successfully');
    } catch (error) {
      console.error('Capacitor initialization error:', error);
    }
  }

  isRunningNatively(): boolean {
    return this.isNative;
  }

  getPlatform(): string {
    return this.platform;
  }

  async getDeviceInfo() {
    if (!this.isNative) return null;
    
    try {
      const info = await Device.getInfo();
      return {
        platform: info.platform,
        model: info.model,
        operatingSystem: info.operatingSystem,
        osVersion: info.osVersion,
        manufacturer: info.manufacturer,
        isVirtual: info.isVirtual,
        webViewVersion: info.webViewVersion
      };
    } catch (error) {
      console.error('Error getting device info:', error);
      return null;
    }
  }

  async getNetworkStatus() {
    if (!this.isNative) return { connected: true, connectionType: 'wifi' };
    
    try {
      const status = await Network.getStatus();
      return {
        connected: status.connected,
        connectionType: status.connectionType
      };
    } catch (error) {
      console.error('Error getting network status:', error);
      return { connected: true, connectionType: 'unknown' };
    }
  }
}

export const capacitorService = CapacitorService.getInstance();