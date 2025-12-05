import { dbHelpers } from '../lib/db';
import { geminiManager } from '../lib/gemini-manager';
import {
  ensureUploadDir,
  saveFile,
  extractZipWithJSZip,
  getFileMetadata,
} from '../lib/file-utils';
import { isAudioFile } from '../lib/utils';
import RNFS from 'react-native-fs';

// Assets API
export const assetsApi = {
  getAll: async () => {
    try {
      return await dbHelpers.getAllAssets();
    } catch (error: any) {
      console.error('Error fetching assets:', error);
      throw new Error(error.message || 'Failed to fetch assets');
    }
  },
};

// Upload API
export const uploadApi = {
  upload: async (fileUri: string, filename: string) => {
    try {
      await ensureUploadDir();

      const ext = filename.split('.').pop()?.toLowerCase();
      let savedFiles: string[] = [];

      // Handle ZIP files
      if (ext === 'zip') {
        try {
          const extractedFiles = await extractZipWithJSZip(fileUri);
          savedFiles = extractedFiles;

          // Save metadata for each extracted file
          for (const filePath of extractedFiles) {
            const metadata = await getFileMetadata(filePath);

            if (isAudioFile(metadata.filename)) {
              try {
                await dbHelpers.addAsset({
                  filename: metadata.filename,
                  file_type: metadata.fileType,
                  file_size: metadata.fileSize,
                  file_path: filePath,
                });
              } catch (error) {
                console.error('Error saving metadata:', error);
              }
            }
          }
        } catch (error: any) {
          console.error('Error extracting archive:', error);
          throw new Error(`Failed to extract archive: ${error.message}`);
        }
      } else if (ext === 'rar') {
        throw new Error('RAR file support coming soon. Please use ZIP format.');
      } else {
        // Handle individual audio files
        const destPath = await saveFile(fileUri, filename);
        savedFiles = [destPath];

        const metadata = await getFileMetadata(destPath);

        try {
          await dbHelpers.addAsset({
            filename: metadata.filename,
            file_type: metadata.fileType,
            file_size: metadata.fileSize,
            file_path: destPath,
          });
        } catch (error: any) {
          console.error('Error saving metadata:', error);
          throw new Error('Failed to save file metadata');
        }
      }

      return {
        success: true,
        message: `Uploaded ${savedFiles.length} file(s)`,
        files: savedFiles.length,
      };
    } catch (error: any) {
      console.error('Upload error:', error);
      throw new Error(error.message || 'Upload failed');
    }
  },
};

// Analyze API
export const analyzeApi = {
  analyzeAll: async () => {
    try {
      await geminiManager.initialize();

      // Get all unanalyzed assets
      const assets = await dbHelpers.getUnanalyzedAssets();

      if (!assets || assets.length === 0) {
        return {
          success: true,
          count: 0,
          message: 'No unanalyzed assets found',
        };
      }

      let analyzedCount = 0;

      // Analyze each asset
      for (const asset of assets) {
        try {
          const result = await geminiManager.analyzeSound(
            asset.filename,
            asset.file_type
          );

          if (result.success && result.data) {
            // Parse JSON response
            let analysisData;
            try {
              // Extract JSON from response (handle cases where AI adds extra text)
              const jsonMatch = result.data.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                analysisData = JSON.parse(jsonMatch[0]);
              } else {
                throw new Error('No JSON found in response');
              }
            } catch (parseError) {
              console.error('Error parsing analysis response:', parseError);
              continue;
            }

            // Update asset with analysis
            try {
              await dbHelpers.updateAsset(asset.id, {
                description: analysisData.description,
                category: analysisData.category,
                tags: analysisData.tags || [],
                analyzed: true,
                analysis_prompt: `Analyze this audio file: ${asset.filename}`,
                analysis_response: result.data,
              });
              analyzedCount++;
            } catch (updateError) {
              console.error('Error updating asset:', updateError);
              continue;
            }
          }
        } catch (error: any) {
          console.error(`Error analyzing ${asset.filename}:`, error);
          continue;
        }
      }

      return {
        success: true,
        count: analyzedCount,
        message: `Analyzed ${analyzedCount} of ${assets.length} assets`,
      };
    } catch (error: any) {
      console.error('Analysis error:', error);
      throw new Error(error.message || 'Analysis failed');
    }
  },
};

