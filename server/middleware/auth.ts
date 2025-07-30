import { Request, Response, NextFunction } from 'express';
import '../types';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    type: 'admin' | 'user';
  };
}

// Simple session-based auth - just check if logged in as admin
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // For simplicity, we'll use a simple session check
  const isAdmin = req.session?.isAdmin;
  const userId = req.session?.userId;
  
  if (!isAdmin && !userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  req.user = {
    id: isAdmin ? 'admin' : userId || '',
    email: isAdmin ? 'admin@example.com' : req.session?.userEmail || '',
    type: isAdmin ? 'admin' : 'user'
  };
  
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.session?.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

export function requireUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(403).json({ message: 'User access required' });
  }
  next();
}
