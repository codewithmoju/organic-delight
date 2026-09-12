import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

const FIREBASE_HOSTING_URL = 'https://stocksuit.web.app';
let isChecking = false;

async function checkAndApplyUpdate() {
  if (!Capacitor.isNativePlatform() || isChecking) return;
  isChecking = true;

  try {
    // Notify CapacitorUpdater that the current web view bundle loaded successfully
    try {
      await CapacitorUpdater.notifyAppReady();
    } catch (e) {
      console.warn('[OTA] notifyAppReady warning:', e);
    }

    // Fetch the version.json from Firebase Hosting
    const response = await fetch(`${FIREBASE_HOSTING_URL}/ota/version.json?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.warn(`[OTA] Version check returned status ${response.status}`);
      return;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      console.warn('[OTA] Version check returned non-JSON content');
      return;
    }

    const latest = await response.json();
    if (!latest || !latest.version) {
      console.warn('[OTA] Invalid version payload');
      return;
    }

    // Get current bundle version on device
    const currentInfo = await CapacitorUpdater.current();
    const currentVersion = currentInfo?.bundle?.version || '1.0.0';

    console.log(`[OTA] Device version: ${currentVersion} | Server version: ${latest.version}`);

    if (latest.version !== currentVersion) {
      console.log(`[OTA] New update found: ${latest.version}. Downloading...`);
      toast.info(`Downloading update (${latest.version})...`, { duration: 4000 });

      const downloadUrl = latest.url && latest.url.startsWith('http')
        ? latest.url
        : `${FIREBASE_HOSTING_URL}${latest.url || `/ota/${latest.version}.zip`}`;

      const downloadRes = await CapacitorUpdater.download({
        url: downloadUrl,
        version: latest.version,
      });

      console.log('[OTA] Download complete. Applying bundle id:', downloadRes.id);
      toast.success('Update ready. Restarting app to apply...', { duration: 3000 });

      setTimeout(async () => {
        try {
          await CapacitorUpdater.set({ id: downloadRes.id });
        } catch (setErr) {
          console.error('[OTA] Failed to activate update:', setErr);
        }
      }, 2500);
    }
  } catch (error) {
    console.error('[OTA] Update check failed:', error);
  } finally {
    isChecking = false;
  }
}

export function initOTAUpdater() {
  if (!Capacitor.isNativePlatform()) return;

  // Check immediately on startup
  checkAndApplyUpdate();

  // Also check whenever user switches back to the app from background
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkAndApplyUpdate();
    }
  });
}
