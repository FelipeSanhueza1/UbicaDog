import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { store } from '../services/store.js';
import { User, Role } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ubicadog_super_secret_jwt_key_2025_secure';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: Role };
    const user = store.users.find((u) => u.id === decoded.id);
    if (user) {
      req.user = user;
    }
  } catch (err) {
    // Invalid token, proceed unauthenticated
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Acceso no autorizado. Debe iniciar sesión.' });
  }
  next();
}

export function requireRoles(roles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Acceso no autorizado.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permisos insuficientes para acceder a este recurso.' });
    }
    next();
  };
}
