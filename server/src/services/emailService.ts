/**
 * Email Service for UbicaDog
 * Handles registration welcome emails, alerts, and verification messages
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'UbicaDog <contacto@ubicadog.com>',
          to: [to],
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('⚠️ [Email Service] Error enviando correo vía Resend:', errorData);
        return false;
      }
      console.log(`✅ [Email Service] Correo enviado exitosamente vía Resend a ${to}`);
      return true;
    } catch (err) {
      console.error('⚠️ [Email Service] Fallo de conexión enviando email:', err);
      return false;
    }
  }

  // Development / Staging simulation log
  console.log('----------------------------------------------------');
  console.log(`📨 [Email Service - Simulación Segura]`);
  console.log(`Para: ${to}`);
  console.log(`Asunto: ${subject}`);
  console.log(`Estado: Correo de Bienvenida y Verificación emitido.`);
  console.log('----------------------------------------------------');
  return true;
}

/**
 * Sends a welcome email when a new user registers
 */
export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  const subject = '🐾 ¡Bienvenido a UbicaDog! Tu cuenta ha sido creada con éxito';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
          .header { background: linear-gradient(135deg, #2563EB, #1D4ED8); padding: 36px 24px; text-align: center; color: white; }
          .content { padding: 32px 28px; line-height: 1.6; }
          .card { background-color: #eff6ff; border-left: 4px solid #2563EB; padding: 16px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background-color: #2563EB; color: #ffffff !important; padding: 12px 28px; border-radius: 50px; text-decoration: none; font-weight: bold; margin: 20px 0; }
          .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🐾 UbicaDog</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">Red Georreferenciada de Rescate y Protección Animal</p>
          </div>
          <div class="content">
            <h2>¡Hola, ${name}! 👋</h2>
            <p>Te damos una cálida bienvenida a la comunidad de <strong>UbicaDog</strong>. Tu cuenta ha sido registrada y verificada exitosamente.</p>
            
            <div class="card">
              <h4 style="margin: 0 0 8px 0; color: #1e40af;">¿Qué puedes hacer ahora?</h4>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Registrar a tu mascota</strong> con foto, características y punto de anclaje de hogar.</li>
                <li><strong>Generar su Placa QR inteligente</strong> para que quien la encuentre pueda contactarte de inmediato.</li>
                <li><strong>Reportar avistamientos callejeros</strong> en segundos para ayudar a reunir mascotas perdidas.</li>
                <li><strong>Consultar el radar comunitario</strong> y clínicas veterinarias de urgencia 24h.</li>
              </ul>
            </div>

            <p style="text-align: center;">
              <a href="${process.env.CLIENT_URL || 'https://ubicadog.vercel.app'}" class="button">Entrar a Mi Cuenta</a>
            </p>

            <p style="font-size: 13px; color: #64748b;">Si no fuiste tú quien creó esta cuenta, puedes desestimar este mensaje de forma segura.</p>
          </div>
          <div class="footer">
            UbicaDog • Protegiendo a nuestras mascotas con tecnología comunitaria.<br>
            Chile • 2026
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}
