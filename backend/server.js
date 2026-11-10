require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const createCorsOptions = require('./config/corsOptions');

const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const healthRoutes = require('./routes/healthRoutes');
const contactRoutes = require('./routes/contactRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// 1. Security Headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", 'http://localhost:*', 'http://127.0.0.1:*'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// 2. CORS Configuration
app.use(cors(createCorsOptions({
  frontendUrl: process.env.FRONTEND_URL || '',
  environment: process.env.NODE_ENV,
  port: PORT,
})));

// 3. Body parsers & cookies
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// 4. Rate Limiting for general API
app.use('/api', apiLimiter);

// 5. Mount API Routes
app.use('/api/health', healthRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/portfolio', portfolioRoutes);

// Static uploads path
const uploadsPath = path.join(__dirname, 'public', 'uploads');
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(uploadsPath));

// 6. Serve Admin Dashboard Static Frontend
const adminStaticPath = path.join(__dirname, 'public', 'admin');
app.use('/admin', express.static(adminStaticPath));

// Fallback for Admin SPA routing
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(adminStaticPath, 'index.html'));
});

// 7. Serve Portfolio Frontend Root Static Files
const portfolioRootPath = path.join(__dirname, '..');
app.use(express.static(portfolioRootPath));

// Fallback route to serve portfolio index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(portfolioRootPath, 'index.html'));
});

// 8. 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// 9. Centralized Error Handler
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(` [SAJITH // DEV] Backend running on port ${PORT}`);
  console.log(` Environment:     ${process.env.NODE_ENV || 'development'}`);
  console.log(` Health Check:    http://localhost:${PORT}/api/health`);
  console.log(` Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`======================================================\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[System] SIGTERM received. Closing server gracefully...');
  server.close(() => {
    console.log('[System] Server closed.');
    process.exit(0);
  });
});

module.exports = app;
