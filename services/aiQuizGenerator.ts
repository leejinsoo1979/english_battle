// AI Quiz Generator Service
// Uses Gemini API (free) for text + Wikipedia/Wikimedia for images

import { QuizLevel } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// 단어별 이미지 매핑 (확실한 이미지)
const WORD_IMAGES: Record<string, string> = {
  // Short A
  cat: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/481px-Cat03.jpg',
  hat: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Bowler_hat.jpg/440px-Bowler_hat.jpg',
  bat: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Pipistrellus_pipistrellus_lateral.jpg/500px-Pipistrellus_pipistrellus_lateral.jpg',
  map: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/World_Map_Blank.svg/500px-World_Map_Blank.svg.png',
  bag: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banana-themed_bag.jpg/440px-Banana-themed_bag.jpg',
  // Short E
  bed: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Bed_in_Hotel_&_Spa_Nowy_Dwor_in_Swilcza.jpg/500px-Bed_in_Hotel_&_Spa_Nowy_Dwor_in_Swilcza.jpg',
  red: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Solid_red.svg/500px-Solid_red.svg.png',
  pen: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Ballpoint-pen-parts.jpg/500px-Ballpoint-pen-parts.jpg',
  hen: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/500px-Camponotus_flavomarginatus_ant.jpg',
  egg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/500px-Camponotus_flavomarginatus_ant.jpg',
  // Short I
  pig: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Pig_farm_Vampula_9.jpg/500px-Pig_farm_Vampula_9.jpg',
  big: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Felis_silvestris_catus_lying_on_rice_straw.jpg/500px-Felis_silvestris_catus_lying_on_rice_straw.jpg',
  sit: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Sitting_dog.jpg/400px-Sitting_dog.jpg',
  fin: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Carcharodon_carcharias_in_south_africa.jpg/500px-Carcharodon_carcharias_in_south_africa.jpg',
  // Short O
  dog: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/YellowLabradorLooking_new.jpg/500px-YellowLabradorLooking_new.jpg',
  hot: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/500px-Camponotus_flavomarginatus_ant.jpg',
  box: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Cardboard_Box.jpg/500px-Cardboard_Box.jpg',
  fox: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Vulpes_vulpes_laying_in_snow.jpg/500px-Vulpes_vulpes_laying_in_snow.jpg',
  log: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Big_Wood_Log.jpg/500px-Big_Wood_Log.jpg',
  // Short U
  cup: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Cappuccino_in_Italy.jpg/500px-Cappuccino_in_Italy.jpg',
  bus: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/SBS_Transit_Volvo_B9TL_SBS7357L.jpg/500px-SBS_Transit_Volvo_B9TL_SBS7357L.jpg',
  sun: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg/500px-The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg',
  bug: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/500px-Camponotus_flavomarginatus_ant.jpg',
  nut: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Walnuts_-_whole_and_open.jpg/500px-Walnuts_-_whole_and_open.jpg',
  // Silent E
  cake: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/A_small_cup_of_coffee.JPG/500px-A_small_cup_of_coffee.JPG',
  bike: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/500px-Camponotus_flavomarginatus_ant.jpg',
  home: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/GoldenGateBridge-001.jpg/500px-GoldenGateBridge-001.jpg',
  bone: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Humerus_-_anterior_view.png/300px-Humerus_-_anterior_view.png',
  rose: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Dahlia_x_hybrida.jpg/500px-Dahlia_x_hybrida.jpg',
  // Double Letters
  ball: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Soccerball.svg/500px-Soccerball.svg.png',
  bell: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Campana_gotica_Catedral_Toledo.jpg/400px-Campana_gotica_Catedral_Toledo.jpg',
  hill: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Conic_hill.jpg/500px-Conic_hill.jpg',
  doll: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Barbie_-_Pair.jpg/400px-Barbie_-_Pair.jpg',
  // Digraph CH
  chip: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Potato-Chips.jpg/500px-Potato-Chips.jpg',
  chat: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/500px-Camponotus_flavomarginatus_ant.jpg',
  chin: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/500px-Camponotus_flavomarginatus_ant.jpg',
  // Digraph SH
  ship: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Segelschiff_Passat_Luebeck-Travemuende.jpg/500px-Segelschiff_Passat_Luebeck-Travemuende.jpg',
  shop: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Shop.svg/500px-Shop.svg.png',
  fish: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Georgia_Aquarium_-_Giant_Grouper.jpg/500px-Georgia_Aquarium_-_Giant_Grouper.jpg',
  dish: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/500px-Good_Food_Display_-_NCI_Visuals_Online.jpg',
  // Digraph TH
  this: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/500px-Camponotus_flavomarginatus_ant.jpg',
  that: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/500px-Camponotus_flavomarginatus_ant.jpg',
};

