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

### Health Check

```
GET /
```

Response:
```json
{
  "status": "ok",
  "message": "VoiceSnap API is running",
  "timestamp": "2024-01-19T12:00:00.000Z"
}
```

---

### POST /api/summary

Generate a concise summary of a transcript.

**Request:**
```json
{
  "transcript": "Your transcript text here..."
}
```

**Response:**
```json
{
  "summary": "A 3-5 paragraph summary of the transcript..."
}
```

---

### POST /api/bullets

Convert transcript to bullet points.

**Request:**
```json
{
  "transcript": "Your transcript text here..."
}
```

**Response:**
```json
{
  "bullets": "• Key point 1\n• Key point 2\n..."
}
```

---

### POST /api/notes

Transform transcript into structured notes with headers.

**Request:**
```json
{
  "transcript": "Your transcript text here..."
}
```

**Response:**
```json
{
  "notes": "# Main Topic\n\n## Section 1\n..."
}
```

---

### POST /api/flashcards

Create study flashcards from transcript.

**Request:**
```json
{
  "transcript": "Your transcript text here..."
}
```

**Response:**
```json
{
  "flashcards": [
    {
      "front": "What is X?",
      "back": "X is defined as..."
    }
  ]
}
```

---

### POST /api/quiz

Generate multiple choice quiz questions.

**Request:**
```json
{
  "transcript": "Your transcript text here..."
}
```

**Response:**
```json
{
  "questions": [
    {
      "question": "What was the main topic discussed?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0
    }
  ]
}
```

---

### POST /api/action-items

Extract action items and tasks from transcript.

**Request:**
```json
{
  "transcript": "Your transcript text here..."
}
```

**Response:**
```json
{
  "actionItems": [
    {
      "task": "Complete the report",
      "assignee": "John",
      "deadline": "Friday"
    }
  ]
}
```

---

### POST /api/highlights

Extract key quotes and important moments.

**Request:**
```json
{
  "transcript": "Your transcript text here..."
}
```

**Response:**
```json
{
  "highlights": [
    "This is a key quote from the transcript",
    "Another important statement"
  ]
}
```

---

### POST /api/chat

Ask questions about the transcript.

**Request:**
```json
{
  "transcript": "Your transcript text here...",
  "question": "What was the main decision made?"
}
```

**Response:**
```json
{
  "answer": "The main decision was to..."
}
```

---

### POST /api/paraphrase

Rewrite transcript in a different tone.

**Request:**
```json
{
  "transcript": "Your transcript text here...",
  "tone": "formal"
}
```

Supported tones: `formal`, `casual`, `professional`

**Response:**
```json
{
  "paraphrased": "Rewritten text in the specified tone..."
}
```

---

### POST /api/translate

Translate text to another language.

**Request:**
```json
{
  "text": "Text to translate...",
  "targetLanguage": "Spanish"
}
```

**Response:**
```json
{
  "translated": "Texto traducido..."
}
```

---

### POST /api/faq

Generate FAQ from transcript.

**Request:**
```json
{
  "transcript": "Your transcript text here..."
}
```

**Response:**
```json
{
  "faqs": [
    {
      "question": "What is the main topic?",
      "answer": "The main topic is..."
    }
  ]
}
```

---

### POST /api/mindmap

Create a mind map structure from transcript.

**Request:**
```json
{
  "transcript": "Your transcript text here..."
}
```

**Response:**
```json
{
  "mindmap": {
    "center": "Main Topic",
    "branches": [
      {
        "topic": "Branch 1",
        "subtopics": ["Subtopic A", "Subtopic B"]
      }
    ]
  }
}
```

## Deployment

This API is designed to be deployed on Render.com with the following environment variables:
- `ANTHROPIC_API_KEY`
- `API_SECRET_KEY`

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
