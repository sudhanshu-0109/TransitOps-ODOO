require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const driverRoutes = require('./routes/driver.routes');
const tripRoutes = require('./routes/trip.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');
const fuelRoutes = require('./routes/fuel.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const notificationRoutes = require('./routes/notification.routes');
const copilotRoutes = require('./routes/copilot.routes');
const seedRoutes = require('./routes/seed.routes');

const app = express();

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
  credentials: true,
}));

// ─── Parsing ─────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Logging ─────────────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/vehicles', vehicleRoutes);
app.use('/api/v1/drivers', driverRoutes);
app.use('/api/v1/trips', tripRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);
app.use('/api/v1', fuelRoutes);           // /api/v1/fuel-logs, /api/v1/expenses
app.use('/api/v1', analyticsRoutes);       // /api/v1/dashboard, /api/v1/analytics
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/copilot', copilotRoutes);
app.use('/api/v1/seed', seedRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found.` } });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
