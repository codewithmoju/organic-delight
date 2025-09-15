import { 
  PushNotifications, 
  PushNotificationSchema, 
  ActionPerformed,
  Token 
} from '@capacitor/push-notifications';
import { 
  LocalNotifications, 
  LocalNotificationSchema 
} from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export class NotificationService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform() || this.isInitialized) return;

    try {
      // Request permission for push notifications
      const permission = await PushNotifications.requestPermissions();
      
      if (permission.receive === 'granted') {
        // Register for push notifications
        await PushNotifications.register();

        // Listen for registration
        PushNotifications.addListener('registration', (token: Token) => {
          console.log('Push registration success, token: ' + token.value);
          // Send token to your server
          this.sendTokenToServer(token.value);
        });

        // Listen for registration errors
        PushNotifications.addListener('registrationError', (error: any) => {
          console.error('Push registration error: ', error);
        });

        // Listen for push notifications
        PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
          console.log('Push received: ', notification);
          this.handlePushNotification(notification);
        });

        // Listen for notification actions
        PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
          console.log('Push action performed: ', notification);
          this.handleNotificationAction(notification);
        });
      }

      // Request permission for local notifications
      await LocalNotifications.requestPermissions();

      this.isInitialized = true;
    } catch (error) {
      console.error('Notification initialization error:', error);
    }
  }

  async sendLocalNotification(notification: {
    title: string;
    body: string;
    id?: number;
    schedule?: Date;
    sound?: string;
    attachments?: any[];
    actionTypeId?: string;
    extra?: any;
  }): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      // Fallback to web notifications
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.body,
          icon: '/stocksuite-favicon.svg'
        });
      }
      return;
    }

    try {
      const localNotification: LocalNotificationSchema = {
        title: notification.title,
        body: notification.body,
        id: notification.id || Date.now(),
        schedule: notification.schedule ? { at: notification.schedule } : undefined,
        sound: notification.sound,
        attachments: notification.attachments,
        actionTypeId: notification.actionTypeId,
        extra: notification.extra
      };

      await LocalNotifications.schedule({
        notifications: [localNotification]
      });
    } catch (error) {
      console.error('Local notification error:', error);
    }
  }

  async sendLowStockAlert(itemName: string, currentStock: number, reorderPoint: number): Promise<void> {
    await this.sendLocalNotification({
      title: 'Low Stock Alert',
      body: `${itemName} is running low (${currentStock} remaining, reorder at ${reorderPoint})`,
      extra: {
        type: 'low_stock',
        itemName,
        currentStock,
        reorderPoint
      }
    });
  }

  async sendTransactionNotification(type: 'stock_in' | 'stock_out', itemName: string, quantity: number): Promise<void> {
    const title = type === 'stock_in' ? 'Stock Added' : 'Stock Removed';
    const body = `${quantity} units of ${itemName} ${type === 'stock_in' ? 'added to' : 'removed from'} inventory`;

    await this.sendLocalNotification({
      title,
      body,
      extra: {
        type: 'transaction',
        transactionType: type,
        itemName,
        quantity
      }
    });
  }

  private async sendTokenToServer(token: string): Promise<void> {
    try {
      // Send the token to your backend server
      // This would typically be an API call to store the token
      console.log('Sending push token to server:', token);
      
      // Example API call:
      // await fetch('/api/push-tokens', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ token, userId: currentUser.uid })
      // });
    } catch (error) {
      console.error('Error sending token to server:', error);
    }
  }

  private handlePushNotification(notification: PushNotificationSchema): void {
    // Handle incoming push notification
    console.log('Handling push notification:', notification);
    
    // You can show a local notification or update the UI
    if (notification.data?.type === 'low_stock') {
      // Navigate to stock levels page or show alert
    }
  }

  private handleNotificationAction(action: ActionPerformed): void {
    // Handle notification tap/action
    console.log('Handling notification action:', action);
    
    // Navigate to relevant page based on notification type
    const notificationType = action.notification.data?.type;
    
    switch (notificationType) {
      case 'low_stock':
        // Navigate to stock levels
        window.location.href = '/stock-levels';
        break;
      case 'transaction':
        // Navigate to transactions
        window.location.href = '/transactions';
        break;
      default:
        // Navigate to dashboard
        window.location.href = '/';
    }
  }
}

export const notificationService = new NotificationService();