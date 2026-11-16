'use strict';

// 1. Load and validate environment variables BEFORE anything else is required.
require('dotenv').config({ quiet: true });

const REQUIRED_ENV = [
  'PORT',
  'DB_HOST',
  'DB_USER',
  'DB_NAME',
  'JWT_SECRET',
  'FRONTEND_URL',
  'NODE_ENV',
];

const missing = REQUIRED_ENV.filter((key) => !process.env[key] || process.env[key].trim() === '');
if (missing.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}
// DB_PASSWORD may legitimately be empty (local root), but it must be defined.
if (process.env.DB_PASSWORD === undefined) {
  console.error('FATAL: DB_PASSWORD must be defined in .env (it may be empty for local development)');
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 64) {
  console.error('FATAL: JWT_SECRET must be at least 64 characters long');
  process.exit(1);
}
if (!/^\d+$/.test(process.env.PORT) || Number(process.env.PORT) < 1 || Number(process.env.PORT) > 65535) {
  console.error('FATAL: PORT must be a number between 1 and 65535');
  process.exit(1);
}
if (!['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
  console.error('FATAL: NODE_ENV must be one of: development, production, test');
  process.exit(1);
}
// FRONTEND_URL may hold several comma-separated origins (e.g. the landing page
// and the admin dashboard): "http://localhost:3000,http://localhost:5173".
const ALLOWED_ORIGINS = process.env.FRONTEND_URL.split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => {
    try {
      return new URL(s).origin;
    } catch (e) {
      console.error(`FATAL: FRONTEND_URL contains an invalid URL: "${s}"`);
      return process.exit(1);
    }
  });
if (ALLOWED_ORIGINS.length === 0) {
  console.error('FATAL: FRONTEND_URL must contain at least one URL, e.g. http://localhost:3000');
  process.exit(1);
}

const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { testConnection } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/auth');
const workshopRoutes = require('./routes/workshop');
const enquiryRoutes = require('./routes/enquiries');
const statsRoutes = require('./routes/stats');
const testimonialRoutes = require('./routes/testimonials');
const faqRoutes = require('./routes/faq');
const curriculumRoutes = require('./routes/curriculum');
const galleryRoutes = require('./routes/gallery');
const eventRoutes = require('./routes/events');

const app = express();
app.disable('x-powered-by');
// Requests arrive via the landing server's proxy (/api rewrite) on the same machine.
app.set('trust proxy', 'loopback');

// Make sure upload folders exist (also creates the private temp dir).
['portrait', 'gallery', 'logos'].forEach((dir) =>
  fs.mkdirSync(path.join(__dirname, 'uploads', dir), { recursive: true })
);
fs.mkdirSync(path.join(__dirname, 'tmp'), { recursive: true });

// 2. Security headers. Images in /uploads are loaded cross-origin by the
//    frontend, so the resource policy must be "cross-origin".
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// 3. CORS — only the configured frontend origin. Compare origins, so a
//    trailing slash in FRONTEND_URL doesn't break matching.
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  })
);

// 4. Global rate limit: 100 requests / 15 min / IP.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'production' ? 100 : 5000, // generous in dev: SSR + admin share one IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
app.use(globalLimiter);

// Stricter limit on auth routes: 10 requests / 15 min / IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'production' ? 10 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later' },
});

// 5. Body parsing with a small limit.
app.use(express.json({ limit: '10kb' }));

// 6. Static uploads.
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), { dotfiles: 'deny', index: false, maxAge: '7d' })
);

// 7. Routes.
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));
// After any successful admin change, ask the landing site to rebuild its cached page right away.
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && !req.path.startsWith('/api/auth') && !req.path.startsWith('/api/enquiries')) {
    res.on('finish', () => {
      const secret = process.env.REVALIDATE_SECRET;
      if (res.statusCode >= 400 || !secret) return;
      const base = process.env.LANDING_URL || 'http://localhost:3000';
      fetch(`${base}/revalidate?secret=${encodeURIComponent(secret)}`, { method: 'POST' }).catch(() => {});
    });
  }
  next();
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/workshop', workshopRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/enquiries', enquiryRoutes);

// 8. 404 + global error handler (must be last).
app.use(notFound);
app.use(errorHandler);

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

async function start() {
  try {
    await testConnection();
    console.log(`MySQL connected (${process.env.DB_HOST}/${process.env.DB_NAME})`);
  } catch (err) {
    console.error('FATAL: Could not connect to MySQL:', err.message);
    process.exit(1);
  }

  app.listen(Number(process.env.PORT), () => {
    console.log(`API running on port ${process.env.PORT} [${process.env.NODE_ENV}]`);
  });
}

start();
