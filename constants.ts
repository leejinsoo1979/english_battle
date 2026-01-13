
import { QuizLevel } from './types';

export const LEVELS: QuizLevel[] = [
  {
    id: 1,
    sentence: "There is a ____.",
    targetWord: "monkey",
    imageHint: "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?auto=format&fit=crop&q=80&w=400",
    distractors: ["n", "e"],
  },
  {
    id: 2,
    sentence: "The cat ____ the fish.",
    targetWord: "ate",
    imageHint: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400",
    distractors: ["b", "d"],
    phonicsRules: [
      { name: "Magic E", indices: [0, 2], color: "text-pink-500", description: "The silent E makes the vowel say its name." }
    ]
  },
  {
    id: 3,
    sentence: "I love to bake a ____.",
    targetWord: "cake",
    imageHint: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=400",
    distractors: ["p", "l"],
    phonicsRules: [
      { name: "Magic E", indices: [1, 3], color: "text-blue-500", description: "Long vowel 'a' and silent 'e'." }
    ]
  },
  {
    id: 4,
    sentence: "The ____ is bright today.",
    targetWord: "sun",
    imageHint: "https://images.unsplash.com/photo-1504386106331-3e4e71712b38?auto=format&fit=crop&q=80&w=400",
    distractors: ["m", "t"],
  },
  {
    id: 5,
    sentence: "Look at the big ____.",
    targetWord: "ship",
    imageHint: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=400",
    distractors: ["p", "z"],
    phonicsRules: [
      { name: "Digraph sh", indices: [0, 1], color: "text-orange-500", description: "S and H together make one sound: /sh/" }
    ]
  }
];

export const GAME_DURATION = 120; // 2 minutes
