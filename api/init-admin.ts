import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { admins } from '../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

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
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ 
        message: 'DATABASE_URL environment variable is not set',
        success: false 
      });
    }

    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);

    // Check if admin already exists
    const existingAdmins = await db.select().from(admins).where(eq(admins.email, 'admin@otpguard.com')).limit(1);
    
    if (existingAdmins.length > 0) {
      return res.status(200).json({ 
        message: 'Admin user already exists',
        success: true,
        admin: {
          email: existingAdmins[0].email,
          created: false
        }
      });
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const newAdmin = await db.insert(admins).values({
      email: 'admin@otpguard.com',
      password: hashedPassword
    }).returning();

    res.status(200).json({
      message: 'Admin user created successfully',
      success: true,
      admin: {
        email: newAdmin[0].email,
        created: true
      }
    });

  } catch (error: any) {
    console.error('Init admin error:', error);
    res.status(500).json({ 
      message: `Database error: ${error.message}`,
      success: false,
      error: error.toString()
    });
  }
}
