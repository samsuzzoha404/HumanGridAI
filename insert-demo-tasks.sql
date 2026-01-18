-- Insert demo agent tasks into your existing tasks table
-- Run this in Supabase SQL Editor

INSERT INTO tasks (task_description, reward_amount, status, bot_name)
VALUES 
  ('Solve this image captcha to verify human presence', 0.05, 'pending', 'TravelAgent_Bot'),
  ('Is this tweet expressing anger, joy, or neutral emotion?', 0.08, 'pending', 'SentimentAI'),
  ('Label all vehicles in this street image', 0.12, 'pending', 'DataLabeler_Pro'),
  ('Verify if this product image matches the description', 0.06, 'pending', 'VerifyBot'),
  ('Rate the toxicity level of this comment (1-5)', 0.10, 'pending', 'ContentMod_AI'),
  ('Select all images containing traffic lights', 0.07, 'pending', 'ImageClassifier'),
  ('Classify this product into the correct category', 0.09, 'pending', 'CategoryBot'),
  ('Transcribe this audio clip accurately', 0.15, 'pending', 'AudioTranscriber'),
  ('Identify all the people in this group photo', 0.11, 'pending', 'FaceRecognition'),
  ('Determine if this news headline is clickbait', 0.08, 'pending', 'ClickbaitDetector');
