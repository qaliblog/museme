# Museme - React Native Android App

A React Native music production app for Android that allows you to upload music samples, analyze them with AI, and generate complete song arrangements using Google's Gemini API.

## Features

### 🎵 Music Pack Upload
- Upload ZIP archives or individual audio files
- Automatic extraction and indexing
- Support for WAV, MP3, AIFF, FLAC, OGG, M4A, AAC formats
- File metadata generation

### 🤖 AI File Descriptor Agent
- Automatically analyzes uploaded sounds using Gemini AI
- Generates descriptions, categories, and tags for each file
- Batch analysis of all unanalyzed files
- Stores analysis results in local SQLite database

### 🎹 Core Music Agent
- Generate complete 3-minute song arrangements
- Natural language prompts
- Uses analyzed samples from your library
- Returns structured JSON with BPM, structure, sounds used, and melody descriptions

### 🔑 Gemini API Manager
- Unlimited API key support
- Automatic key cycling
- Retry logic for rate limits
- Usage tracking and error monitoring

## Tech Stack

- **Framework**: React Native 0.73
- **Language**: TypeScript
- **Database**: SQLite (react-native-sqlite-storage)
- **AI**: Google Gemini API
- **File Handling**: react-native-fs, react-native-zip-archive
- **Navigation**: React Navigation

## Prerequisites

- Node.js 18+
- Java JDK 17+
- Android Studio with Android SDK
- React Native development environment set up

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Pods (if using CocoaPods for iOS - not needed for Android-only)

For Android-only builds, skip this step.

### 3. Run the App

#### Development Mode:

```bash
# Start Metro bundler
npm start

# In another terminal, run Android
npm run android
```

#### Build Release APK:

```bash
npm run build:android
```

The APK will be generated at: `android/app/build/outputs/apk/release/app-release.apk`

## Configuration

### API Keys

Add your Gemini API keys through the Settings tab in the app, or you can store them in AsyncStorage programmatically.

To get Gemini API keys:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create one or more API keys
3. Add them via the Settings tab in the app

## Project Structure

```
museme/
├── App.tsx                 # Main app component
├── index.js               # Entry point
├── components/            # React Native components
│   ├── assets-tab.tsx
│   ├── agent-tab.tsx
│   ├── music-agent-tab.tsx
│   └── settings-tab.tsx
├── lib/                   # Core libraries
│   ├── db.ts              # SQLite database helpers
│   ├── file-utils.ts      # File operations
│   ├── gemini-manager.ts  # Gemini API manager
│   └── utils.ts           # Utility functions
├── services/              # API service layer
│   └── api.ts             # Service functions
└── android/               # Android native code
```

## Usage

### Uploading Music Packs

1. Open the **Assets** tab
2. Tap "Select Files"
3. Choose audio files or ZIP archives
4. Files are automatically extracted and indexed

### Analyzing Files

1. Go to the **Agent** tab
2. Tap "Analyze All" to process unanalyzed files
3. The AI will generate descriptions, categories, and tags
4. View results in the table

### Generating Songs

1. Go to the **Music Agent** tab
2. Enter a prompt describing your desired song:
   ```
   Make a 3-minute beat at 90 BPM, chill trap vibe, soft keys melody, 
   use snare_04, kick_02, add hi-hat rolls.
   ```
3. Tap "Generate Song"
4. View the generated arrangement with structure, sounds used, and melody description

### Managing API Keys

1. Go to the **Settings** tab
2. Add new Gemini API keys
3. Monitor usage and error counts
4. Toggle keys active/inactive
5. Delete unused keys

## Database

The app uses SQLite for local storage. The database is automatically created in the app's data directory on first launch.

### Tables

- `gemini_api_keys` - Stores API keys with usage tracking
- `music_assets` - Stores uploaded file metadata and analysis results
- `generated_songs` - Stores generated song arrangements

## File Storage

Uploaded files are stored in the app's document directory:
- Android: `/data/data/com.museme/files/uploads/`

## Building for Production

### Generate Signed APK

1. Create a keystore:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. Create `android/app/release-signing.properties`:
```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=*****
MYAPP_RELEASE_KEY_PASSWORD=*****
```

3. Update `android/app/build.gradle` to use signing config

4. Build:
```bash
cd android
./gradlew assembleRelease
```

## Troubleshooting

### Metro Bundler Issues

```bash
npm start -- --reset-cache
```

### Build Errors

```bash
cd android
./gradlew clean
cd ..
npm install
npm run android
```

### Database Issues

The database is automatically created. If you encounter issues, clear app data and reinstall.

## Permissions

The app requires the following Android permissions:
- `INTERNET` - For Gemini API calls
- `READ_EXTERNAL_STORAGE` - For file selection
- `WRITE_EXTERNAL_STORAGE` - For saving uploaded files

## Known Limitations

1. Android-only (iOS support can be added)
2. Local file storage (not cloud)
3. SQLite database (local only)
4. RAR files not supported (ZIP only)

## License

MIT

## Support

For issues and questions, please check the troubleshooting section or open an issue.
