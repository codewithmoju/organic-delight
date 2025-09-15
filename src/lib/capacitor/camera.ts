import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface CameraOptions {
  quality?: number;
  allowEditing?: boolean;
  resultType?: CameraResultType;
  source?: CameraSource;
  width?: number;
  height?: number;
}

export class CameraService {
  async takePicture(options: CameraOptions = {}): Promise<Photo | null> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Camera is only available on native platforms');
    }

    try {
      const defaultOptions: CameraOptions = {
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 1024,
        height: 1024
      };

      const photo = await Camera.getPhoto({
        ...defaultOptions,
        ...options
      });

      return photo;
    } catch (error) {
      console.error('Camera error:', error);
      throw error;
    }
  }

  async selectFromGallery(options: CameraOptions = {}): Promise<Photo | null> {
    return this.takePicture({
      ...options,
      source: CameraSource.Photos
    });
  }

  async checkPermissions() {
    if (!Capacitor.isNativePlatform()) {
      return { camera: 'granted', photos: 'granted' };
    }

    try {
      const permissions = await Camera.checkPermissions();
      return permissions;
    } catch (error) {
      console.error('Camera permissions error:', error);
      return { camera: 'denied', photos: 'denied' };
    }
  }

  async requestPermissions() {
    if (!Capacitor.isNativePlatform()) {
      return { camera: 'granted', photos: 'granted' };
    }

    try {
      const permissions = await Camera.requestPermissions();
      return permissions;
    } catch (error) {
      console.error('Camera permissions request error:', error);
      throw error;
    }
  }
}

export const cameraService = new CameraService();