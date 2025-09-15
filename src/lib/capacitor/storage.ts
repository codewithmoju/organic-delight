import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export class MobileStorageService {
  async saveFile(filename: string, data: string, directory: Directory = Directory.Documents): Promise<string> {
    if (!Capacitor.isNativePlatform()) {
      // Fallback to web download
      const blob = new Blob([data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      return filename;
    }

    try {
      const result = await Filesystem.writeFile({
        path: filename,
        data: data,
        directory: directory,
        encoding: Encoding.UTF8
      });

      return result.uri;
    } catch (error) {
      console.error('File save error:', error);
      throw error;
    }
  }

  async readFile(filename: string, directory: Directory = Directory.Documents): Promise<string> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('File reading is only available on native platforms');
    }

    try {
      const result = await Filesystem.readFile({
        path: filename,
        directory: directory,
        encoding: Encoding.UTF8
      });

      return result.data as string;
    } catch (error) {
      console.error('File read error:', error);
      throw error;
    }
  }

  async deleteFile(filename: string, directory: Directory = Directory.Documents): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await Filesystem.deleteFile({
        path: filename,
        directory: directory
      });
    } catch (error) {
      console.error('File delete error:', error);
      throw error;
    }
  }

  async exportInventoryData(data: any[]): Promise<string> {
    const csvContent = this.convertToCSV(data);
    const filename = `stocksuite-export-${new Date().toISOString().split('T')[0]}.csv`;
    
    return await this.saveFile(filename, csvContent);
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  }
}

export const mobileStorageService = new MobileStorageService();