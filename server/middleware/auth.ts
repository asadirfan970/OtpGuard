import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import '../types';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    type: 'admin' | 'user';
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// JWT-based authentication for serverless compatibility
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Check for JWT token in Authorization header or session (fallback for development)
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    // In development, fallback to session-based auth
    if (!token && process.env.NODE_ENV !== 'production') {
      const isAdmin = req.session?.isAdmin;
      const userId = req.session?.userId;
      
      if (!isAdmin && !userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      req.user = {
        id: isAdmin ? 'admin' : userId || '',
        email: isAdmin ? req.session?.adminEmail || 'admin@example.com' : req.session?.userEmail || '',
        type: isAdmin ? 'admin' : 'user'
      };
      
      return next();
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      type: decoded.type
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid authentication token' });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user?.type !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

export function requireUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user?.type !== 'user') {
    return res.status(403).json({ message: 'User access required' });
  }
  next();
}

export function generateToken(user: { id: string; email: string; type: 'admin' | 'user' }): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
}
