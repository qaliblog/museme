import { GoogleGenerativeAI } from '@google/generative-ai';
import { dbHelpers } from './db';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GeminiResponse {
  success: boolean;
  data?: any;
  error?: string;
  keyUsed?: string;
}

export class GeminiManager {
  private currentKeyIndex: number = 0;
  private keys: string[] = [];
  private lastPrompt: string = '';

  async initialize() {
    await this.loadKeys();
  }

  private async loadKeys() {
    try {
      const activeKeys = await dbHelpers.getActiveApiKeys();
      this.keys = activeKeys.map((k: any) => k.key_value) || [];

      // Also load from AsyncStorage as fallback
      const storedKeys = await AsyncStorage.getItem('GEMINI_API_KEYS');
      if (storedKeys) {
        const envKeys = storedKeys.split(',').filter((k) => k.trim());
        this.keys = [...new Set([...this.keys, ...envKeys])];
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
      // Fallback to stored keys only
      const storedKeys = await AsyncStorage.getItem('GEMINI_API_KEYS');
      this.keys = storedKeys
        ? storedKeys.split(',').filter((k) => k.trim())
        : [];
    }
  }

  private async getNextKey(): Promise<string | null> {
    if (this.keys.length === 0) {
      await this.loadKeys();
    }

    if (this.keys.length === 0) {
      return null;
    }

    const key = this.keys[this.currentKeyIndex];
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
    return key;
  }

  private async updateKeyUsage(key: string, success: boolean) {
    try {
      const allKeys = await dbHelpers.getApiKeys();
      const keyRecord = allKeys.find((k: any) => k.key_value === key);

      if (keyRecord) {
        await dbHelpers.updateApiKey(keyRecord.id, {
          last_used_at: new Date().toISOString(),
          usage_count: (keyRecord.usage_count || 0) + 1,
          error_count: success
            ? keyRecord.error_count || 0
            : (keyRecord.error_count || 0) + 1,
        });
      }
    } catch (error) {
      console.error('Error updating key usage:', error);
    }
  }

  private isRetryableError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code || '';

    return (
      errorMessage.includes('rpd') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('quota') ||
      errorCode === 429 ||
      errorMessage.includes('resource_exhausted')
    );
  }

  async callGemini(
    prompt: string,
    model: string = 'gemini-pro',
    retries: number = 3
  ): Promise<GeminiResponse> {
    this.lastPrompt = prompt;
    const initialKeyCount = this.keys.length;
    let attempts = 0;

    while (attempts < retries * initialKeyCount) {
      const key = await this.getNextKey();

      if (!key) {
        return {
          success: false,
          error: 'No API keys available',
        };
      }

      try {
        const genAI = new GoogleGenerativeAI(key);
        const modelInstance = genAI.getGenerativeModel({ model });

        const result = await modelInstance.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        await this.updateKeyUsage(key, true);

        return {
          success: true,
          data: text,
          keyUsed: key,
        };
      } catch (error: any) {
        console.error(
          `API call failed with key ${key.substring(0, 10)}...:`,
          error
        );

        await this.updateKeyUsage(key, false);

        if (this.isRetryableError(error)) {
          attempts++;
          // Wait a bit before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
          continue;
        } else {
          // Non-retryable error
          return {
            success: false,
            error: error.message || 'Unknown error',
            keyUsed: key,
          };
        }
      }
    }

    return {
      success: false,
      error: 'All retry attempts exhausted',
    };
  }

  async analyzeSound(
    filename: string,
    fileType: string
  ): Promise<GeminiResponse> {
    const prompt = `Analyze this audio file and provide a JSON response with the following structure:
{
  "name": "${filename}",
  "description": "Detailed description of the sound",
  "category": "snare|kick|hihat|percussion|melody|bass|fx|other",
  "tags": ["tag1", "tag2", "tag3"]
}

File: ${filename}
Type: ${fileType}

Provide ONLY the JSON response, no additional text.`;

    return this.callGemini(prompt);
  }

