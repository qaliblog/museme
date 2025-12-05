# Museme Installation Guide

## Quick Start

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Get Gemini API Keys

**Note**: The SQLite database will be automatically created on first run. No manual setup required!

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (you can create multiple keys)

### Step 3: Configure Environment

Create `.env.local` in the project root:

```env
# Database Configuration (optional - defaults to ./data/museme.db)
DATABASE_PATH=./data/museme.db

# Gemini API Keys (optional - can add via UI)
GEMINI_API_KEYS=your_key_1,your_key_2,your_key_3

# File Upload (optional)
MAX_FILE_SIZE=52428800
UPLOAD_DIR=./uploads
```

### Step 4: Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## First-Time Setup Checklist

- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] At least one Gemini API key obtained
- [ ] API key added via Settings tab or env variable
- [ ] Development server running

**Note**: The SQLite database is automatically created on first run - no manual setup needed!

## Adding API Keys

### Method 1: Via UI (Recommended)
1. Start the app
2. Go to Settings tab
3. Enter API key and click "Add Key"
4. Repeat for multiple keys

### Method 2: Via Environment Variable
Add comma-separated keys to `GEMINI_API_KEYS` in `.env.local`

## Testing the Application

1. **Upload Files**
   - Go to Assets tab
   - Drag & drop audio files or ZIP archive
   - Verify files appear in the table

2. **Analyze Files**
   - Go to Agent tab
   - Click "Analyze All"
   - Wait for AI analysis to complete
   - Verify descriptions, categories, and tags appear

3. **Generate Song**
   - Go to Music Agent tab
   - Enter a prompt like: "Make a 3-minute beat at 90 BPM, chill trap vibe"
   - Click "Generate Song"
   - View the generated arrangement

## Troubleshooting

### "Failed to fetch assets"
- Ensure `data/` directory is writable
- Check database file permissions
- Verify DATABASE_PATH in `.env.local` is correct
- Check browser console for errors

### "No API keys available"
- Add at least one API key in Settings tab
- Or set `GEMINI_API_KEYS` in `.env.local`
- Verify keys are valid

### Upload fails
- Check file size (default max: 50MB)
- Ensure `uploads/` directory is writable
- Check server logs for errors

### Analysis fails
- Verify Gemini API keys are valid
- Check API quotas haven't been exceeded
- Review error messages in Settings tab

## Production Deployment

### Build Command
```bash
npm run build
npm start
```

### Environment Variables
Set the same variables in your hosting platform:
- Vercel: Project Settings > Environment Variables
- Railway: Variables tab
- Render: Environment section

### File Storage
For production, consider:
- AWS S3
- Cloudinary
- Azure Blob Storage

Update `lib/file-utils.ts` to use cloud storage APIs.

### Database
The SQLite database file (`museme.db`) will be created in the `data/` directory. For production:
- Ensure the database directory is writable
- Consider backing up the database regularly
- For high-traffic applications, consider migrating to PostgreSQL or MySQL

## Next Steps

- Upload your first music pack
- Analyze files with AI
- Generate your first song
- Add more API keys for unlimited usage

Enjoy making music with Museme! 🎵
