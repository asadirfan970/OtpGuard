import 'express-session';

declare module 'express-session' {
  interface SessionData {
    isAdmin?: boolean;
    adminEmail?: string;
    userId?: string;
    userEmail?: string;
  }
}