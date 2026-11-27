import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/prisma.js';
import { mapUser, sanitizeUser } from '../services/dbMappers.js';
import { isValidCoordinates } from '../services/geoService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User } from '../types/index.js';
import { sendWelcomeEmail } from '../services/emailService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ubicadog_super_secret_jwt_key_2025_secure';

function generateToken(user: Pick<User, 'id' | 'email' | 'role' | 'name'>): string {
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
      return res.status(400).json({ code: 'MISSING_FIELDS', error: 'Todos los campos obligatorios deben completarse.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({ code: 'EMAIL_EXISTS', error: 'Ya existe una cuenta registrada con este correo electrónico.' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const createdRow = await prisma.user.create({
      data: {
        id: `usr_${Date.now()}`,
        email: normalizedEmail,
        password: passwordHash,
        name: String(name).trim(),
        phone: phone ? String(phone).trim() : null,
        role: 'user',
        subscriptionTier: 'free',
        avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(String(name).trim())}`,
      },
    });

    const newUser = mapUser(createdRow);

    // Send welcome & confirmation email asynchronously (does not block response)
    sendWelcomeEmail(newUser.email, newUser.name).catch((err) => {
      console.warn('Could not send welcome email:', err);
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'Usuario registrado exitosamente en UbicaDog.',
      user: sanitizeUser(newUser),
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Error interno en el servidor.' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ code: 'MISSING_FIELDS', error: 'Correo y contraseña son requeridos.' });
    }

    const userRow = await prisma.user.findFirst({
      where: { email: { equals: String(email).trim(), mode: 'insensitive' } },
    });

    if (!userRow || !userRow.password) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', error: 'Credenciales inválidas.' });
    }

    const isValid = await bcrypt.compare(String(password), userRow.password);
    if (!isValid) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', error: 'Credenciales inválidas.' });
    }

    const user = mapUser(userRow);
    const token = generateToken(user);

    return res.json({
      message: 'Inicio de sesión exitoso.',
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Error al iniciar sesión.' });
  }
}

export async function employeeLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ code: 'MISSING_FIELDS', error: 'Credenciales de empleado incompletas.' });
    }

    const userRow = await prisma.user.findFirst({
      where: { email: { equals: String(email).trim(), mode: 'insensitive' } },
    });

    if (!userRow || !userRow.password) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', error: 'Acceso denegado: Empleado no registrado en el sistema.' });
    }

    if (userRow.role !== 'employee' && userRow.role !== 'admin') {
      return res.status(403).json({ code: 'FORBIDDEN', error: 'Esta cuenta no posee rango de empleado o administrador corporativo.' });
    }

    const isValid = await bcrypt.compare(String(password), userRow.password);
    if (!isValid) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', error: 'Credenciales corporativas inválidas.' });
    }

    const user = mapUser(userRow);
    const token = generateToken(user);

    return res.json({
      message: 'Autenticación corporativa autorizada.',
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    console.error('Employee login error:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Error en acceso corporativo.' });
  }
}

export async function googleLogin(req: Request, res: Response) {
  try {
    const { email, name, avatarUrl, googleId } = req.body;

    if (!email) {
      return res.status(400).json({ code: 'MISSING_FIELDS', error: 'Datos de Google incompletos.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    let userRow = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!userRow) {
      userRow = await prisma.user.create({
        data: {
          id: `usr_g_${Date.now()}`,
          email: normalizedEmail,
          name: name || 'Usuario Google',
          avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
          googleId: googleId ?? null,
          role: 'user',
          subscriptionTier: 'free',
        },
      });
    } else if (googleId || (avatarUrl && !userRow.avatarUrl)) {
      userRow = await prisma.user.update({
        where: { id: userRow.id },
        data: {
          googleId: googleId ?? userRow.googleId,
          avatarUrl: !userRow.avatarUrl && avatarUrl ? avatarUrl : userRow.avatarUrl,
        },
      });
    }

    const user = mapUser(userRow);
    const token = generateToken(user);

    return res.json({
      message: 'Autenticación con Google exitosa.',
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Error al procesar login con Google.' });
  }
}

export function getProfile(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ code: 'UNAUTHORIZED', error: 'No autenticado.' });
  }
  return res.json({ user: sanitizeUser(req.user) });
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ code: 'UNAUTHORIZED', error: 'No autenticado.' });
    }

    const {
      name,
      email,
      phone,
      avatarUrl,
      homeAddress,
      homeLatitude,
      homeLongitude,
      currentPassword,
      newPassword,
    } = req.body;

    const currentRow = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!currentRow) {
      return res.status(404).json({ code: 'NOT_FOUND', error: 'Usuario no encontrado en la base de datos.' });
    }

    const updateData: {
      email?: string;
      password?: string;
      name?: string;
      phone?: string | null;
      avatarUrl?: string;
      homeAddress?: string | null;
      homeLatitude?: number | null;
      homeLongitude?: number | null;
    } = {};

    // Handle email change if requested
    if (email && String(email).trim().toLowerCase() !== currentRow.email.toLowerCase()) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({ code: 'INVALID_EMAIL', error: 'El formato de correo electrónico no es válido.' });
      }
      const existingUser = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          id: { not: currentRow.id },
        },
      });
      if (existingUser) {
        return res.status(409).json({ code: 'EMAIL_EXISTS', error: 'Ese correo electrónico ya está registrado por otra cuenta.' });
      }
      updateData.email = normalizedEmail;
    }

    // Handle password change if requested
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ code: 'MISSING_FIELDS', error: 'Debes ingresar tu contraseña actual para cambiarla.' });
      }
      if (currentRow.password) {
        const isMatch = await bcrypt.compare(String(currentPassword), currentRow.password);
        if (!isMatch) {
          return res.status(400).json({ code: 'INVALID_PASSWORD', error: 'La contraseña actual ingresada es incorrecta.' });
        }
      }
      if (String(newPassword).length < 6) {
        return res.status(400).json({ code: 'WEAK_PASSWORD', error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      }
      updateData.password = await bcrypt.hash(String(newPassword), 10);
    }

    if (homeLatitude !== undefined || homeLongitude !== undefined) {
      const latNum = homeLatitude !== undefined && homeLatitude !== null ? Number(homeLatitude) : currentRow.homeLatitude;
      const lngNum = homeLongitude !== undefined && homeLongitude !== null ? Number(homeLongitude) : currentRow.homeLongitude;
      if (latNum !== null && lngNum !== null && !isValidCoordinates(latNum, lngNum)) {
        return res.status(400).json({ code: 'INVALID_COORDINATES', error: 'Coordenadas de hogar fuera de rango válido.' });
      }
      if (homeLatitude !== undefined) updateData.homeLatitude = homeLatitude === null ? null : Number(homeLatitude);
      if (homeLongitude !== undefined) updateData.homeLongitude = homeLongitude === null ? null : Number(homeLongitude);
    }

    if (name) updateData.name = String(name).trim();
    if (phone !== undefined) updateData.phone = phone ? String(phone).trim() : null;
    if (avatarUrl) updateData.avatarUrl = String(avatarUrl);
    if (homeAddress !== undefined) updateData.homeAddress = homeAddress ? String(homeAddress) : null;

    const updatedRow = await prisma.user.update({
      where: { id: currentRow.id },
      data: updateData,
    });

    const user = mapUser(updatedRow);
    const token = generateToken(user);

    return res.json({
      message: 'Perfil de usuario actualizado exitosamente.',
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Error al actualizar el perfil de usuario.' });
  }
}
