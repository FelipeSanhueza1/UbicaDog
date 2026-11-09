import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { store } from '../services/store.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User, Role } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ubicadog_super_secret_jwt_key_2025_secure';

function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Todos los campos obligatorios deben completarse.' });
    }

    const existingUser = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({ error: 'Ya existe una cuenta registrada con este correo electrónico.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser: User = {
      id: `usr_${Date.now()}`,
      email: email.toLowerCase(),
      password: passwordHash,
      name,
      phone,
      role: 'user',
      subscriptionTier: 'free',
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
      createdAt: new Date().toISOString(),
    };

    store.users.push(newUser);

    const token = generateToken(newUser);
    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      message: 'Usuario registrado exitosamente en UbicaDog.',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error interno en el servidor.' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son requeridos.' });
    }

    const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      message: 'Inicio de sesión exitoso.',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al iniciar sesión.' });
  }
}

export async function employeeLogin(req: Request, res: Response) {
  try {
    const { email, password, employeeCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Credenciales de empleado incompletas.' });
    }

    const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Acceso denegado: Empleado no registrado en el sistema.' });
    }

    if (user.role !== 'employee' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Esta cuenta no posee rango de empleado o administrador corporativo.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales corporativas inválidas.' });
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      message: 'Autenticación corporativa autorizada.',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error en acceso corporativo.' });
  }
}

export async function googleLogin(req: Request, res: Response) {
  try {
    const { email, name, avatarUrl, googleId } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Datos de Google incompletos.' });
    }

    let user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Register through Google
      user = {
        id: `usr_g_${Date.now()}`,
        email: email.toLowerCase(),
        name: name || 'Usuario Google',
        avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
        googleId,
        role: 'user',
        subscriptionTier: 'free',
        createdAt: new Date().toISOString(),
      };
      store.users.push(user);
    } else {
      if (googleId) user.googleId = googleId;
      if (avatarUrl && !user.avatarUrl) user.avatarUrl = avatarUrl;
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      message: 'Autenticación con Google exitosa.',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al procesar login con Google.' });
  }
}

export function getProfile(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado.' });
  }
  const { password: _, ...userWithoutPassword } = req.user;
  return res.json({ user: userWithoutPassword });
}
