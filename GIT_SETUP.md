# Git Setup Instructions

## Adding the Remote Repository

To add the remote repository, run the following commands:

```bash
# Initialize git repository (if not already initialized)
git init

# Add the remote repository
git remote add origin git@github.com:qaliblog/museme.git

# Or if remote already exists, update it:
git remote set-url origin git@github.com:qaliblog/museme.git

# Verify the remote
git remote -v
```

## GitHub Actions Workflow

The repository includes GitHub Actions workflows for building Android APKs:

### 1. Build APK Workflow (`.github/workflows/build-apk.yml`)
- **Triggers**: 
  - Push to main/master branch
  - Pull requests to main/master
  - Manual trigger via workflow_dispatch
- **Output**: Unsigned release APK
- **Artifact**: Uploaded as `app-release-apk` (retained for 30 days)

### 2. Build Signed APK Workflow (`.github/workflows/build-apk-signed.yml`)
- **Trigger**: Manual only (workflow_dispatch)
- **Requirements**: 
  - Base64 encoded keystore file
  - Keystore password
  - Key alias
  - Key password
- **Output**: Signed release APK
- **Artifact**: Uploaded as `app-release-signed-apk` (retained for 30 days)

## Using the Workflows

### Automatic Build (Unsigned APK)
1. Push code to main/master branch
2. Workflow runs automatically
3. Download APK from Actions tab → Artifacts

### Manual Build (Unsigned APK)
1. Go to Actions tab in GitHub
2. Select "Build Android APK" workflow
3. Click "Run workflow"
4. Select branch and click "Run workflow"
5. Download APK from the completed run

### Signed APK Build
1. Encode your keystore file:
   ```bash
   base64 -i my-release-key.keystore
   ```
2. Go to Actions tab → "Build Signed Android APK"
3. Click "Run workflow"
4. Fill in the form:
   - Paste base64 encoded keystore
   - Enter keystore password
   - Enter key alias
   - Enter key password
5. Run the workflow
6. Download signed APK from artifacts

## Prerequisites

The workflows require:
- Android project initialized in `android/` directory
- `package.json` with React Native dependencies
- Proper `android/app/build.gradle` configuration

## Notes

- The unsigned APK workflow builds automatically on push
- The signed APK workflow requires manual input for security
- APKs are available for 30 days as artifacts
- For production releases, use the signed APK workflow
