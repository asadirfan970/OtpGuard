import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export class FileService {
  private static SCRIPTS_DIR = path.join(process.cwd(), 'uploads', 'scripts');
  private static TEMP_DIR = path.join(process.cwd(), 'temp');

  static async ensureDirectories() {
    await fs.mkdir(this.SCRIPTS_DIR, { recursive: true });
    await fs.mkdir(this.TEMP_DIR, { recursive: true });
  }

  static async saveScript(buffer: Buffer, originalName: string): Promise<{ filePath: string; fileName: string; fileSize: number }> {
    await this.ensureDirectories();
    
    const fileName = `${randomUUID()}_${originalName}`;
    const filePath = path.join(this.SCRIPTS_DIR, fileName);
    
    await fs.writeFile(filePath, buffer);
    const stats = await fs.stat(filePath);
    
    return {
      filePath,
      fileName: originalName,
      fileSize: stats.size
    };
  }

  static async readScript(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }

  static async deleteScript(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File doesn't exist, ignore
    }
  }

  static async createTempFile(content: string, extension: string = '.py'): Promise<string> {
    await this.ensureDirectories();
    
    const fileName = `${randomUUID()}${extension}`;
    const filePath = path.join(this.TEMP_DIR, fileName);
    
    await fs.writeFile(filePath, content);
    return filePath;
  }

  static async deleteTempFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File doesn't exist, ignore
    }
  }
}