// 확실한 단어-이미지 세트 (문장과 이미지가 정확히 일치)
const WORD_IMAGE_PAIRS = [
  { word: 'cat', sentence: 'The ____ is cute.', image: 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?w=500', rule: 'Short A' },
  { word: 'dog', sentence: 'I have a ____.', image: 'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?w=500', rule: 'Short O' },
  { word: 'pig', sentence: 'The ____ is pink.', image: 'https://images.pexels.com/photos/1300361/pexels-photo-1300361.jpeg?w=500', rule: 'Short I' },
  { word: 'sun', sentence: 'The ____ is in the sky.', image: 'https://images.pexels.com/photos/301599/pexels-photo-301599.jpeg?w=500', rule: 'Short U' },
  { word: 'cup', sentence: 'This is a ____.', image: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?w=500', rule: 'Short U' },
  { word: 'bus', sentence: 'The ____ is big.', image: 'https://images.pexels.com/photos/385998/pexels-photo-385998.jpeg?w=500', rule: 'Short U' },
  { word: 'fox', sentence: 'The ____ is orange.', image: 'https://images.pexels.com/photos/247399/pexels-photo-247399.jpeg?w=500', rule: 'Short O' },
  { word: 'box', sentence: 'This is a ____.', image: 'https://images.pexels.com/photos/6214476/pexels-photo-6214476.jpeg?w=500', rule: 'Short O' },
  { word: 'ball', sentence: 'I see a ____.', image: 'https://images.pexels.com/photos/47730/the-ball-stadion-football-the-pitch-47730.jpeg?w=500', rule: 'Double Letters' },
  { word: 'fish', sentence: 'The ____ is in water.', image: 'https://images.pexels.com/photos/128756/pexels-photo-128756.jpeg?w=500', rule: 'Digraph SH' },
  { word: 'ship', sentence: 'The ____ is on the sea.', image: 'https://images.pexels.com/photos/813011/pexels-photo-813011.jpeg?w=500', rule: 'Digraph SH' },
  { word: 'bed', sentence: 'This is a ____.', image: 'https://images.pexels.com/photos/1034584/pexels-photo-1034584.jpeg?w=500', rule: 'Short E' },
  { word: 'pen', sentence: 'I have a ____.', image: 'https://images.pexels.com/photos/3631711/pexels-photo-3631711.jpeg?w=500', rule: 'Short E' },
  { word: 'hat', sentence: 'This is a ____.', image: 'https://images.pexels.com/photos/984619/pexels-photo-984619.jpeg?w=500', rule: 'Short A' },
  { word: 'egg', sentence: 'This is an ____.', image: 'https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?w=500', rule: 'Short E' },
  { word: 'car', sentence: 'The ____ is red.', image: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?w=500', rule: 'Short A' },
  { word: 'map', sentence: 'I see a ____.', image: 'https://images.pexels.com/photos/592753/pexels-photo-592753.jpeg?w=500', rule: 'Short A' },
  { word: 'hen', sentence: 'The ____ is brown.', image: 'https://images.pexels.com/photos/195226/pexels-photo-195226.jpeg?w=500', rule: 'Short E' },
  { word: 'nut', sentence: 'This is a ____.', image: 'https://images.pexels.com/photos/86649/pexels-photo-86649.jpeg?w=500', rule: 'Short U' },
  { word: 'bag', sentence: 'I have a ____.', image: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?w=500', rule: 'Short A' },
];

// Phonics rules
const PHONICS_RULES: Record<string, { name: string; description: string }> = {
  'Short A': { name: 'Short A', description: 'The letter "a" makes the /æ/ sound' },
  'Short E': { name: 'Short E', description: 'The letter "e" makes the /ɛ/ sound' },
  'Short I': { name: 'Short I', description: 'The letter "i" makes the /ɪ/ sound' },
  'Short O': { name: 'Short O', description: 'The letter "o" makes the /ɒ/ sound' },
  'Short U': { name: 'Short U', description: 'The letter "u" makes the /ʌ/ sound' },
  'Silent E': { name: 'Silent E', description: 'The silent "e" makes the vowel say its name' },
  'Double Letters': { name: 'Double Letters', description: 'Two same letters make one sound' },
  'Digraph CH': { name: 'Digraph CH', description: '"ch" makes the /tʃ/ sound' },
  'Digraph SH': { name: 'Digraph SH', description: '"sh" makes the /ʃ/ sound' },
  'Digraph TH': { name: 'Digraph TH', description: '"th" makes the /θ/ or /ð/ sound' },
};

// 이미지 미리 로드
function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject();
    img.src = url;
  });
}

// 사용된 단어 추적
let usedIndices: number[] = [];

// Generate quiz using pre-defined word-image pairs
export async function generateQuizWithAI(): Promise<QuizLevel | null> {
  try {
    // 모든 단어 다 사용했으면 리셋
    if (usedIndices.length >= WORD_IMAGE_PAIRS.length) {
      usedIndices = [];
    }

    // 사용하지 않은 랜덤 인덱스 선택
    let randomIndex: number;
    do {
      randomIndex = Math.floor(Math.random() * WORD_IMAGE_PAIRS.length);
    } while (usedIndices.includes(randomIndex));

    usedIndices.push(randomIndex);

    const pair = WORD_IMAGE_PAIRS[randomIndex];
    const rule = PHONICS_RULES[pair.rule];

    // 이미지 미리 로드
    try {
      await preloadImage(pair.image);
    } catch {
      console.warn('Image preload failed, but continuing...');
    }

    // distractor 글자 생성 (단어에 없는 글자)
    const wordLetters = new Set(pair.word.toLowerCase().split(''));
    const allLetters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const distractors = allLetters
      .filter(l => !wordLetters.has(l))
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);

    // Find indices for phonics rule highlighting
    const indices: number[] = [];
    const word = pair.word.toLowerCase();
    for (let i = 0; i < word.length; i++) {
      if ('aeiou'.includes(word[i])) {
        indices.push(i);
      }
    }

    const quizLevel: QuizLevel = {
      id: `ai-${Date.now()}`,
      targetWord: pair.word.toLowerCase(),
      sentence: pair.sentence,
      imageHint: pair.image,
      distractors: distractors,
      phonicsRules: [{
        name: rule.name,
        description: rule.description,
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
  }

  return quizzes;
}

// Helper function for random colors
function getRandomColor(): string {
  const colors = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Check if AI is configured (always true now since we use pre-defined pairs)
export function isAIConfigured(): boolean {
  return true;
}
