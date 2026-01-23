/**
 * Request logging middleware for VoiceSnap API
 * Logs all incoming requests with timing and response status
 */

// Generate a unique request ID
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Format duration in a human-readable way
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// Mask sensitive data in request body
function maskSensitiveData(body) {
  if (!body) return body;

  const masked = { ...body };

  // Mask long transcripts (show length instead)
  if (masked.transcript && typeof masked.transcript === 'string') {
    masked.transcript = `[${masked.transcript.length} chars]`;
  }

  // Mask any potential sensitive fields
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
  for (const field of sensitiveFields) {
    if (masked[field]) {
      masked[field] = '[REDACTED]';
    }
  }

  return masked;
}

// Log levels
const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

// Format log entry
function formatLog(level, requestId, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    requestId,
    message,
    ...data
  };

  // In production, you might send this to a logging service
  // For now, output as JSON for easy parsing
  return JSON.stringify(logEntry);
}

/**
 * Request logging middleware
 */
function requestLogger(req, res, next) {
  // Generate unique request ID
  const requestId = generateRequestId();
  req.requestId = requestId;

  // Add request ID to response headers for tracing
  res.setHeader('X-Request-ID', requestId);

  // Capture start time
  const startTime = Date.now();

  // Get client IP (handle proxies)
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || 'unknown';

  // Log incoming request
  console.log(formatLog(LOG_LEVELS.INFO, requestId, 'Incoming request', {
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    body: req.method !== 'GET' ? maskSensitiveData(req.body) : undefined,
    clientIP,
    userAgent: req.headers['user-agent']?.substring(0, 100)
  }));

  // Capture original end function to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    // Calculate duration
    const duration = Date.now() - startTime;

    // Determine log level based on status code
    let level = LOG_LEVELS.INFO;
    if (res.statusCode >= 400 && res.statusCode < 500) {
      level = LOG_LEVELS.WARN;
    } else if (res.statusCode >= 500) {
      level = LOG_LEVELS.ERROR;
    }

    // Log response
    console.log(formatLog(level, requestId, 'Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: formatDuration(duration),
      durationMs: duration,
      contentLength: res.getHeader('content-length')
    }));

    // Log slow requests as warnings
    if (duration > 5000) {
      console.log(formatLog(LOG_LEVELS.WARN, requestId, 'Slow request detected', {
        path: req.path,
        duration: formatDuration(duration)
      }));
    }

    // Call original end
    originalEnd.call(this, chunk, encoding);
  };

  next();
}

/**
 * Error logging middleware (should be used after routes)
 */
function errorLogger(err, req, res, next) {
  const requestId = req.requestId || 'unknown';

  console.log(formatLog(LOG_LEVELS.ERROR, requestId, 'Unhandled error', {
    error: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    path: req.path,
    method: req.method
  }));

  next(err);
}

/**
 * Log API analytics (called from routes for specific events)
 */
function logAnalytics(requestId, event, data = {}) {
  console.log(formatLog(LOG_LEVELS.INFO, requestId, event, data));
}

module.exports = {
  requestLogger,
  errorLogger,
  logAnalytics,
  LOG_LEVELS
};