// Songs API
export const songsApi = {
  getAll: async () => {
    try {
      return await dbHelpers.getAllSongs();
    } catch (error: any) {
      console.error('Error fetching songs:', error);
      throw new Error(error.message || 'Failed to fetch songs');
    }
  },

  generate: async (prompt: string, createProject: boolean = true, projectName?: string) => {
    try {
      await geminiManager.initialize();

      if (!prompt || typeof prompt !== 'string') {
        throw new Error('Prompt is required');
      }

      // Get all analyzed assets
      const assets = await dbHelpers.getAnalyzedAssets();

      const availableSamples = (assets || []).map((asset: any) => ({
        filename: asset.filename,
        description: asset.description || '',
        category: asset.category || 'other',
        tags: asset.tags ? JSON.parse(asset.tags) : [],
      }));

      // Generate song arrangement
      const result = await geminiManager.generateSong(prompt, availableSamples);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to generate song');
      }

      // Parse JSON response
      let songData;
      try {
        const jsonMatch = result.data.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          songData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError: any) {
        throw new Error(`Failed to parse song data: ${parseError.message}`);
      }

      // Save to database
      try {
        const savedSong = await dbHelpers.addSong({
          prompt,
          bpm: songData.bpm,
          duration_seconds: songData.duration_seconds,
          structure: songData.structure,
          sounds_used: songData.sounds_used,
          melody_description: songData.melody_description,
          song_data: songData,
          status: 'completed',
        });

        // Create project if requested
        let project = null;
        if (createProject) {
          const projectNameToUse = projectName || `Beat - ${new Date().toLocaleDateString()}`;
          project = await dbHelpers.createProject(projectNameToUse, savedSong.id, prompt);
          // Update song with project_id
          await dbHelpers.updateSong(savedSong.id, { project_id: project.id });
          savedSong.project_id = project.id;
        }

        return {
          success: true,
          song: savedSong,
          project: project,
        };
      } catch (saveError) {
        console.error('Error saving song:', saveError);
        throw new Error('Failed to save song');
      }
    } catch (error: any) {
      console.error('Song generation error:', error);
      throw new Error(error.message || 'Song generation failed');
    }
  },

  editProject: async (
    projectId: string,
    editPrompt: string,
    timeStart?: number,
    timeEnd?: number
  ) => {
    try {
      await geminiManager.initialize();

      if (!editPrompt || typeof editPrompt !== 'string') {
        throw new Error('Edit prompt is required');
      }

      // Get the latest version of the project
      const latestSong = await dbHelpers.getLatestProjectSong(projectId);
      if (!latestSong) {
        throw new Error('Project not found');
      }

      // Get project info
      const project = await dbHelpers.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Get all analyzed assets
      const assets = await dbHelpers.getAnalyzedAssets();
      const availableSamples = (assets || []).map((asset: any) => ({
        filename: asset.filename,
        description: asset.description || '',
        category: asset.category || 'other',
        tags: asset.tags ? JSON.parse(asset.tags) : [],
      }));

      // Edit song arrangement
      const result = await geminiManager.editSong(
        editPrompt,
        latestSong,
        availableSamples,
        timeStart,
        timeEnd
      );

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to edit song');
      }

      // Parse JSON response
      let songData;
      try {
        const jsonMatch = result.data.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          songData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError: any) {
        throw new Error(`Failed to parse song data: ${parseError.message}`);
      }

      // Save new version
      try {
        const newVersion = (project.current_version || 1) + 1;
        const savedSong = await dbHelpers.addSong({
          prompt: latestSong.prompt,
          project_id: projectId,
          version: newVersion,
          edit_prompt: editPrompt,
          edit_time_start: timeStart,
          edit_time_end: timeEnd,
          parent_song_id: latestSong.id,
          bpm: songData.bpm,
          duration_seconds: songData.duration_seconds,
          structure: songData.structure,
          sounds_used: songData.sounds_used,
          melody_description: songData.melody_description,
          song_data: songData,
          status: 'completed',
        });

        // Update project version
        await dbHelpers.updateProject(projectId, { current_version: newVersion });

        return {
          success: true,
          song: savedSong,
          version: newVersion,
        };
      } catch (saveError) {
        console.error('Error saving edited song:', saveError);
        throw new Error('Failed to save edited song');
      }
    } catch (error: any) {
      console.error('Song editing error:', error);
      throw new Error(error.message || 'Song editing failed');
    }
  },
};

// Projects API
export const projectsApi = {
  getAll: async () => {
    try {
      const projects = await dbHelpers.getAllProjects();
      // Get latest song for each project
      const projectsWithSongs = await Promise.all(
        projects.map(async (project: any) => {
          const latestSong = await dbHelpers.getLatestProjectSong(project.id);
          return {
            ...project,
            latestSong,
          };
        })
      );
      return projectsWithSongs;
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      throw new Error(error.message || 'Failed to fetch projects');
    }
  },

  get: async (projectId: string) => {
    try {
      const project = await dbHelpers.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }
      const songs = await dbHelpers.getProjectSongs(projectId);
      return {
        ...project,
        songs,
      };
    } catch (error: any) {
      console.error('Error fetching project:', error);
      throw new Error(error.message || 'Failed to fetch project');
    }
  },

  delete: async (projectId: string) => {
    try {
      await dbHelpers.deleteProject(projectId);
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting project:', error);
      throw new Error(error.message || 'Failed to delete project');
    }
  },
};

// Keys API
export const keysApi = {
  getAll: async () => {
    try {
      return await dbHelpers.getApiKeys();
    } catch (error: any) {
      console.error('Error:', error);
      throw new Error(error.message || 'Failed to fetch keys');
    }
  },

  add: async (key: string) => {
    try {
      if (!key || typeof key !== 'string') {
        throw new Error('API key is required');
      }

      try {
        const savedKey = await dbHelpers.addApiKey(key);
        return {
          success: true,
          key: savedKey,
        };
      } catch (error: any) {
        console.error('Error adding key:', error);
        throw new Error('Failed to add API key');
      }
    } catch (error: any) {
      console.error('Error:', error);
      throw new Error(error.message || 'Failed to add key');
    }
  },

  delete: async (id: string) => {
    try {
      await dbHelpers.deleteApiKey(id);
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting key:', error);
      throw new Error(error.message || 'Failed to delete key');
    }
  },

  update: async (id: string, is_active: boolean) => {
    try {
      await dbHelpers.updateApiKey(id, { is_active });
      return { success: true };
    } catch (error: any) {
      console.error('Error updating key:', error);
      throw new Error(error.message || 'Failed to update key');
    }
  },
};
