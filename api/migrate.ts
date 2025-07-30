import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
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

    const sqlClient = neon(process.env.DATABASE_URL);
    const db = drizzle(sqlClient);

    // Create tables if they don't exist
    await sqlClient`
      CREATE TABLE IF NOT EXISTS "admins" (
        "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" text NOT NULL UNIQUE,
        "password" text NOT NULL,
        "created_at" timestamp DEFAULT now()
      );
    `;

    await sqlClient`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" text NOT NULL UNIQUE,
        "password" text NOT NULL,
        "mac_address" text,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now()
      );
    `;

    await sqlClient`
      CREATE TABLE IF NOT EXISTS "countries" (
        "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" text NOT NULL,
        "code" text NOT NULL,
        "number_length" integer NOT NULL,
        "created_at" timestamp DEFAULT now()
      );
    `;

    await sqlClient`
      CREATE TABLE IF NOT EXISTS "scripts" (
        "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
        "app_name" text NOT NULL,
        "file_name" text NOT NULL,
        "file_path" text NOT NULL,
        "file_size" integer NOT NULL,
        "uploaded_at" timestamp DEFAULT now()
      );
    `;

    await sqlClient`
      CREATE TABLE IF NOT EXISTS "tasks" (
        "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" text NOT NULL,
        "script_id" text NOT NULL,
        "country_id" text NOT NULL,
        "status" text NOT NULL,
        "otp_processed" integer DEFAULT 0,
        "error_message" text,
        "timestamp" timestamp DEFAULT now()
      );
    `;

    // Check if admin exists, if not create one
    const existingAdmin = await sqlClient`
      SELECT * FROM admins WHERE email = 'admin@otpguard.com' LIMIT 1;
    `;

    let adminCreated = false;
    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await sqlClient`
        INSERT INTO admins (email, password) 
        VALUES ('admin@otpguard.com', ${hashedPassword});
      `;
      adminCreated = true;
    }

    // Add some sample countries if none exist
    const existingCountries = await sqlClient`SELECT COUNT(*) as count FROM countries;`;
    let countriesAdded = false;
    
    if (existingCountries[0].count === '0') {
      await sqlClient`
        INSERT INTO countries (name, code, number_length) VALUES
        ('United States', 'US', 10),
        ('United Kingdom', 'UK', 11),
        ('India', 'IN', 10),
        ('Canada', 'CA', 10),
        ('Australia', 'AU', 9),
        ('Germany', 'DE', 11),
        ('France', 'FR', 10),
        ('Japan', 'JP', 11),
        ('Brazil', 'BR', 11),
        ('Mexico', 'MX', 10);
      `;
      countriesAdded = true;
    }

    res.status(200).json({
      message: 'Database migration completed successfully',
      success: true,
      details: {
        adminCreated,
        countriesAdded,
        tablesCreated: true
      }
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    res.status(500).json({ 
      message: `Migration failed: ${error.message}`,
      success: false,
      error: error.toString()
    });
  }
}
