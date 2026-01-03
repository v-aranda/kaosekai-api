import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcrypt';
import apiRoutes from './routes/api';
import { prisma } from './prisma';

// Load environment variables
dotenv.config();

// Validate critical environment variables early
const missingEnvs: string[] = [];
if (!process.env.JWT_SECRET) missingEnvs.push('JWT_SECRET');
if (!process.env.DATABASE_URL) missingEnvs.push('DATABASE_URL');

if (missingEnvs.length) {
  console.error(`Missing required environment variables: ${missingEnvs.join(', ')}`);
  console.error('Please set them in your environment or .env file.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 8000;

// Bootstrap a default admin so environments start usable without manual seeding
async function ensureDefaultAdmin(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'Admin';

  if (!adminEmail || !adminPassword) {
    console.warn('Admin bootstrap skipped: ADMIN_EMAIL or ADMIN_PASSWORD not set.');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  if (!existing) {
    await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log(`Default admin created: ${adminEmail}`);
    return;
  }

  await prisma.user.update({
    where: { id: existing.id },
    data: {
      name: adminName,
      role: 'ADMIN',
      password: hashedPassword,
    },
  });
  console.log(`Default admin ensured and password refreshed: ${adminEmail}`);
}

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without origin (mobile apps, curl) or if origin is permitted
    const allowAll = allowedOrigins.length === 0 || allowedOrigins.includes('*');
    if (!origin || allowAll || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked for:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files with permissive CORS so PDF.js/embeds can fetch from any origin
app.use('/uploads', cors({ origin: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Kaosekai API - Node.js/Express',
    version: '1.0.0',
    endpoints: {
      health: '/api',
      auth: {
        register: 'POST /api/register',
        login: 'POST /api/login',
        logout: 'POST /api/logout (protected)',
        user: 'GET /api/user (protected)',
      },
      characters: {
        list: 'GET /api/characters (protected)',
        create: 'POST /api/characters (protected)',
        show: 'GET /api/characters/:id (protected)',
        update: 'PUT/PATCH /api/characters/:id (protected)',
        delete: 'DELETE /api/characters/:id (protected)',
      },
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Error:', err);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API documentation: http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  ensureDefaultAdmin().catch((err) => console.error('Admin bootstrap error:', err));
});
