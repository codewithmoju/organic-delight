import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stocksuite.app',
  appName: 'StockSuite',
  webDir: 'dist',
  plugins: {
    CapacitorUpdater: {
      autoUpdate: false, // We handle it manually in App.tsx
    }
  }
};

export default config;
