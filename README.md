# Museme - AI Music Production Studio

A modern full-stack web application for uploading music packs, analyzing sounds with AI, and generating complete song arrangements using Google's Gemini API.

## Features

### 🎵 Music Pack Upload
- Upload ZIP archives or individual audio files
- Automatic extraction and indexing
- Support for WAV, MP3, AIFF, FLAC, OGG, M4A, AAC formats
- File metadata generation (filename, type, size)

### 🤖 AI File Descriptor Agent
- Automatically analyzes uploaded sounds using Gemini AI
- Generates descriptions, categories, and tags for each file
- Batch analysis of all unanalyzed files
- Stores analysis results in database

### 🎹 Core Music Agent
- Generate complete 3-minute song arrangements
- Natural language prompts (e.g., "Make a 3-minute beat at 90 BPM, chill trap vibe")
- Uses analyzed samples from your library
- Returns structured JSON with:
  - BPM and duration
  - Song structure (intro, verse, hook, bridge, outro)
  - Sounds used
  - Melody descriptions

### 🔑 Gemini API Manager
- Unlimited API key support
- Automatic key cycling
- Retry logic for rate limits and RPD errors
- Usage tracking and error monitoring
- Key activation/deactivation

### 🎨 Modern UI
- Clean, responsive design with TailwindCSS
- Shadcn UI components
- Light/Dark mode support
- Four main tabs: Assets, Agent, Music Agent, Settings

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: TailwindCSS, Shadcn UI
- **Database**: SQLite3 (better-sqlite3)
- **AI**: Google Gemini API
- **File Handling**: JSZip for archive extraction

## Prerequisites

- Node.js 18+ and npm/yarn
- Google Gemini API key(s)
- No external database setup required (uses local SQLite)

## Installation

### 1. Clone and Install Dependencies

```bash
cd museme
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database Configuration (optional - defaults to ./data/museme.db)
DATABASE_PATH=./data/museme.db

# Gemini API Keys (optional - can also add via UI)
GEMINI_API_KEYS=key1,key2,key3

# File Upload Settings (optional)
MAX_FILE_SIZE=52428800
UPLOAD_DIR=./uploads
```

**Note**: The database will be automatically created on first run. No manual setup required!

### 3. Get Gemini API Keys

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create one or more API keys
3. Add them via the Settings tab in the app, or include them in `GEMINI_API_KEYS` env variable

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
museme/
├── app/
│   ├── api/              # API routes
│   │   ├── upload/       # File upload endpoint
│   │   ├── assets/       # Get all assets
│   │   ├── analyze/      # Analyze files with AI
│   │   ├── generate-song/# Generate song arrangements
│   │   ├── songs/        # Get generated songs
│   │   └── keys/         # Manage API keys
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main page
├── components/
│   ├── ui/               # Shadcn UI components
│   ├── assets-tab.tsx    # Upload interface
│   ├── agent-tab.tsx     # File analyzer
│   ├── music-agent-tab.tsx # Song generator
│   └── settings-tab.tsx  # API key management
├── lib/
│   ├── supabase.ts       # Supabase client
│   ├── gemini-manager.ts # API key cycling & retry logic
│   ├── file-utils.ts     # File handling utilities
│   └── utils.ts          # General utilities
├── supabase/
│   └── schema.sql        # Database schema
└── uploads/              # Uploaded files (gitignored)
```

## Usage Guide

### Uploading Music Packs

1. Go to the **Assets** tab
2. Drag and drop audio files or ZIP/RAR archives
3. Files are automatically extracted and indexed
4. View all uploaded assets in the table below

### Analyzing Files

1. Go to the **Agent** tab
2. Click "Analyze All" to process unanalyzed files
3. The AI will generate descriptions, categories, and tags
4. View results in the table

### Generating Songs

1. Go to the **Music Agent** tab
2. Enter a prompt describing your desired song:
   ```
   Make a 3-minute beat at 90 BPM, chill trap vibe, soft keys melody, 
   use snare_04, kick_02, add hi-hat rolls.
   ```
3. Click "Generate Song"
4. View the generated arrangement with structure, sounds used, and melody description

### Managing API Keys

1. Go to the **Settings** tab
2. Add new Gemini API keys
3. Monitor usage and error counts
4. Toggle keys active/inactive
5. Delete unused keys

## API Key Cycling & Retry Logic

The Gemini Manager automatically:

- **Cycles through keys**: Uses each key in rotation
- **Handles rate limits**: Automatically switches to next key on 429 errors
- **Retries on RPD errors**: Detects Resource Exhausted errors and retries
- **Tracks usage**: Monitors which keys are used most and their error rates
- **Reprompts**: Uses the same prompt when retrying with a new key

## Database Schema

### `gemini_api_keys`
- Stores API keys with usage tracking
- Tracks last used time, usage count, error count

### `music_assets`
- Stores uploaded file metadata
- Includes analysis results (description, category, tags)
- Links to file paths

### `generated_songs`
- Stores generated song arrangements
- Includes prompt, structure, sounds used, and full JSON data

## Production Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables for Production

Set the same environment variables in your hosting platform:
- Vercel: Project Settings > Environment Variables
- Railway: Variables tab
- Render: Environment section

### File Storage

For production, consider using:
- Supabase Storage for file uploads
- AWS S3 or similar cloud storage
- Update `file-utils.ts` to use cloud storage APIs

## Troubleshooting

### Upload Fails
- Check file size limits (default 50MB)
- Ensure `uploads/` directory is writable
- Check file permissions

### Analysis Fails
- Verify Gemini API keys are valid
- Check API key quotas
- Review error messages in Settings tab

### Database Errors
- Ensure `data/` directory is writable
- Check database file permissions
- Verify DATABASE_PATH in .env.local is correct

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

## Support

For issues and questions, please open a GitHub issue.
