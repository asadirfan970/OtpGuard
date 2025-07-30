import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { scripts } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Verify JWT token for admin operations
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'otp-automation-secret') as any;
    
    if (!decoded.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Initialize database connection
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: 'Database not configured' });
    }

    const db = drizzle(neon(process.env.DATABASE_URL));

    switch (req.method) {
      case 'GET':
        const allScripts = await db.select().from(scripts);
        return res.status(200).json(allScripts);

      case 'POST':
        // For file uploads, we'll need to handle this differently in serverless
        // This is a simplified version - in production, you'd use a file upload service
        const { appName, fileName, filePath, fileSize } = req.body;
        if (!appName || !fileName || !filePath || !fileSize) {
          return res.status(400).json({ message: 'App name, file name, file path, and file size are required' });
        }

        const newScript = await db.insert(scripts).values({
          appName,
          fileName,
          filePath,
          fileSize
        }).returning();

        return res.status(201).json(newScript[0]);

      case 'DELETE':
        const scriptId = req.url?.split('/').pop();
        if (!scriptId) {
          return res.status(400).json({ message: 'Script ID is required' });
        }

        const deleteResult = await db.delete(scripts).where(eq(scripts.id, scriptId));
        return res.status(200).json({ success: true });

      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error: any) {
    console.error('Scripts API error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}
