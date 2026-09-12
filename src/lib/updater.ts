import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

// Firebase project ID can be fetched from config or hardcoded if known.
// You MUST set your Firebase hosting URL here!
const FIREBASE_HOSTING_URL = 'https://stocksuit.web.app'; // Replace with actual URL or use window.location.origin if it's dynamic, but native apps don't have window.location.origin pointing to firebase.

export async function initOTAUpdater() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Notify CapacitorUpdater that the app has successfully started.
    // This is required so it knows the current update didn't crash.
    await CapacitorUpdater.notifyAppReady();

    // Fetch the version.json from your Firebase Hosting
    const response = await fetch(`${FIREBASE_HOSTING_URL}/ota/version.json?t=${Date.now()}`);
    if (!response.ok) return;
    
    const latestVersion = await response.json();
    
    // Get current version running on the device
    const currentInfo = await CapacitorUpdater.current();
    const currentVersion = currentInfo.bundle.version || '1.0.0';

    if (latestVersion.version !== currentVersion) {
      toast.info(`Downloading update ${latestVersion.version}...`);
      
      const downloadRes = await CapacitorUpdater.download({
        url: `${FIREBASE_HOSTING_URL}/ota/${latestVersion.version}.zip`,
        version: latestVersion.version,
      });
      
      toast.success('Update downloaded. Restarting app to apply...', { duration: 3000 });
      
      // Delay slightly to let the user see the toast, then set the new version
      setTimeout(async () => {
        await CapacitorUpdater.set({ id: downloadRes.id });
      }, 3000);
    }
  } catch (error) {
    console.error('OTA Update failed:', error);
  }
}
