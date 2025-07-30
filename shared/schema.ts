import { sql } from "drizzle-orm";
import { text, integer, pgTable, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Admin users table for the web portal
export const admins = pgTable("admins", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Users table for desktop app users
export const users = pgTable("users", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  macAddress: text("mac_address"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const countries = pgTable("countries", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull(),
  numberLength: integer("number_length").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const scripts = pgTable("scripts", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  appName: text("app_name").notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id),
  scriptId: text("script_id").notNull().references(() => scripts.id),
  countryId: text("country_id").notNull().references(() => countries.id),
  status: text("status").notNull(), // 'success', 'failed', 'running'
  otpProcessed: integer("otp_processed").default(0),
  errorMessage: text("error_message"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas
export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  macAddress: true,
  isActive: true,
});

export const insertCountrySchema = createInsertSchema(countries).omit({
  id: true,
  createdAt: true,
});

export const insertScriptSchema = createInsertSchema(scripts).omit({
  id: true,
  uploadedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  timestamp: true,
});

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerDeviceSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  macAddress: z.string().min(1),
});

export const downloadScriptSchema = z.object({
  scriptId: z.string(),
  countryId: z.string(),
  phoneNumbers: z.array(z.string()),
});

export const reportStatusSchema = z.object({
  taskId: z.string(),
  status: z.enum(['success', 'failed']),
  otpProcessed: z.number().min(0),
  errorMessage: z.string().optional(),
});

// Types
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Country = typeof countries.$inferSelect;
export type InsertCountry = z.infer<typeof insertCountrySchema>;
export type Script = typeof scripts.$inferSelect;
export type InsertScript = z.infer<typeof insertScriptSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterDeviceRequest = z.infer<typeof registerDeviceSchema>;
export type DownloadScriptRequest = z.infer<typeof downloadScriptSchema>;
export type ReportStatusRequest = z.infer<typeof reportStatusSchema>;