  async generateSong(
    userPrompt: string,
    availableSamples: Array<{
      filename: string;
      description: string;
      category: string;
      tags: string[];
    }>
  ): Promise<GeminiResponse> {
    const samplesList = availableSamples
      .map(
        (s) =>
          `- ${s.filename} (${s.category}): ${s.description} [${s.tags.join(', ')}]`
      )
      .join('\n');

    const prompt = `You are a music production AI. Generate a complete song arrangement based on the user's request.

User Request: ${userPrompt}

Available Samples:
${samplesList}

Generate a JSON response with the following structure:
{
  "bpm": 90,
  "duration_seconds": 180,
  "structure": [
    {"section": "intro", "start": 0, "length": 8},
    {"section": "verse", "start": 8, "length": 32},
    {"section": "hook", "start": 40, "length": 16},
    {"section": "verse", "start": 56, "length": 32},
    {"section": "hook", "start": 88, "length": 16},
    {"section": "bridge", "start": 104, "length": 16},
    {"section": "outro", "start": 120, "length": 8}
  ],
  "sounds_used": ["snare_04.wav", "kick_02.wav", "hihat_roll.wav"],
  "melody_description": "Soft keys in minor scale with airy pads",
  "arrangement_notes": "Detailed notes about the arrangement"
}

The song should be approximately 3 minutes (180 seconds). Use the available samples creatively. Provide ONLY the JSON response, no additional text.`;

    return this.callGemini(prompt);
  }

  async editSong(
    userPrompt: string,
    existingSong: any,
    availableSamples: Array<{
      filename: string;
      description: string;
      category: string;
      tags: string[];
    }>,
    timeStart?: number,
    timeEnd?: number
  ): Promise<GeminiResponse> {
    const samplesList = availableSamples
      .map(
        (s) =>
          `- ${s.filename} (${s.category}): ${s.description} [${s.tags.join(', ')}]`
      )
      .join('\n');

    const existingStructure = existingSong.structure
      ? JSON.stringify(existingSong.structure, null, 2)
      : 'No structure defined';
    const existingSounds = existingSong.sounds_used
      ? existingSong.sounds_used.join(', ')
      : 'No sounds defined';
    const existingMelody = existingSong.melody_description || 'No melody description';

    let timeFrameContext = '';
    if (timeStart !== undefined && timeEnd !== undefined) {
      timeFrameContext = `\n\nIMPORTANT: The user wants to edit ONLY the time frame from ${timeStart} seconds to ${timeEnd} seconds. Keep the rest of the song unchanged.`;
    }

    const prompt = `You are a music production AI. Edit an existing song arrangement based on the user's request.

Existing Song Details:
- BPM: ${existingSong.bpm || 'Unknown'}
- Duration: ${existingSong.duration_seconds || 'Unknown'} seconds
- Current Structure: ${existingStructure}
- Current Sounds Used: ${existingSounds}
- Current Melody: ${existingMelody}
${timeFrameContext}

User Edit Request: ${userPrompt}

Available Samples:
${samplesList}

${timeStart !== undefined && timeEnd !== undefined
        ? `Generate a JSON response that modifies ONLY the section from ${timeStart}s to ${timeEnd}s, keeping the rest of the song structure intact.`
        : 'Generate a complete updated JSON response with the following structure:'}
{
  "bpm": ${existingSong.bpm || 90},
  "duration_seconds": ${existingSong.duration_seconds || 180},
  "structure": [
    {"section": "intro", "start": 0, "length": 8},
    {"section": "verse", "start": 8, "length": 32},
    {"section": "hook", "start": 40, "length": 16},
    {"section": "verse", "start": 56, "length": 32},
    {"section": "hook", "start": 88, "length": 16},
    {"section": "bridge", "start": 104, "length": 16},
    {"section": "outro", "start": 120, "length": 8}
  ],
  "sounds_used": ["snare_04.wav", "kick_02.wav", "hihat_roll.wav"],
  "melody_description": "Updated melody description",
  "arrangement_notes": "Notes about what was changed"
}

${timeStart !== undefined && timeEnd !== undefined
        ? `Focus on modifying sections that overlap with the ${timeStart}s-${timeEnd}s time frame.`
        : 'Update the entire song based on the user\'s request.'}
Provide ONLY the JSON response, no additional text.`;

    return this.callGemini(prompt);
  }
}

export const geminiManager = new GeminiManager();
