import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { store } from '../services/store.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User, Role } from '../types/index.js';
import { sendWelcomeEmail } from '../services/emailService.js';

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
    store.save();

    // Send welcome & confirmation email asynchronously (does not block response)
    sendWelcomeEmail(newUser.email, newUser.name).catch((err) => {
      console.warn('Could not send welcome email:', err);
    });

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

    store.save();

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

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado.' });
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

    const user = store.users.find((u) => u.id === req.user?.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado en la base de datos.' });
    }

    // Handle email change if requested
    if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: 'El formato de correo electrónico no es válido.' });
      }
      const existingUser = store.users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.id !== user.id
      );
      if (existingUser) {
        return res.status(409).json({ error: 'Ese correo electrónico ya está registrado por otra cuenta.' });
      }
      user.email = email.trim().toLowerCase();
    }

    // Handle password change if requested
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Debes ingresar tu contraseña actual para cambiarla.' });
      }
      if (user.password) {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({ error: 'La contraseña actual ingresada es incorrecta.' });
        }
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (avatarUrl) user.avatarUrl = avatarUrl;
    if (homeAddress !== undefined) user.homeAddress = homeAddress;
    if (homeLatitude !== undefined) user.homeLatitude = Number(homeLatitude);
    if (homeLongitude !== undefined) user.homeLongitude = Number(homeLongitude);

    store.save();

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      message: 'Perfil de usuario actualizado exitosamente.',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar el perfil de usuario.' });
  }
}
