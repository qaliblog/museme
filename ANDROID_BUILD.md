# Android Build Instructions

This guide will help you build an APK for the Museme React Native app.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Java Development Kit (JDK)** 17 or higher
3. **Android Studio** with Android SDK
4. **React Native CLI**

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Install React Native CLI (if not already installed)

```bash
npm install -g react-native-cli
```

### 3. Initialize Android Project (if not already done)

If you don't have an `android` folder, initialize the React Native project:

```bash
npx react-native init MusemeAndroid --template react-native-template-typescript
```

Then copy your source files to the new project, or run:

```bash
npx react-native init MusemeAndroid
cd MusemeAndroid
# Copy your App.tsx, components, lib, services folders
```

Alternatively, if you already have the android folder, proceed to step 4.

### 4. Configure Android Project

#### Update `android/build.gradle`:

```gradle
buildscript {
    ext {
        buildToolsVersion = "33.0.0"
        minSdkVersion = 21
        compileSdkVersion = 33
        targetSdkVersion = 33
        ndkVersion = "23.1.7779620"
    }
    dependencies {
        classpath("com.android.tools.build:gradle:7.4.2")
        classpath("com.facebook.react:react-native-gradle-plugin")
    }
}
```

#### Update `android/app/build.gradle`:

Ensure you have the following:

```gradle
android {
    compileSdkVersion rootProject.ext.compileSdkVersion
    defaultConfig {
        applicationId "com.museme"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0"
    }
    ...
}
```

### 5. Add Required Permissions

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### 6. Link Native Modules

Some modules may need manual linking. Run:

```bash
cd android
./gradlew clean
cd ..
```

### 7. Build APK

#### Debug APK:

```bash
npm run android
```

Or manually:

```bash
cd android
./gradlew assembleDebug
```

The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Release APK:

```bash
npm run build:android
```

Or manually:

```bash
cd android
./gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

**Note**: For release builds, you'll need to configure signing. Create `android/app/release-signing.properties`:

```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=*****
MYAPP_RELEASE_KEY_PASSWORD=*****
```

And generate a keystore:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

## Troubleshooting

### Metro Bundler Issues

If you encounter Metro bundler issues:

```bash
npm start -- --reset-cache
```

### Gradle Build Issues

Clean and rebuild:

```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

### Missing Native Modules

If you get errors about missing native modules, ensure all dependencies are properly linked:

```bash
npm install
cd android
./gradlew clean
cd ..
npx react-native run-android
```

## Testing the APK

1. Enable "Install from Unknown Sources" on your Android device
2. Transfer the APK to your device
3. Install and run the app

## Notes

- The app uses SQLite for local storage
- Files are stored in the app's document directory
- Internet permission is required for Gemini API calls
- Storage permissions are needed for file uploads
