const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 60000, // 60 second timeout
});

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

// Custom error class for better error handling
class ClaudeAPIError extends Error {
  constructor(message, code, isRetryable = false) {
    super(message);
    this.name = 'ClaudeAPIError';
    this.code = code;
    this.isRetryable = isRetryable;
  }
}

// Sleep helper for retry delays
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Determine if an error is retryable
function isRetryableError(error) {
  // Retry on rate limits, timeouts, and server errors
  if (error.status === 429) return true; // Rate limited
  if (error.status >= 500) return true; // Server errors
  if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') return true;
  if (error.message?.includes('timeout')) return true;
  return false;
}

async function callClaude(prompt, maxTokens = 1024) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      // Validate response structure
      if (!response.content || !Array.isArray(response.content) || response.content.length === 0) {
        throw new ClaudeAPIError('Invalid response structure from Claude', 'INVALID_RESPONSE', false);
      }

      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent || typeof textContent.text !== 'string') {
        throw new ClaudeAPIError('No text content in Claude response', 'NO_TEXT_CONTENT', false);
      }

      return textContent.text;
    } catch (error) {
      lastError = error;

      // Don't retry non-retryable errors
      if (error instanceof ClaudeAPIError && !error.isRetryable) {
        throw error;
      }

      // Check if error is retryable
      if (!isRetryableError(error)) {
        break;
      }

      // Don't retry on last attempt
      if (attempt === MAX_RETRIES) {
        break;
      }

      // Exponential backoff with jitter
      const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 500;
      console.log(`Claude API attempt ${attempt} failed, retrying in ${Math.round(delay)}ms...`);
      await sleep(delay);
    }
  }

  // Categorize the final error
  if (lastError.status === 429) {
    throw new ClaudeAPIError('Rate limit exceeded. Please try again later.', 'RATE_LIMITED', true);
  }
  if (lastError.status === 401) {
    throw new ClaudeAPIError('API authentication failed', 'AUTH_FAILED', false);
  }
  if (lastError.status >= 500) {
    throw new ClaudeAPIError('Claude service temporarily unavailable', 'SERVICE_UNAVAILABLE', true);
  }
  if (lastError.message?.includes('timeout')) {
    throw new ClaudeAPIError('Request timed out. Please try again.', 'TIMEOUT', true);
  }

  console.error('Claude API error:', lastError);
  throw new ClaudeAPIError(`Claude API error: ${lastError.message}`, 'UNKNOWN_ERROR', false);
}

module.exports = { callClaude, ClaudeAPIError };
