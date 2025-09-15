import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export class HapticsService {
  async impact(style: ImpactStyle = ImpactStyle.Medium): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await Haptics.impact({ style });
    } catch (error) {
      console.error('Haptics impact error:', error);
    }
  }

  async notification(type: NotificationType = NotificationType.Success): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await Haptics.notification({ type });
    } catch (error) {
      console.error('Haptics notification error:', error);
    }
  }

  async vibrate(duration: number = 300): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      // Fallback to web vibration API
      if ('vibrate' in navigator) {
        navigator.vibrate(duration);
      }
      return;
    }

    try {
      await Haptics.vibrate({ duration });
    } catch (error) {
      console.error('Haptics vibrate error:', error);
    }
  }

  // Convenience methods for common interactions
  async lightTap(): Promise<void> {
    await this.impact(ImpactStyle.Light);
  }

  async mediumTap(): Promise<void> {
    await this.impact(ImpactStyle.Medium);
  }

  async heavyTap(): Promise<void> {
    await this.impact(ImpactStyle.Heavy);
  }

  async successFeedback(): Promise<void> {
    await this.notification(NotificationType.Success);
  }

  async warningFeedback(): Promise<void> {
    await this.notification(NotificationType.Warning);
  }

  async errorFeedback(): Promise<void> {
    await this.notification(NotificationType.Error);
  }
}

export const hapticsService = new HapticsService();