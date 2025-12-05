-- SQLite schema for Museme application
-- This file is for reference. The schema is automatically created by lib/db.ts

-- API Keys table
CREATE TABLE IF NOT EXISTS gemini_api_keys (
  id TEXT PRIMARY KEY,
  key_value TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_used_at TEXT,
  usage_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0
);

-- Music Assets table
CREATE TABLE IF NOT EXISTS music_assets (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  waveform_path TEXT,
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  description TEXT,
  category TEXT,
  tags TEXT,
  analyzed INTEGER DEFAULT 0,
  analysis_prompt TEXT,
  analysis_response TEXT
);

-- Generated Songs table
CREATE TABLE IF NOT EXISTS generated_songs (
  id TEXT PRIMARY KEY,
  prompt TEXT NOT NULL,
  bpm INTEGER,
  duration_seconds INTEGER,
  structure TEXT,
  sounds_used TEXT,
  melody_description TEXT,
  generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  song_data TEXT,
  status TEXT DEFAULT 'pending'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_music_assets_filename ON music_assets(filename);
CREATE INDEX IF NOT EXISTS idx_music_assets_category ON music_assets(category);
CREATE INDEX IF NOT EXISTS idx_music_assets_analyzed ON music_assets(analyzed);
CREATE INDEX IF NOT EXISTS idx_gemini_keys_active ON gemini_api_keys(is_active);
