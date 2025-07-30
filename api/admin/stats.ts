import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users, scripts, countries, tasks } from '../../shared/schema';
import { sql } from 'drizzle-orm';
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

    // Get stats
    const today = new Date().toISOString().split('T')[0];
    
    const userCount = await db.select().from(users);
    const scriptCount = await db.select().from(scripts);
    const countryCount = await db.select().from(countries);
    const todayTasks = await db.select().from(tasks).where(
      sql`DATE(${tasks.timestamp}) = ${today}`
    );

    const stats = {
      totalUsers: userCount.length,
      activeScripts: scriptCount.length,
      countries: countryCount.length,
      tasksToday: todayTasks.length
    };

    res.status(200).json(stats);

  } catch (error: any) {
    console.error('Stats error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}
