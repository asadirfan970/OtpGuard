import { 
  type Admin, 
  type InsertAdmin, 
  type User, 
  type InsertUser,
  type Country,
  type InsertCountry,
  type Script,
  type InsertScript,
  type Task,
  type InsertTask,
  admins,
  users,
  countries,
  scripts,
  tasks
} from "@shared/schema";
import { randomUUID } from "crypto";
import { eq, sql, like } from "drizzle-orm";
import { db } from "./database";

export interface IStorage {
  // Admin operations
  getAdmin(id: string): Promise<Admin | undefined>;
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;

  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserMacAddress(id: string, macAddress: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Country operations
  getAllCountries(): Promise<Country[]>;
  getCountry(id: string): Promise<Country | undefined>;
  createCountry(country: InsertCountry): Promise<Country>;
  updateCountry(id: string, updates: Partial<Country>): Promise<Country | undefined>;
  deleteCountry(id: string): Promise<boolean>;

  // Script operations
  getAllScripts(): Promise<Script[]>;
  getScript(id: string): Promise<Script | undefined>;
  createScript(script: InsertScript): Promise<Script>;
  updateScript(id: string, updates: Partial<Script>): Promise<Script | undefined>;
  deleteScript(id: string): Promise<boolean>;

  // Task operations
  getAllTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined>;
  getTasksByUser(userId: string): Promise<Task[]>;
  
  // Stats
  getStats(): Promise<{
    totalUsers: number;
    activeScripts: number;
    countries: number;
    tasksToday: number;
  }>;
}

export class SQLiteStorage implements IStorage {
  // Admin operations
  async getAdmin(id: string): Promise<Admin | undefined> {
    try {
      const result = await db.select().from(admins).where(eq(admins.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting admin:', error);
      return undefined;
    }
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    try {
      const result = await db.select().from(admins).where(eq(admins.email, email));
      return result[0];
    } catch (error) {
      console.error('Error getting admin by email:', error);
      return undefined;
    }
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    try {
      const result = await db.insert(admins).values(insertAdmin).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating admin:', error);
      throw error;
    }
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email));
      return result[0];
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const result = await db.insert(users).values(insertUser).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUserMacAddress(id: string, macAddress: string): Promise<User | undefined> {
    try {
      const result = await db.update(users)
        .set({ macAddress })
        .where(eq(users.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating user MAC address:', error);
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await db.select().from(users);
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    try {
      const result = await db.update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const result = await db.delete(users).where(eq(users.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Country operations
  async getAllCountries(): Promise<Country[]> {
    try {
      return await db.select().from(countries);
    } catch (error) {
      console.error('Error getting all countries:', error);
      return [];
    }
  }

  async getCountry(id: string): Promise<Country | undefined> {
    try {
      const result = await db.select().from(countries).where(eq(countries.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting country:', error);
      return undefined;
    }
  }

  async createCountry(insertCountry: InsertCountry): Promise<Country> {
    try {
      const result = await db.insert(countries).values(insertCountry).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating country:', error);
      throw error;
    }
  }

  async updateCountry(id: string, updates: Partial<Country>): Promise<Country | undefined> {
    try {
      const result = await db.update(countries)
        .set(updates)
        .where(eq(countries.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating country:', error);
      return undefined;
    }
  }

  async deleteCountry(id: string): Promise<boolean> {
    try {
      const result = await db.delete(countries).where(eq(countries.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting country:', error);
      return false;
    }
  }

  // Script operations
  async getAllScripts(): Promise<Script[]> {
    try {
      return await db.select().from(scripts);
    } catch (error) {
      console.error('Error getting all scripts:', error);
      return [];
    }
  }

  async getScript(id: string): Promise<Script | undefined> {
    try {
      const result = await db.select().from(scripts).where(eq(scripts.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting script:', error);
      return undefined;
    }
  }

  async createScript(insertScript: InsertScript): Promise<Script> {
    try {
      const result = await db.insert(scripts).values(insertScript).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating script:', error);
      throw error;
    }
  }

  async updateScript(id: string, updates: Partial<Script>): Promise<Script | undefined> {
    try {
      const result = await db.update(scripts)
        .set(updates)
        .where(eq(scripts.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating script:', error);
      return undefined;
    }
  }

  async deleteScript(id: string): Promise<boolean> {
    try {
      const result = await db.delete(scripts).where(eq(scripts.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting script:', error);
      return false;
    }
  }

  // Task operations
  async getAllTasks(): Promise<Task[]> {
    try {
      return await db.select().from(tasks);
    } catch (error) {
      console.error('Error getting all tasks:', error);
      return [];
    }
  }

  async getTask(id: string): Promise<Task | undefined> {
    try {
      const result = await db.select().from(tasks).where(eq(tasks.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting task:', error);
      return undefined;
    }
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    try {
      const result = await db.insert(tasks).values(insertTask).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    try {
      const result = await db.update(tasks)
        .set(updates)
        .where(eq(tasks.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating task:', error);
      return undefined;
    }
  }

  async getTasksByUser(userId: string): Promise<Task[]> {
    try {
      const result = await db.select().from(tasks).where(eq(tasks.userId, userId));
      return result;
    } catch (error) {
      console.error('Error getting tasks by user:', error);
      return [];
    }
  }

  async getStats(): Promise<{
    totalUsers: number;
    activeScripts: number;
    countries: number;
    tasksToday: number;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const userCount = await db.select().from(users);
      const scriptCount = await db.select().from(scripts);
      const countryCount = await db.select().from(countries);
      const todayTasks = await db.select().from(tasks).where(
        sql`DATE(${tasks.timestamp}) = ${today}`
      );

      return {
        totalUsers: userCount.length,
        activeScripts: scriptCount.length,
        countries: countryCount.length,
        tasksToday: todayTasks.length
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalUsers: 0,
        activeScripts: 0,
        countries: 0,
        tasksToday: 0
      };
    }
  }
}

export const storage = new SQLiteStorage();
