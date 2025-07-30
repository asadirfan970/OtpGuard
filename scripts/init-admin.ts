import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { admins } from '../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function initializeAdmin() {
  try {
    console.log('Initializing admin account...');
    
    // Check if admin already exists
    const existingAdmin = await db.select().from(admins).where(eq(admins.email, 'admin@otpguard.com')).limit(1);
    
    if (existingAdmin.length > 0) {
      console.log('Admin account already exists');
      return;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin account
    await db.insert(admins).values({
      email: 'admin@otpguard.com',
      password: hashedPassword,
    });
    
    console.log('Admin account created successfully');
    console.log('Email: admin@otpguard.com');
    console.log('Password: admin123');
    console.log('Please change the password after first login');
    
  } catch (error) {
    console.error('Error initializing admin:', error);
    process.exit(1);
  }
}

initializeAdmin();
