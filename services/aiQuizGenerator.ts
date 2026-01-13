// AI Quiz Generator Service
// Uses Gemini API (free) for text + Pollinations.ai (free) for images

import { QuizLevel } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface GeneratedQuiz {
  targetWord: string;
  sentence: string;
  distractors: string[];
  phonicsRule: {
    name: string;
    description: string;
    indices: number[];
    color: string;
  };
}

// Phonics rules for variety
const PHONICS_RULES = [
  { name: 'Short A', description: 'The letter "a" makes the /æ/ sound', examples: 'cat, hat, bat' },
  { name: 'Short E', description: 'The letter "e" makes the /ɛ/ sound', examples: 'bed, red, pen' },
  { name: 'Short I', description: 'The letter "i" makes the /ɪ/ sound', examples: 'pig, big, sit' },
  { name: 'Short O', description: 'The letter "o" makes the /ɒ/ sound', examples: 'dog, hot, box' },
  { name: 'Short U', description: 'The letter "u" makes the /ʌ/ sound', examples: 'cup, bus, sun' },
  { name: 'Silent E', description: 'The silent "e" makes the vowel say its name', examples: 'cake, bike, home' },
  { name: 'Double Letters', description: 'Two same letters make one sound', examples: 'ball, bell, hill' },
  { name: 'Digraph CH', description: '"ch" makes the /tʃ/ sound', examples: 'chip, chat, cheese' },
  { name: 'Digraph SH', description: '"sh" makes the /ʃ/ sound', examples: 'ship, shop, fish' },
  { name: 'Digraph TH', description: '"th" makes the /θ/ or /ð/ sound', examples: 'this, that, think' },
];

// Generate quiz using Gemini API
export async function generateQuizWithAI(): Promise<QuizLevel | null> {
  if (!GEMINI_API_KEY) {
    console.error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in .env');
    return null;
  }

  const randomRule = PHONICS_RULES[Math.floor(Math.random() * PHONICS_RULES.length)];

  const prompt = `Generate a phonics quiz for children learning English.
Use the phonics rule: "${randomRule.name}" - ${randomRule.description}
Examples: ${randomRule.examples}

Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "targetWord": "a simple 3-6 letter word following the phonics rule",
  "sentence": "A simple sentence using the word, with ____ as placeholder for the word",
  "distractors": ["2-3 random letters not in the target word"]
}

Example response:
{"targetWord": "cat", "sentence": "The ____ is sleeping.", "distractors": ["x", "z"]}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      throw new Error('No response from Gemini');
    }

    // Parse JSON from response (handle potential markdown code blocks)
    let jsonStr = textResponse.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '');
    }

    const generated: GeneratedQuiz = JSON.parse(jsonStr);

    // Generate image URL using Pollinations.ai
    const imagePrompt = encodeURIComponent(
      `cute cartoon ${generated.targetWord} for children education, simple colorful illustration, white background`
    );
    const imageUrl = `https://image.pollinations.ai/prompt/${imagePrompt}?width=512&height=512&nologo=true`;

    // Find indices for phonics rule highlighting
    const indices: number[] = [];
    const word = generated.targetWord.toLowerCase();

    // Simple logic to find vowels or special patterns
    for (let i = 0; i < word.length; i++) {
      if ('aeiou'.includes(word[i])) {
        indices.push(i);
      }
    }

    const quizLevel: QuizLevel = {
      id: `ai-${Date.now()}`,
      targetWord: generated.targetWord.toLowerCase(),
      sentence: generated.sentence,
      imageHint: imageUrl,
      distractors: generated.distractors.map(d => d.toLowerCase()),
      phonicsRules: [{
        name: randomRule.name,
        description: randomRule.description,
        indices: indices.length > 0 ? indices : [0],
        color: getRandomColor(),
      }]
    };

    return quizLevel;
  } catch (error) {
    console.error('Error generating quiz:', error);
    return null;
  }
}

// Generate multiple quizzes
export async function generateMultipleQuizzes(count: number): Promise<QuizLevel[]> {
  const quizzes: QuizLevel[] = [];

  for (let i = 0; i < count; i++) {
    const quiz = await generateQuizWithAI();
    if (quiz) {
      quizzes.push(quiz);
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return quizzes;
}

// Helper function for random colors
function getRandomColor(): string {
  const colors = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Check if API key is configured
export function isAIConfigured(): boolean {
  return !!GEMINI_API_KEY;
}
