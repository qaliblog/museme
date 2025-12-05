# Conversion Summary: Next.js to React Native

This document summarizes the changes made to convert the Museme app from Next.js to React Native for Android.

## Major Changes

### 1. App Structure
- **Before**: Next.js App Router with `app/` directory
- **After**: React Native with `App.tsx` as entry point
- Created `App.tsx` with React Navigation bottom tabs
- Updated `index.js` to register the React Native app

### 2. Database Layer
- **Before**: `better-sqlite3` (Node.js SQLite)
- **After**: `react-native-sqlite-storage` (React Native SQLite)
- Converted all database operations to async/await pattern
- Updated SQL execution to use React Native SQLite API
- Replaced Node.js `crypto.randomUUID()` with custom UUID generator

### 3. File System
- **Before**: Node.js `fs` module
- **After**: `react-native-fs` for file operations
- Replaced `fs.writeFile`, `fs.mkdir`, etc. with React Native equivalents
- Updated file paths to use React Native document directory
- Changed ZIP extraction from JSZip (Node.js) to `react-native-zip-archive`

### 4. API Layer
- **Before**: Next.js API Routes (`app/api/*/route.ts`)
- **After**: Service layer (`services/api.ts`)
- Converted all API endpoints to service functions
- Removed HTTP request/response handling
- Direct function calls instead of fetch requests

### 5. UI Components
- **Before**: Web components using TailwindCSS and Shadcn UI
- **After**: React Native components using StyleSheet
- Replaced HTML elements (`div`, `button`, `input`) with React Native components
- Converted Tailwind classes to StyleSheet objects
- Replaced `react-dropzone` with `react-native-document-picker`
- Removed web-specific UI libraries (Shadcn, Tailwind)

### 6. Navigation
- **Before**: Client-side routing with Next.js
- **After**: React Navigation with bottom tabs
- Implemented tab navigation for Assets, Agent, Music Agent, and Settings

### 7. Environment & Configuration
- **Before**: Next.js config files (`next.config.js`, `postcss.config.js`, `tailwind.config.ts`)
- **After**: React Native config (`babel.config.js`, `metro.config.js`)
- Removed Next.js-specific configurations
- Updated TypeScript config for React Native

### 8. Dependencies
- **Removed**:
  - `next`
  - `better-sqlite3`
  - `jszip`
  - `react-dropzone`
  - `next-themes`
  - `tailwindcss`
  - All Shadcn UI components
- **Added/Kept**:
  - `react-native-sqlite-storage`
  - `react-native-fs`
  - `react-native-document-picker`
  - `react-native-zip-archive`
  - `@react-navigation/native`
  - `@react-navigation/bottom-tabs`
  - `@react-native-async-storage/async-storage`

## File Changes

### New Files
- `App.tsx` - Main React Native app component
- `services/api.ts` - Service layer replacing API routes
- `README_RN.md` - React Native specific documentation
- `ANDROID_BUILD.md` - Android build instructions
- `CONVERSION_SUMMARY.md` - This file

### Modified Files
- `lib/db.ts` - Converted to React Native SQLite
- `lib/file-utils.ts` - Converted to React Native file system
- `lib/gemini-manager.ts` - Updated for React Native (AsyncStorage instead of env vars)
- `lib/utils.ts` - Kept utility functions (removed Tailwind-specific)
- `components/*.tsx` - All converted to React Native components
- `package.json` - Updated dependencies
- `tsconfig.json` - Updated for React Native
- `app.json` - Updated for React Native

### Unused Files (Can be removed)
- `app/` directory (Next.js routes)
- `next.config.js`
- `postcss.config.js`
- `tailwind.config.ts`
- `components/ui/` (Shadcn components)
- `components/theme-*.tsx` (theme components)

## Key Implementation Details

### Database
- All database operations are now async
- SQLite database stored in app's document directory
- Schema initialization happens on first app launch

### File Upload
- Uses `react-native-document-picker` for file selection
- Files saved to app's document directory
- ZIP extraction uses `react-native-zip-archive`

### API Keys
- Stored in SQLite database
- Can also be stored in AsyncStorage as fallback
- Automatic key cycling and retry logic maintained

### Error Handling
- Replaced Next.js error responses with React Native Alert dialogs
- Toast notifications replaced with Alert.alert()

### Styling
- All styles converted from Tailwind classes to StyleSheet objects
- Maintained similar visual design
- Responsive design adapted for mobile screens

## Next Steps

1. **Initialize Android Project** (if not exists):
   ```bash
   npx react-native init MusemeAndroid
   # Copy source files
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Build APK**:
   ```bash
   npm run build:android
   ```

4. **Test on Device**:
   - Transfer APK to Android device
   - Install and test all features

## Notes

- The app is Android-only. iOS support can be added later.
- All file operations use app's document directory (not external storage by default)
- Database is local-only (no cloud sync)
- Internet permission required for Gemini API calls
- Storage permissions needed for file uploads
