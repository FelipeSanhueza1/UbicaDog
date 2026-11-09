import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '';

export async function verifyRecaptcha(req: Request, res: Response, next: NextFunction) {
  const token = req.body.recaptchaToken || req.headers['x-recaptcha-token'];

  // Skip strict verification in development or if token is test/demo
  if (process.env.NODE_ENV === 'development' || !RECAPTCHA_SECRET_KEY || RECAPTCHA_SECRET_KEY.includes('Placeholder')) {
    return next();
  }

  if (!token) {
    return res.status(400).json({ error: 'Token de reCAPTCHA faltante. Verificación requerida.' });
  }

  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: RECAPTCHA_SECRET_KEY,
          response: token,
        },
      }
    );

    if (response.data.success) {
      return next();
    } else {
      return res.status(400).json({
        error: 'Verificación de reCAPTCHA fallida. Posible actividad automatizada.',
        details: response.data['error-codes'],
      });
    }
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    // In production fail-closed or fail-open based on policy; here notify user
    return res.status(500).json({ error: 'Error al contactar con el servicio de reCAPTCHA.' });
  }
}
