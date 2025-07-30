import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { tasks, users, scripts, countries } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify JWT token
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

    // Get all tasks
    const allTasks = await db.select().from(tasks);

    // Enrich tasks with user, script, and country information
    const enrichedTasks = await Promise.all(allTasks.map(async (task) => {
      const [user, script, country] = await Promise.all([
        db.select().from(users).where(eq(users.id, task.userId)).limit(1),
        db.select().from(scripts).where(eq(scripts.id, task.scriptId)).limit(1),
        db.select().from(countries).where(eq(countries.id, task.countryId)).limit(1)
      ]);

      return {
        ...task,
        userEmail: user[0]?.email || 'Unknown',
        scriptName: script[0]?.appName || 'Unknown',
        countryName: country[0]?.name || 'Unknown'
      };
    }));

    res.status(200).json(enrichedTasks);

  } catch (error: any) {
    console.error('Tasks API error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}
