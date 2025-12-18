import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';

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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


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
});
