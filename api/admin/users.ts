import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
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

    switch (req.method) {
      case 'GET':
        const allUsers = await db.select().from(users);
        return res.status(200).json(allUsers);

      case 'POST':
        const { email, password } = req.body;
        if (!email || !password) {
          return res.status(400).json({ message: 'Email and password are required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await db.insert(users).values({
          email,
          password: hashedPassword
        }).returning();

        return res.status(201).json(newUser[0]);

      case 'PUT':
        const userId = req.url?.split('/').pop();
        if (!userId) {
          return res.status(400).json({ message: 'User ID is required' });
        }

        const updates = req.body;
        if (updates.password) {
          updates.password = await bcrypt.hash(updates.password, 10);
        }

        const updatedUser = await db.update(users)
          .set(updates)
          .where(eq(users.id, userId))
          .returning();

        if (updatedUser.length === 0) {
          return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json(updatedUser[0]);

      case 'DELETE':
        const deleteUserId = req.url?.split('/').pop();
        if (!deleteUserId) {
          return res.status(400).json({ message: 'User ID is required' });
        }

        const deleteResult = await db.delete(users).where(eq(users.id, deleteUserId));
        return res.status(200).json({ success: true });

      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error: any) {
    console.error('Users API error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}
