const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { callClaude } = require('../services/claude');

// Helper function to parse JSON from Claude responses (strips markdown code blocks)
function parseJSON(response) {
  // Remove markdown code blocks if present
  let cleaned = response.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return JSON.parse(cleaned.trim());
}

// Apply auth middleware to all routes
router.use(auth);

// POST /summary - Generate a summary of the transcript
router.post('/summary', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const prompt = `You are an expert at summarizing audio transcripts. Create a clear, concise summary of the following transcript. Focus on main topics, key points, decisions made, and important information. Keep it to 3-5 paragraphs.

Transcript:
${transcript}

Summary:`;

    const summary = await callClaude(prompt, 1000);
    res.json({ summary });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /bullets - Convert transcript to bullet points
router.post('/bullets', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const prompt = `Convert this transcript into clear, actionable bullet points. Extract all key points, facts, decisions, and takeaways. Group related points together.

Transcript:
${transcript}

Bullet points:`;

    const bullets = await callClaude(prompt, 1500);
    res.json({ bullets });
  } catch (error) {
    console.error('Bullets error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /notes - Transform transcript into structured notes
router.post('/notes', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const prompt = `Transform this transcript into well-structured notes with clear headers and sections. Organize by topic. Include key details, definitions, and important quotes under each section. Use markdown formatting.

Transcript:
${transcript}

Structured Notes:`;

    const notes = await callClaude(prompt, 2000);
    res.json({ notes });
  } catch (error) {
    console.error('Notes error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /flashcards - Create study flashcards from transcript
router.post('/flashcards', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const prompt = `Create 5-10 study flashcards from this transcript. Each flashcard should have a 'front' (question, term, or concept) and 'back' (answer, definition, or explanation). Return ONLY a valid JSON array with no other text.

Transcript:
${transcript}

JSON array of flashcards:`;

    const response = await callClaude(prompt, 2000);

    try {
      const flashcards = parseJSON(response);
      res.json({ flashcards });
    } catch (parseError) {
      // Return raw response if JSON parsing fails
      res.json({ flashcards: response });
    }
  } catch (error) {
    console.error('Flashcards error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /quiz - Create quiz questions from transcript
router.post('/quiz', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const prompt = `Create 5 multiple choice quiz questions to test understanding of this transcript. Each question should have 'question', 'options' (array of 4 choices), and 'correctIndex' (0-3). Return ONLY a valid JSON array with no other text.

Transcript:
${transcript}

JSON array of questions:`;

    const response = await callClaude(prompt, 2000);

    try {
      const questions = parseJSON(response);
      res.json({ questions });
    } catch (parseError) {
      res.json({ questions: response });
    }
  } catch (error) {
    console.error('Quiz error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /action-items - Extract action items from transcript
router.post('/action-items', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const prompt = `Extract all action items, tasks, and to-dos from this transcript. For each, identify the 'task', 'assignee' (if mentioned, else null), and 'deadline' (if mentioned, else null). Return ONLY a valid JSON array with no other text.

Transcript:
${transcript}

JSON array of action items:`;

    const response = await callClaude(prompt, 1500);

    try {
      const actionItems = parseJSON(response);
      res.json({ actionItems });
    } catch (parseError) {
      res.json({ actionItems: response });
    }
  } catch (error) {
    console.error('Action items error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /highlights - Extract key highlights from transcript
router.post('/highlights', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const prompt = `Extract the 5-10 most important quotes, key moments, or significant statements from this transcript. These should be the most memorable or impactful parts. Return ONLY a valid JSON array of strings with no other text.

Transcript:
${transcript}

JSON array of highlights:`;

    const response = await callClaude(prompt, 1500);

    try {
      const highlights = parseJSON(response);
      res.json({ highlights });
    } catch (parseError) {
      res.json({ highlights: response });
    }
  } catch (error) {
    console.error('Highlights error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /chat - Ask questions about the transcript
router.post('/chat', async (req, res) => {
  try {
    const { transcript, question } = req.body;

    if (!transcript || !question) {
      return res.status(400).json({ error: 'Transcript and question are required' });
    }

    const prompt = `You are a helpful assistant with access to a transcript. Answer the user's question based on the transcript content. Be accurate and cite specific parts when relevant.

Transcript:
${transcript}

User's Question: ${question}

Answer:`;

    const answer = await callClaude(prompt, 1000);
    res.json({ answer });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /paraphrase - Rewrite transcript in a clear, professional manner
router.post('/paraphrase', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const prompt = `Rewrite this transcript in a clear, professional manner. Make it well-written and polished while preserving all the original meaning. Remove filler words, false starts, and repetitions.

Transcript:
${transcript}

Paraphrased:`;

    const paraphrased = await callClaude(prompt, 4000);
    res.json({ paraphrased });
  } catch (error) {
    console.error('Paraphrase error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /translate - Translate text to another language
router.post('/translate', async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'Text and targetLanguage are required' });
    }

    const prompt = `Translate the following text to ${targetLanguage}. Provide only the translation, no explanations.

Text:
${text}

Translation:`;

    const translated = await callClaude(prompt, 2000);
    res.json({ translated });
  } catch (error) {
    console.error('Translate error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /faq - Generate FAQ from transcript
router.post('/faq', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const prompt = `Create a FAQ (Frequently Asked Questions) document based on this transcript. Generate 5-8 relevant questions that someone might ask about this content, with clear answers. Return as a JSON array with 'question' and 'answer' fields.

Transcript:
${transcript}

JSON array of FAQs:`;

    const response = await callClaude(prompt, 2000);

    try {
      const faqs = parseJSON(response);
      res.json({ faqs });
    } catch (parseError) {
      res.json({ faqs: response });
    }
  } catch (error) {
    console.error('FAQ error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /mindmap - Create mind map structure from transcript
router.post('/mindmap', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const prompt = `Create a mind map structure from this transcript. Identify the central topic and main branches with sub-topics. Return as JSON with 'center' (main topic), and 'branches' (array of {topic, subtopics: [string]}).

Transcript:
${transcript}

JSON mind map:`;

    const response = await callClaude(prompt, 1500);

    try {
      const mindmap = parseJSON(response);
      res.json({ mindmap });
    } catch (parseError) {
      res.json({ mindmap: response });
    }
  } catch (error) {
    console.error('Mindmap error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /punctuation - Add proper punctuation to transcript
router.post('/punctuation', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const prompt = `Add proper punctuation, capitalization, and paragraph breaks to this transcript. Keep the exact words but make it readable with proper grammar formatting.

Transcript:
${transcript}

Punctuated:`;

    const punctuated = await callClaude(prompt, 4000);
    res.json({ punctuated });
  } catch (error) {
    console.error('Punctuation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /formal - Rewrite transcript in formal tone
router.post('/formal', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const prompt = `Rewrite this transcript in a formal, professional tone suitable for business or academic contexts. Maintain the same information but use formal language and structure.

Transcript:
${transcript}

Formal Version:`;

    const formal = await callClaude(prompt, 4000);
    res.json({ formal });
  } catch (error) {
    console.error('Formal error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /casual - Rewrite transcript in casual tone
router.post('/casual', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const prompt = `Rewrite this transcript in a casual, friendly, conversational tone. Make it easy to read and approachable while keeping the same information.

Transcript:
${transcript}

Casual Version:`;

    const casual = await callClaude(prompt, 4000);
    res.json({ casual });
  } catch (error) {
    console.error('Casual error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
