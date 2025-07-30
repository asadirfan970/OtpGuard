import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { countries, scripts } from '../shared/schema';
import { eq } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function seedData() {
  try {
    console.log('Seeding sample data...');
    
    // Sample countries data
    const sampleCountries = [
      { name: 'United States', code: '+1', numberLength: 10 },
      { name: 'United Kingdom', code: '+44', numberLength: 10 },
      { name: 'Canada', code: '+1', numberLength: 10 },
      { name: 'Germany', code: '+49', numberLength: 11 },
      { name: 'France', code: '+33', numberLength: 9 },
      { name: 'Australia', code: '+61', numberLength: 9 },
      { name: 'India', code: '+91', numberLength: 10 },
      { name: 'Japan', code: '+81', numberLength: 10 }
    ];
    
    // Insert countries (skip if already exists)
    for (const country of sampleCountries) {
      const existing = await db.select().from(countries).where(eq(countries.name, country.name)).limit(1);
      if (existing.length === 0) {
        await db.insert(countries).values(country);
        console.log(`Added country: ${country.name}`);
      }
    }
    
    // Sample scripts data
    const sampleScripts = [
      {
        appName: 'WhatsApp',
        fileName: 'whatsapp_automation.py',
        filePath: '/scripts/whatsapp_automation.py',
        fileSize: 2048
      },
      {
        appName: 'Telegram',
        fileName: 'telegram_automation.py',
        filePath: '/scripts/telegram_automation.py',
        fileSize: 1856
      },
      {
        appName: 'Signal',
        fileName: 'signal_automation.py',
        filePath: '/scripts/signal_automation.py',
        fileSize: 1792
      },
      {
        appName: 'Viber',
        fileName: 'viber_automation.py',
        filePath: '/scripts/viber_automation.py',
        fileSize: 1920
      }
    ];
    
    // Insert scripts (skip if already exists)
    for (const script of sampleScripts) {
      const existing = await db.select().from(scripts).where(eq(scripts.appName, script.appName)).limit(1);
      if (existing.length === 0) {
        await db.insert(scripts).values(script);
        console.log(`Added script: ${script.appName}`);
      }
    }
    
    console.log('Sample data seeded successfully!');
    
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
