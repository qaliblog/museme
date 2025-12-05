-- Create tables for museme application

-- API Keys table
CREATE TABLE IF NOT EXISTS gemini_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0
);

-- Music Assets table
CREATE TABLE IF NOT EXISTS music_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_path TEXT NOT NULL,
  waveform_path TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  category TEXT,
  tags TEXT[],
  analyzed BOOLEAN DEFAULT false,
  analysis_prompt TEXT,
  analysis_response TEXT
);

-- Generated Songs table
CREATE TABLE IF NOT EXISTS generated_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL,
  bpm INTEGER,
  duration_seconds INTEGER,
  structure JSONB,
  sounds_used TEXT[],
  melody_description TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  song_data JSONB,
  status TEXT DEFAULT 'pending'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_music_assets_filename ON music_assets(filename);
CREATE INDEX IF NOT EXISTS idx_music_assets_category ON music_assets(category);
CREATE INDEX IF NOT EXISTS idx_music_assets_analyzed ON music_assets(analyzed);
CREATE INDEX IF NOT EXISTS idx_gemini_keys_active ON gemini_api_keys(is_active);
