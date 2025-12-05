import RNFS from 'react-native-fs';
import { unzip } from 'react-native-zip-archive';
import { Platform } from 'react-native';

const UPLOAD_DIR = `${RNFS.DocumentDirectoryPath}/uploads`;
const MAX_FILE_SIZE = 52428800; // 50MB

export async function ensureUploadDir(): Promise<void> {
  try {
    const dirExists = await RNFS.exists(UPLOAD_DIR);
    if (!dirExists) {
      await RNFS.mkdir(UPLOAD_DIR);
    }
    const assetsDir = `${UPLOAD_DIR}/assets`;
    const assetsExists = await RNFS.exists(assetsDir);
    if (!assetsExists) {
      await RNFS.mkdir(assetsDir);
    }
    const waveformsDir = `${UPLOAD_DIR}/waveforms`;
    const waveformsExists = await RNFS.exists(waveformsDir);
    if (!waveformsExists) {
      await RNFS.mkdir(waveformsDir);
    }
  } catch (error) {
    console.error('Error creating upload directory:', error);
  }
}

export async function saveFile(
  fileUri: string,
  filename: string
): Promise<string> {
  await ensureUploadDir();

  const stats = await RNFS.stat(fileUri);
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE} bytes`);
  }

  const destPath = `${UPLOAD_DIR}/assets/${filename}`;
  await RNFS.copyFile(fileUri, destPath);
  return destPath;
}

export async function extractZipWithJSZip(
  zipPath: string
): Promise<string[]> {
  const extractedFiles: string[] = [];
  const extractDir = `${UPLOAD_DIR}/assets/extracted_${Date.now()}`;

  await RNFS.mkdir(extractDir);

  try {
    const extractedPath = await unzip(zipPath, extractDir);
    
    // List all files in extracted directory
    const files = await RNFS.readDir(extractDir);
    
    for (const file of files) {
      if (file.isFile()) {
        extractedFiles.push(file.path);
      } else if (file.isDirectory()) {
        // Recursively get files from subdirectories
        const subFiles = await RNFS.readDir(file.path);
        for (const subFile of subFiles) {
          if (subFile.isFile()) {
            extractedFiles.push(subFile.path);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error extracting ZIP:', error);
    throw error;
  }

  return extractedFiles;
}

export async function getFileMetadata(filePath: string) {
  const stats = await RNFS.stat(filePath);
  const filename = filePath.split('/').pop() || '';
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  return {
    filename,
    fileType: ext,
    fileSize: stats.size,
    filePath,
  };
}
