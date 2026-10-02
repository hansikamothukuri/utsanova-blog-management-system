import './config/env.js'; // must stay first: loads .env before any backend module reads env
import express from 'express';
import cors from 'cors';
import { initDB } from './config/db.js';
import { initFirebaseAdmin } from './config/firebase.js';
import publicBlogRoutes from './routes/publicBlogRoutes.js';
import adminBlogRoutes from './routes/adminBlogRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Initialize Database connection & Firebase Admin
initDB().catch((err) => console.error('[DB Init Error]:', err));
initFirebaseAdmin();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}

if (process.env.APP_URL) {
  allowedOrigins.push(process.env.APP_URL);
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Global Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    project: 'Utsanova Blog Management System',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes according to SRS specification
app.use('/api/auth', authRoutes);
app.use('/api/blogs', publicBlogRoutes);
app.use('/api/admin/blogs', adminBlogRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/ai', aiRoutes);

// 404 & Centralized Error Handlers
app.use('/api/*', notFoundHandler);
app.use(errorHandler);

export default app;
