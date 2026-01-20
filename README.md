# VoiceSnap Backend API

AI-powered transcription and voice notes API for the VoiceSnap iOS app.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `API_SECRET_KEY` - Secret key for API authentication
- `PORT` - Server port (optional, defaults to 3000)

3. Start the server:
```bash
npm start
```

## Authentication

All `/api` endpoints require the `x-api-key` header with your `API_SECRET_KEY`.

## Endpoints

| Method | Endpoint | Description | Response Key |
|--------|----------|-------------|--------------|
| GET | / | Health check | status, message, timestamp |
| POST | /api/notes | Structured notes | notes |
| POST | /api/summary | Summary | summary |
| POST | /api/chat | AI chat (requires question) | answer |
| POST | /api/quiz | Quiz questions | questions |
| POST | /api/flashcards | Flashcards | flashcards |
| POST | /api/mindmap | Mind map | mindmap |
| POST | /api/bullets | Bullet points | bullets |
| POST | /api/paraphrase | Paraphrase | paraphrased |
| POST | /api/highlights | Key highlights | highlights |
| POST | /api/faq | FAQ | faqs |
| POST | /api/punctuation | Add punctuation | punctuated |
| POST | /api/formal | Formal tone | formal |
| POST | /api/casual | Casual tone | casual |

## Request Body

All POST endpoints (except /api/chat):
```json
{ "transcript": "Your transcript text here" }
```

/api/chat:
```json
{ "transcript": "Your transcript", "question": "Your question" }
```

## Example Responses

### /api/summary
```json
{
  "summary": "The meeting covered three main topics..."
}
```

### /api/flashcards
```json
{
  "flashcards": [
    { "front": "What is X?", "back": "X is..." }
  ]
}
```

### /api/quiz
```json
{
  "questions": [
    {
      "question": "What was discussed?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0
    }
  ]
}
```

### /api/mindmap
```json
{
  "mindmap": {
    "center": "Main Topic",
    "branches": [
      { "topic": "Branch 1", "subtopics": ["A", "B"] }
    ]
  }
}
```

### /api/highlights
```json
{
  "highlights": ["Quote 1", "Quote 2", "Quote 3"]
}
```

### /api/faq
```json
{
  "faqs": [
    { "question": "What is X?", "answer": "X is..." }
  ]
}
```

## Error Handling

All endpoints return errors in this format:
```json
{
  "error": "Error message description"
}
```

HTTP Status Codes:
- `200` - Success
- `400` - Bad Request (missing required fields)
- `401` - Unauthorized (invalid API key)
- `500` - Internal Server Error

## Deployment

This API is deployed on Render.com with environment variables:
- `ANTHROPIC_API_KEY`
- `API_SECRET_KEY`

Live URL: https://voicesnap-backend-a8ec.onrender.com
