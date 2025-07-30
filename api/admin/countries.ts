import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { countries } from '../../shared/schema';
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
    // Verify JWT token for admin operations (POST, PUT, DELETE)
    if (['POST', 'PUT', 'DELETE'].includes(req.method || '')) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization token required' });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'otp-automation-secret') as any;
      
      if (!decoded.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }
    }

    // Initialize database connection
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: 'Database not configured' });
    }

    const db = drizzle(neon(process.env.DATABASE_URL));

    switch (req.method) {
      case 'GET':
        const allCountries = await db.select().from(countries);
        return res.status(200).json(allCountries);

      case 'POST':
        const { name, code, numberLength } = req.body;
        if (!name || !code || !numberLength) {
          return res.status(400).json({ message: 'Name, code, and numberLength are required' });
        }

        const newCountry = await db.insert(countries).values({
          name,
          code,
          numberLength
        }).returning();

        return res.status(201).json(newCountry[0]);

      case 'PUT':
        const countryId = req.url?.split('/').pop();
        if (!countryId) {
          return res.status(400).json({ message: 'Country ID is required' });
        }

        const updates = req.body;
        const updatedCountry = await db.update(countries)
          .set(updates)
          .where(eq(countries.id, countryId))
          .returning();

        if (updatedCountry.length === 0) {
          return res.status(404).json({ message: 'Country not found' });
        }

        return res.status(200).json(updatedCountry[0]);

      case 'DELETE':
        const deleteCountryId = req.url?.split('/').pop();
        if (!deleteCountryId) {
          return res.status(400).json({ message: 'Country ID is required' });
        }

        const deleteResult = await db.delete(countries).where(eq(countries.id, deleteCountryId));
        return res.status(200).json({ success: true });

      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error: any) {
    console.error('Countries API error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}
