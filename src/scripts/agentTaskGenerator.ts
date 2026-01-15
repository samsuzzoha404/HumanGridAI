/**
 * Agent Task Generator - Simulates AI agents sending tasks every 5 seconds
 * Run this script to continuously generate tasks in Supabase
 */

import { supabase } from '../lib/supabaseClient';

const botNames = [
  'TravelAgent_Bot',
  'SentimentAI', 
  'DataLabeler_Pro',
  'VerifyBot',
  'ContentMod_AI',
  'ImageClassifier',
  'CategoryBot',
  'AudioTranscriber',
  'FaceRecognition',
  'ClickbaitDetector',
  'SpamFilter_AI',
  'TranslateBot',
  'SummaryAI',
  'CodeReviewer'
];

const taskDescriptions = [
  'Solve this image captcha to verify human presence',
  'Is this tweet expressing anger, joy, or neutral emotion?',
  'Label all vehicles in this street image',
  'Verify if this product image matches the description',
  'Rate the toxicity level of this comment (1-5)',
  'Select all images containing traffic lights',
  'Classify this product into the correct category',
  'Transcribe this audio clip accurately',
  'Identify all the people in this group photo',
  'Determine if this news headline is clickbait',
  'Does this email look like spam or legitimate?',
  'Translate this sentence to English',
  'Summarize this article in 2-3 sentences',
  'Review this code snippet for bugs',
  'Identify the main object in this image',
  'Rate the quality of this customer review',
  'Verify the address format is correct',
  'Classify this document type',
  'Extract key information from this receipt',
  'Validate this form submission'
];

const difficulties = ['easy', 'medium', 'hard'];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomReward(difficulty: string): number {
  const baseRewards = {
    easy: { min: 0.03, max: 0.08 },
    medium: { min: 0.08, max: 0.15 },
    hard: { min: 0.15, max: 0.25 }
  };
  
  const range = baseRewards[difficulty as keyof typeof baseRewards];
  return parseFloat((Math.random() * (range.max - range.min) + range.min).toFixed(2));
}

async function generateTask() {
  const difficulty = getRandomElement(difficulties);
  const botName = getRandomElement(botNames);
  const taskDescription = getRandomElement(taskDescriptions);
  const rewardAmount = getRandomReward(difficulty);

  const newTask = {
    bot_name: botName,
    task_description: taskDescription,
    reward_amount: rewardAmount,
    status: 'pending',
  };

  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([newTask])
      .select();

    if (error) {
      console.error('❌ Error creating task:', error.message);
    } else {
      console.log(`✅ New task created: ${botName} - $${rewardAmount} - ${taskDescription.substring(0, 50)}...`);
    }
  } catch (err) {
    console.error('❌ Failed to generate task:', err);
  }
}

async function startAgentTaskGenerator() {
  console.log('🤖 Agent Task Generator Started!');
  console.log('📡 Generating new tasks every 5 seconds...\n');

  // Generate initial task immediately
  await generateTask();

  // Then generate a task every 5 seconds
  setInterval(async () => {
    await generateTask();
  }, 5000);
}

// Start the generator
startAgentTaskGenerator();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Agent Task Generator Stopped');
  process.exit(0);
});
