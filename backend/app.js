const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

// Import all routes
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const leadRoutes = require('./routes/leadRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const taskRoutes = require('./routes/taskRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

app.set('trust proxy', 1);

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Allowed Frontend Origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4000',
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  'https://darling-pasca-1cb4ec.netlify.app',
].filter(Boolean);

// CORS Configuration
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Content-Length',
      'X-Requested-With',
    ],
    exposedHeaders: ['Content-Disposition'],
  })
);

// Static Files
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Other Middleware
app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());
app.use(compression());

// Development Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ==========================================
// GENERAL API RATE LIMITER
// ==========================================

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,

  // Auth routes use their own dedicated limiter
  skip: (req) => /^\/(?:v1\/)?auth(?:\/|$)/i.test(req.path),

  message: {
    success: false,
    message: 'Too many API requests from this IP. Please try again later.',
  },
});

app.use('/api', limiter);

// ==========================================
// AUTH RATE LIMITER
// ==========================================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
});

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ==========================================
// API V1 ROUTES
// ==========================================

const API = '/api/v1';

app.use(`${API}/auth`, authLimiter, authRoutes);
app.use(`${API}/customers`, customerRoutes);
app.use(`${API}/leads`, leadRoutes);
app.use(`${API}/quotations`, quotationRoutes);
app.use(`${API}/invoices`, invoiceRoutes);
app.use(`${API}/attendance`, attendanceRoutes);
app.use(`${API}/payroll`, payrollRoutes);
app.use(`${API}/tasks`, taskRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/settings`, settingsRoutes);
app.use(`${API}/leaves`, leaveRoutes);
app.use(`${API}/dashboard`, dashboardRoutes);
app.use(`${API}/employees`, employeeRoutes);

// ==========================================
// BACKWARD-COMPATIBLE API ROUTES
// ==========================================

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/employees', employeeRoutes);

// ==========================================
// 404 HANDLER
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use(errorMiddleware);

module.exports = app;