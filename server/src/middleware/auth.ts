import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/prisma.js';
import { mapUser } from '../services/dbMappers.js';
import { User, Role } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ubicadog_super_secret_jwt_key_2025_secure';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: Role };
    const userRow = await prisma.user.findUnique({
      where: { id: decoded.id },
    });
    if (userRow) {
      req.user = mapUser(userRow);
    }
  } catch {
    // Invalid token or unavailable DB lookup: proceed unauthenticated; protected routes enforce requireAuth
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ code: 'UNAUTHORIZED', error: 'Acceso no autorizado. Debe iniciar sesión.' });
  }
  next();
}

export function requireRoles(roles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ code: 'UNAUTHORIZED', error: 'Acceso no autorizado.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ code: 'FORBIDDEN', error: 'Permisos insuficientes para acceder a este recurso.' });
    }
    next();
  };
}
