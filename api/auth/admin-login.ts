import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { admins } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Initialize database connection
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: 'Database not configured' });
    }

    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);

    // Check if admin exists
    const adminResults = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
    const admin = adminResults[0];

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: admin.id, 
        email: admin.email, 
        isAdmin: true 
      },
      process.env.SESSION_SECRET || 'otp-automation-secret',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email
      },
      token
    });

  } catch (error: any) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
