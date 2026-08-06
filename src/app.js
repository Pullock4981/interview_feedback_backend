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
    origin: env.corsOrigins,
    credentials: true, // required so the httpOnly refresh-token cookie is sent/received
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

// --- Health check (useful for container/orchestration probes) ---
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok' }, error: null });
});

// --- API routes ---
app.use('/api/v1', routes);

// --- 404 + centralized error handling (must be LAST) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
