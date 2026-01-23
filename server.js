const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const apiRoutes = require('./routes/api');
const { requestLogger, errorLogger } = require('./middleware/logger');

const app = express();
const PORT = process.env.PORT || 3000;
const REQUEST_TIMEOUT_MS = 90000; // 90 seconds (longer than Claude's 60s timeout)

// Validate required environment variables on startup
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}
if (!process.env.API_SECRET_KEY) {
  console.error('ERROR: API_SECRET_KEY environment variable is required');
  process.exit(1);
}

// Security headers
app.use(helmet());

// CORS - restrict to allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['https://voicesnap.app', 'https://www.voicesnap.app'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-api-key']
}));

// Rate limiting - prevent abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limit for AI endpoints (expensive operations)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 AI requests per minute
  message: { error: 'Too many AI requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiters
app.use('/api', apiLimiter);

// Apply stricter rate limit to AI endpoints (expensive Claude API calls)
const aiEndpoints = [
  '/api/summary', '/api/bullets', '/api/notes', '/api/flashcards',
  '/api/quiz', '/api/action-items', '/api/highlights', '/api/chat',
  '/api/paraphrase', '/api/translate', '/api/faq', '/api/mindmap',
  '/api/punctuation', '/api/formal', '/api/casual'
];
aiEndpoints.forEach(endpoint => {
  app.use(endpoint, aiLimiter);
});

// Request timeout middleware - prevent slow loris attacks
app.use((req, res, next) => {
  req.setTimeout(REQUEST_TIMEOUT_MS, () => {
    if (!res.headersSent) {
      res.status(408).json({
        error: 'Request timeout',
        code: 'REQUEST_TIMEOUT',
        retryable: true
      });
    }
  });
  res.setTimeout(REQUEST_TIMEOUT_MS);
  next();
});

// Parse JSON with 10mb limit for long transcripts
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'VoiceSnap API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api', apiRoutes);

// Error logging middleware (must be before error handler)
app.use(errorLogger);

// Global error handling middleware
app.use((err, req, res, next) => {
  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS error: Origin not allowed',
      code: 'CORS_ERROR'
    });
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON in request body',
      code: 'INVALID_JSON'
    });
  }

  // Handle payload too large
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Request payload too large. Maximum size is 10MB.',
      code: 'PAYLOAD_TOO_LARGE'
    });
  }

  // Default error response
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    retryable: statusCode >= 500
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    console.warn('WARNING: Running in development mode. Set NODE_ENV=production for production.');
  }
});

// Graceful shutdown handlers
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  server.close((err) => {
    if (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
    console.log('Server closed. Exiting process.');
    process.exit(0);
  });

  // Force shutdown after 30 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
