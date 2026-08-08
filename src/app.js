const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const pinoHttp = require('pino-http');

const env = require('./config/env');
const logger = require('./common/utils/logger');
const routes = require('./routes');
const notFound = require('./common/middlewares/notFound');
const errorHandler = require('./common/middlewares/errorHandler');
const { generalLimiter } = require('./common/middlewares/rateLimiter');

const app = express();

// --- Security & parsing middleware (order matters) ---
app.use(helmet());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      if (
        env.corsOrigins.includes(origin) ||
        origin.includes('localhost') ||
        origin.includes('.vercel.app')
      ) {
        return callback(null, true);
      }
      
      return callback(new Error('CORS not allowed'), false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Structured request logging in all envs, human-readable console log only outside production
app.use(pinoHttp({ logger }));
if (env.nodeEnv !== 'production') {
  app.use(morgan('dev'));
}

// General rate limiting (auth endpoints have their own stricter limiter)
app.use('/api', generalLimiter);

// --- Health check and Root route ---
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Welcome to EvaLens Backend API', data: null, error: null });
});

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok' }, error: null });
});

const connectDB = require('./config/db');

// --- Ensure DB connection for Serverless environments ---
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// --- API routes ---
app.use('/api/v1', routes);

// --- 404 + centralized error handling (must be LAST) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
