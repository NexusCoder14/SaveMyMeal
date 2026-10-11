/**
 * SaveMyMeal - Main Server
 * Module D: Backend & Database Foundation
 * Runs independently on port 3001 with CORS for React (port 5173 / 3000)
 */

const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');
const listingsRouter = require('./listings');
const reservationsRouter = require('./reservations');

const app = express();
const PORT = process.env.PORT || 3001;

// Allowed frontend origins (Vite React: 5173, CRA: 3000)
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.CORS_ALLOW_ALL === 'true') {
      return callback(null, true);
    }
    // Allow any localhost dev port
    if (/^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request bodies
app.use(express.json());

// Handle malformed JSON safely without dumping raw errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload received in request body'
    });
  }
  next(err);
});

// Request logger for clear debugging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// API Base / Health
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SaveMyMeal Backend REST API (Module D) is running',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      listings: {
        browse: 'GET /api/listings',
        getById: 'GET /api/listings/:id',
        create: 'POST /api/listings',
        update: 'PATCH /api/listings/:id',
        delete: 'DELETE /api/listings/:id'
      },
      reservations: {
        view: 'GET /api/reservations',
        create: 'POST /api/reservations',
        updateOrCancel: 'PATCH /api/reservations/:id'
      }
    }
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// Mount Module D REST routers under /api
app.use('/api/listings', listingsRouter);
app.use('/api/reservations', reservationsRouter);

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
});

// Global 500 error handler (sanitized output)
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred'
  });
});

// Server boot loader
let serverInstance;
async function startServer(port = PORT) {
  try {
    await initDatabase();
    return new Promise((resolve) => {
      serverInstance = app.listen(port, () => {
        console.log('==================================================');
        console.log(` SaveMyMeal Backend (Module D) running:`);
        console.log(` http://localhost:${port}`);
        console.log(` CORS configured for React dev: http://localhost:5173`);
        console.log('==================================================');
        resolve(serverInstance);
      });
    });
  } catch (error) {
    console.error('Failed to initialize database and start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
