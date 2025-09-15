# StockSuite Mobile App Setup Guide

## Overview
This guide will help you convert your StockSuite web application into a native mobile app using Capacitor.

## Prerequisites
- Node.js 16+ installed
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Java 17+ (for Android)

## Step 1: Initial Setup

### 1.1 Install Dependencies
```bash
npm install
```

### 1.2 Initialize Capacitor
```bash
npx cap init
```

### 1.3 Add Platforms
```bash
# Add Android platform
npx cap add android

# Add iOS platform (macOS only)
npx cap add ios
```

## Step 2: Build and Sync

### 2.1 Build the Web App
```bash
npm run build
```

### 2.2 Sync with Native Platforms
```bash
npx cap sync
```

## Step 3: Platform-Specific Setup

### 3.1 Android Setup

1. **Install Android Studio**
   - Download from https://developer.android.com/studio
   - Install Android SDK and build tools

2. **Configure Android Project**
   ```bash
   npx cap open android
   ```

3. **Update build.gradle (Module: app)**
   ```gradle
   android {
       compileSdkVersion 34
       defaultConfig {
           minSdkVersion 22
           targetSdkVersion 34
       }
   }
   ```

4. **Add Required Permissions**
   - Camera permission for barcode scanning
   - Storage permissions for file operations
   - Network permissions for API calls
   - Location permissions (if needed)

### 3.2 iOS Setup (macOS only)

1. **Install Xcode**
   - Download from Mac App Store
   - Install iOS SDK

2. **Open iOS Project**
   ```bash
   npx cap open ios
   ```

3. **Configure iOS Project**
   - Set development team in Xcode
   - Configure bundle identifier
   - Add required permissions in Info.plist

## Step 4: Development Workflow

### 4.1 Live Reload Development
```bash
# Android with live reload
npm run dev:mobile

# iOS with live reload
npm run dev:ios
```

### 4.2 Build for Production
```bash
# Build web assets and sync
npm run build:mobile

# Run on device
npm run android  # or npm run ios
```

## Step 5: Mobile-Specific Features

### 5.1 Barcode Scanning
- Native camera integration
- Multiple barcode format support
- Haptic feedback on successful scan

### 5.2 Push Notifications
- Local notifications for low stock alerts
- Background sync capabilities
- Custom notification actions

### 5.3 File Operations
- Export inventory data to device storage
- Import from device files
- Share functionality

### 5.4 Haptic Feedback
- Touch feedback for better UX
- Success/error vibrations
- Customizable intensity

## Step 6: Testing

### 6.1 Device Testing
```bash
# Test on Android device
npx cap run android --device

# Test on iOS device
npx cap run ios --device
```

### 6.2 Emulator Testing
```bash
# Android emulator
npx cap run android

# iOS simulator
npx cap run ios
```

## Step 7: Performance Optimization

### 7.1 Mobile-Specific Optimizations
- Reduced animation complexity
- Optimized touch targets (44px minimum)
- Efficient memory usage
- Battery optimization

### 7.2 Network Optimization
- Offline capability
- Request caching
- Background sync

## Step 8: Deployment

### 8.1 Android Deployment
1. Generate signed APK in Android Studio
2. Upload to Google Play Console
3. Configure app listing and metadata

### 8.2 iOS Deployment
1. Archive app in Xcode
2. Upload to App Store Connect
3. Submit for review

## Common Issues and Solutions

### Issue: Build Errors
**Solution:** Ensure all dependencies are installed and platforms are synced
```bash
npm install
npx cap sync
```

### Issue: Camera Not Working
**Solution:** Check permissions in AndroidManifest.xml and Info.plist

### Issue: Live Reload Not Working
**Solution:** Ensure device and development machine are on same network
```bash
npx cap run android --livereload --external --host=YOUR_IP
```

### Issue: App Crashes on Startup
**Solution:** Check native logs
```bash
# Android logs
npx cap run android --consolelogs

# iOS logs
npx cap run ios --consolelogs
```

## Mobile-Specific Considerations

### 1. Touch Interface
- All interactive elements have minimum 44px touch targets
- Haptic feedback for important actions
- Swipe gestures for navigation

### 2. Performance
- Optimized animations for mobile devices
- Efficient memory usage
- Battery-conscious background operations

### 3. Offline Support
- Local data caching
- Offline transaction queue
- Sync when connection restored

### 4. Security
- Secure storage for sensitive data
- Certificate pinning for API calls
- Biometric authentication (future enhancement)

## Next Steps

1. Test thoroughly on physical devices
2. Implement app store optimization (ASO)
3. Set up crash reporting and analytics
4. Plan for app updates and maintenance
5. Consider adding advanced features:
   - Biometric authentication
   - Advanced barcode formats
   - Bluetooth printer integration
   - Multi-store support

## Support Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [iOS Developer Guide](https://developer.apple.com/documentation)
- [StockSuite Mobile Support](mailto:support@stocksuite.com)