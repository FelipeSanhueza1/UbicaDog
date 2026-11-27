import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';

dotenv.config();

import authRoutes from './routes/authRoutes.js';
import petRoutes from './routes/petRoutes.js';
import sightingRoutes from './routes/sightingRoutes.js';
import stripeRoutes from './routes/stripeRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import veterinaryRoutes from './routes/veterinaryRoutes.js';
import storeRoutes from './routes/storeRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';

import { authMiddleware } from './middleware/auth.js';
import { initSocketService } from './services/socketService.js';
import { handleStripeWebhook } from './controllers/stripeController.js';
import { checkDatabaseHealth, prisma } from './services/prisma.js';
import { ensureSeedData } from './services/seed.js';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5001;

// Socket.io for Real-time Geofence Radar Waves
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

initSocketService(io);

// Middleware
app.use(cors({ origin: '*' }));

// Raw body parser specifically for Stripe Webhook before express.json and authMiddleware
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(express.json({ limit: '10mb' }));
app.use(authMiddleware);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/sightings', sightingRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/veterinaries', veterinaryRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

app.get('/api/health', async (req, res) => {
  const dbHealthy = await checkDatabaseHealth();
  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 'ONLINE' : 'DEGRADED',
    service: 'UbicaDog Backend Radar & Directory Engine',
    database: dbHealthy ? 'POSTGRESQL_CONNECTED' : 'POSTGRESQL_DISCONNECTED',
    timestamp: new Date().toISOString(),
  });
});

async function bootstrapDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ [Database] Variable DATABASE_URL no configurada. Define DATABASE_URL en .env o en Render.');
    return;
  }

  try {
    await prisma.$connect();
    await ensureSeedData();
    console.log('🗄️  [Database] PostgreSQL conectado y esquema sincronizado vía Prisma.');
  } catch (err) {
    console.error('❌ [Database] No se pudo conectar a PostgreSQL:', err);
    console.error('💡 Sugerencia local: ejecuta "docker compose up -d" en la raíz del proyecto.');
  }
}

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🐾 UbicaDog Server running on port ${PORT}`);
  console.log(`🛰️  Real-time Radar Socket.io active`);
  console.log(`🏥 Veterinary directory & OSM GPS search active`);
  console.log(`🛍️  Pet Store B2B plans active ($5.000 / $10.000)`);
  console.log(`💳 Stripe Subscriptions active`);
  console.log(`🛡️  Admin portal endpoints mounted at /api/admin`);
  console.log(`===============================================`);
  void bootstrapDatabase();
});
