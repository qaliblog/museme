# Museme Project Summary

## Overview
Museme is a complete full-stack web application for AI-powered music production. It allows users to upload music samples, analyze them with AI, and generate complete song arrangements.

## Architecture

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI Library**: React 18
- **Styling**: TailwindCSS + Shadcn UI components
- **Theme**: Light/Dark mode support via next-themes

### Backend
- **Runtime**: Next.js API Routes (Node.js)
- **Database**: SQLite3 (better-sqlite3)
- **AI**: Google Gemini API
- **File Handling**: JSZip for ZIP extraction

### Key Features Implemented

#### 1. Upload System ✅
- Drag & drop file upload
- ZIP archive extraction
- Individual audio file support
- Automatic metadata extraction
- Database indexing

#### 2. File Descriptor Agent ✅
- Batch analysis of unanalyzed files
- Gemini AI integration
- Automatic categorization
- Tag generation
- Description generation

#### 3. Core Music Agent ✅
- Natural language song generation
- 3-minute arrangement generation
- Structured JSON output
- Sample selection from library
- BPM and structure generation

#### 4. API Key Manager ✅
- Unlimited key support
- Automatic cycling
- Retry logic for rate limits
- Error tracking
- Usage monitoring

## File Structure

```
museme/
├── app/
│   ├── api/                    # API endpoints
│   │   ├── upload/             # File upload handler
│   │   ├── assets/             # Get all assets
│   │   ├── analyze/            # AI file analysis
│   │   ├── generate-song/      # Song generation
│   │   ├── songs/              # Get generated songs
│   │   └── keys/               # API key management
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main page
├── components/
│   ├── ui/                     # Shadcn UI components
│   ├── assets-tab.tsx          # Upload interface
│   ├── agent-tab.tsx           # File analyzer UI
│   ├── music-agent-tab.tsx     # Song generator UI
│   └── settings-tab.tsx        # API key management UI
├── lib/
│   ├── db.ts                   # SQLite database client
│   ├── gemini-manager.ts       # API cycling & retry logic
│   ├── file-utils.ts           # File handling
│   └── utils.ts                # Utilities
└── sqlite/
    └── schema.sql              # Database schema (reference)
```

## API Endpoints

### POST /api/upload
Upload files (individual or ZIP)
- Body: FormData with file
- Returns: Upload status

### GET /api/assets
Get all uploaded assets
- Returns: Array of asset objects

### POST /api/analyze
Analyze all unanalyzed files
- Returns: Analysis results count

### POST /api/generate-song
Generate song arrangement
- Body: { prompt: string }
- Returns: Generated song object

### GET /api/songs
Get all generated songs
- Returns: Array of song objects

### GET /api/keys
Get all API keys
- Returns: Array of key objects

### POST /api/keys
Add new API key
- Body: { key: string }
- Returns: Created key object

### DELETE /api/keys/[id]
Delete API key
- Returns: Success status

### PATCH /api/keys/[id]
Update API key status
- Body: { is_active: boolean }
- Returns: Success status

## Database Schema

### gemini_api_keys
- id (UUID)
- key_value (TEXT)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- last_used_at (TIMESTAMP)
- usage_count (INTEGER)
- error_count (INTEGER)

### music_assets
- id (UUID)
- filename (TEXT)
- file_type (TEXT)
- file_size (BIGINT)
- file_path (TEXT)
- waveform_path (TEXT, optional)
- uploaded_at (TIMESTAMP)
- description (TEXT, optional)
- category (TEXT, optional)
- tags (TEXT[], optional)
- analyzed (BOOLEAN)
- analysis_prompt (TEXT, optional)
- analysis_response (TEXT, optional)

### generated_songs
- id (UUID)
- prompt (TEXT)
- bpm (INTEGER)
- duration_seconds (INTEGER)
- structure (JSONB)
- sounds_used (TEXT[])
- melody_description (TEXT)
- generated_at (TIMESTAMP)
- song_data (JSONB)
- status (TEXT)

## Gemini API Manager Features

### Key Cycling
- Rotates through available keys
- Tracks last used time
- Loads keys from database and env

### Retry Logic
- Detects rate limit errors (429, RPD, quota exceeded)
- Automatically switches to next key
- Retries with same prompt
- Exponential backoff

### Error Handling
- Tracks error counts per key
- Marks keys as inactive if needed
- Logs all errors for debugging

## UI Components

### Assets Tab
- Drag & drop upload zone
- File list table
- Upload progress
- File metadata display

### Agent Tab
- Analyze all button
- Analysis status indicators
- Results table with descriptions
- Category and tag badges

### Music Agent Tab
- Prompt input textarea
- Generate button
- Generated songs list
- Song structure visualization

### Settings Tab
- Add API key form
- Key management table
- Usage statistics
- Toggle active/inactive

## Environment Variables

Optional (all have defaults):
- `DATABASE_PATH` (default: ./data/museme.db)
- `GEMINI_API_KEYS` (comma-separated, can also add via UI)
- `MAX_FILE_SIZE` (default: 52428800)
- `UPLOAD_DIR` (default: ./uploads)

## Next Steps for Production

1. **File Storage**: Migrate to cloud storage (Supabase Storage, S3)
2. **Authentication**: Add user authentication
3. **Audio Processing**: Add waveform generation
4. **Export**: Add DAW export functionality
5. **Audio Playback**: Add audio player for samples
6. **RAR Support**: Add RAR extraction library
7. **Error Monitoring**: Add Sentry or similar
8. **Analytics**: Add usage analytics

## Testing Checklist

- [ ] File upload (individual files)
- [ ] ZIP extraction
- [ ] Database indexing
- [ ] AI analysis
- [ ] Song generation
- [ ] API key cycling
- [ ] Retry logic
- [ ] Error handling
- [ ] UI responsiveness
- [ ] Dark mode

## Known Limitations

1. RAR files not supported (ZIP only)
2. Waveform generation not implemented
3. Audio playback not implemented
4. No user authentication
5. Local file storage (not cloud)
6. SQLite database (local only, not suitable for high-traffic production)

## Dependencies

Key packages:
- next: 14.2.5
- react: 18.3.1
- better-sqlite3: 9.2.2
- @google/generative-ai: 0.2.1
- tailwindcss: 3.4.1
- jszip: 3.10.1
- react-dropzone: 14.2.3
- next-themes: 0.2.1

## License

MIT
