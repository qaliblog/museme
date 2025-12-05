import SQLite from 'react-native-sqlite-storage';

// Simple UUID generator for React Native
function randomUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

SQLite.DEBUG(true);
SQLite.enablePromise(true);

const DB_NAME = 'museme.db';
let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    try {
      db = await SQLite.openDatabase({
        name: DB_NAME,
        location: 'default',
      });
      await initializeSchema(db);
    } catch (error) {
      console.error('Error opening database:', error);
      throw error;
    }
  }
  return db;
}

async function initializeSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  const createTables = `
    CREATE TABLE IF NOT EXISTS gemini_api_keys (
      id TEXT PRIMARY KEY,
      key_value TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_used_at TEXT,
      usage_count INTEGER DEFAULT 0,
      error_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS music_assets (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      waveform_path TEXT,
      uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      description TEXT,
      category TEXT,
      tags TEXT,
      analyzed INTEGER DEFAULT 0,
      analysis_prompt TEXT,
      analysis_response TEXT
    );

    CREATE TABLE IF NOT EXISTS generated_songs (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      version INTEGER DEFAULT 1,
      prompt TEXT NOT NULL,
      edit_prompt TEXT,
      edit_time_start INTEGER,
      edit_time_end INTEGER,
      bpm INTEGER,
      duration_seconds INTEGER,
      structure TEXT,
      sounds_used TEXT,
      melody_description TEXT,
      generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      song_data TEXT,
      status TEXT DEFAULT 'pending',
      parent_song_id TEXT,
      FOREIGN KEY (parent_song_id) REFERENCES generated_songs(id)
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      current_version INTEGER DEFAULT 1,
      base_song_id TEXT,
      FOREIGN KEY (base_song_id) REFERENCES generated_songs(id)
    );

    CREATE INDEX IF NOT EXISTS idx_music_assets_filename ON music_assets(filename);
    CREATE INDEX IF NOT EXISTS idx_music_assets_category ON music_assets(category);
    CREATE INDEX IF NOT EXISTS idx_music_assets_analyzed ON music_assets(analyzed);
    CREATE INDEX IF NOT EXISTS idx_gemini_keys_active ON gemini_api_keys(is_active);
    CREATE INDEX IF NOT EXISTS idx_songs_project_id ON generated_songs(project_id);
    CREATE INDEX IF NOT EXISTS idx_songs_parent_id ON generated_songs(parent_song_id);
  `;

  const statements = createTables.split(';').filter(s => s.trim());
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await database.executeSql(statement.trim() + ';');
      } catch (error) {
        // Ignore errors for existing tables/indexes
        console.log('Schema initialization note:', error);
      }
    }
  }

  // Migrate existing generated_songs table if needed
  await migrateSchema(database);
}

async function migrateSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  try {
    // Check if projects table exists, if not, the schema is already up to date
    const [tableCheck] = await database.executeSql(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='projects'"
    );
    
    if (tableCheck.rows.length === 0) {
      // Projects table doesn't exist, but generated_songs might
      // Check if generated_songs has the new columns
      const [columnsCheck] = await database.executeSql(
        "PRAGMA table_info(generated_songs)"
      );
      
      const columnNames: string[] = [];
      for (let i = 0; i < columnsCheck.rows.length; i++) {
        columnNames.push(columnsCheck.rows.item(i).name);
      }

      // Add missing columns to generated_songs if they don't exist
      if (!columnNames.includes('project_id')) {
        await database.executeSql(
          'ALTER TABLE generated_songs ADD COLUMN project_id TEXT'
        );
      }
      if (!columnNames.includes('version')) {
        await database.executeSql(
          'ALTER TABLE generated_songs ADD COLUMN version INTEGER DEFAULT 1'
        );
      }
      if (!columnNames.includes('edit_prompt')) {
        await database.executeSql(
          'ALTER TABLE generated_songs ADD COLUMN edit_prompt TEXT'
        );
      }
      if (!columnNames.includes('edit_time_start')) {
        await database.executeSql(
          'ALTER TABLE generated_songs ADD COLUMN edit_time_start INTEGER'
        );
      }
      if (!columnNames.includes('edit_time_end')) {
        await database.executeSql(
          'ALTER TABLE generated_songs ADD COLUMN edit_time_end INTEGER'
        );
      }
      if (!columnNames.includes('parent_song_id')) {
        await database.executeSql(
          'ALTER TABLE generated_songs ADD COLUMN parent_song_id TEXT'
        );
      }
    }
  } catch (error) {
    // Migration errors are non-critical, log and continue
    console.log('Migration note:', error);
  }
}

// Helper functions for common operations
export const dbHelpers = {
  // API Keys
  getApiKeys: async (): Promise<any[]> => {
    const database = await getDb();
    const [results] = await database.executeSql(
      'SELECT * FROM gemini_api_keys ORDER BY created_at DESC'
    );
    const rows: any[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      rows.push(results.rows.item(i));
    }
    return rows;
  },

  getActiveApiKeys: async (): Promise<any[]> => {
    const database = await getDb();
    const [results] = await database.executeSql(
      'SELECT * FROM gemini_api_keys WHERE is_active = 1 ORDER BY last_used_at ASC, created_at ASC'
    );
    const rows: any[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      rows.push(results.rows.item(i));
    }
    return rows;
  },

  addApiKey: async (key: string): Promise<any> => {
    const database = await getDb();
    const id = randomUUID();
    await database.executeSql(
      'INSERT INTO gemini_api_keys (id, key_value, is_active) VALUES (?, ?, 1)',
      [id, key]
    );
    const [results] = await database.executeSql(
      'SELECT * FROM gemini_api_keys WHERE id = ?',
      [id]
    );
    return results.rows.item(0);
  },

  deleteApiKey: async (id: string): Promise<void> => {
    const database = await getDb();
    await database.executeSql('DELETE FROM gemini_api_keys WHERE id = ?', [id]);
  },

  updateApiKey: async (
    id: string,
    updates: {
      is_active?: boolean;
      last_used_at?: string;
      usage_count?: number;
      error_count?: number;
    }
  ): Promise<void> => {
    const database = await getDb();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(updates.is_active ? 1 : 0);
    }
    if (updates.last_used_at !== undefined) {
      fields.push('last_used_at = ?');
      values.push(updates.last_used_at);
    }
    if (updates.usage_count !== undefined) {
      fields.push('usage_count = ?');
      values.push(updates.usage_count);
    }
    if (updates.error_count !== undefined) {
      fields.push('error_count = ?');
      values.push(updates.error_count);
    }

    if (fields.length === 0) return;

    values.push(id);
    await database.executeSql(
      `UPDATE gemini_api_keys SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  // Music Assets
  getAllAssets: async (): Promise<any[]> => {
    const database = await getDb();
    const [results] = await database.executeSql(
      'SELECT * FROM music_assets ORDER BY uploaded_at DESC'
    );
    const rows: any[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      rows.push(results.rows.item(i));
    }
    return rows;
  },

  getUnanalyzedAssets: async (): Promise<any[]> => {
    const database = await getDb();
    const [results] = await database.executeSql(
      'SELECT * FROM music_assets WHERE analyzed = 0'
    );
    const rows: any[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      rows.push(results.rows.item(i));
    }
    return rows;
  },

  getAnalyzedAssets: async (): Promise<any[]> => {
    const database = await getDb();
    const [results] = await database.executeSql(
      'SELECT filename, description, category, tags FROM music_assets WHERE analyzed = 1'
    );
    const rows: any[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      rows.push(results.rows.item(i));
    }
    return rows;
  },

  addAsset: async (asset: {
    filename: string;
    file_type: string;
    file_size: number;
    file_path: string;
    waveform_path?: string;
  }): Promise<any> => {
    const database = await getDb();
    const id = randomUUID();
    await database.executeSql(
      `INSERT INTO music_assets (id, filename, file_type, file_size, file_path, waveform_path, analyzed)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [
        id,
        asset.filename,
        asset.file_type,
        asset.file_size,
        asset.file_path,
        asset.waveform_path || null,
      ]
    );
    const [results] = await database.executeSql(
      'SELECT * FROM music_assets WHERE id = ?',
      [id]
    );
    return results.rows.item(0);
  },

  updateAsset: async (
    id: string,
    updates: {
      description?: string;
      category?: string;
      tags?: string[];
      analyzed?: boolean;
      analysis_prompt?: string;
      analysis_response?: string;
    }
  ): Promise<void> => {
    const database = await getDb();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category);
    }
    if (updates.tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(updates.tags));
    }
    if (updates.analyzed !== undefined) {
      fields.push('analyzed = ?');
      values.push(updates.analyzed ? 1 : 0);
    }
    if (updates.analysis_prompt !== undefined) {
      fields.push('analysis_prompt = ?');
      values.push(updates.analysis_prompt);
    }
    if (updates.analysis_response !== undefined) {
      fields.push('analysis_response = ?');
      values.push(updates.analysis_response);
    }

    if (fields.length === 0) return;

    values.push(id);
    await database.executeSql(
      `UPDATE music_assets SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  // Generated Songs
  getAllSongs: async (): Promise<any[]> => {
    const database = await getDb();
    const [results] = await database.executeSql(
      'SELECT * FROM generated_songs ORDER BY generated_at DESC'
    );
    const rows: any[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      const song = results.rows.item(i);
      rows.push({
        ...song,
        structure: song.structure ? JSON.parse(song.structure) : null,
        sounds_used: song.sounds_used ? JSON.parse(song.sounds_used) : [],
        song_data: song.song_data ? JSON.parse(song.song_data) : null,
      });
    }
    return rows;
  },

  addSong: async (song: {
    prompt: string;
    project_id?: string;
    version?: number;
    edit_prompt?: string;
    edit_time_start?: number;
    edit_time_end?: number;
    parent_song_id?: string;
    bpm?: number;
    duration_seconds?: number;
    structure?: any;
    sounds_used?: string[];
    melody_description?: string;
    song_data?: any;
    status?: string;
  }): Promise<any> => {
    const database = await getDb();
    const id = randomUUID();
    await database.executeSql(
      `INSERT INTO generated_songs (
        id, project_id, version, prompt, edit_prompt, edit_time_start, edit_time_end,
        parent_song_id, bpm, duration_seconds, structure, sounds_used,
        melody_description, song_data, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        song.project_id || null,
        song.version || 1,
        song.prompt,
        song.edit_prompt || null,
        song.edit_time_start || null,
        song.edit_time_end || null,
        song.parent_song_id || null,
        song.bpm || null,
        song.duration_seconds || null,
        song.structure ? JSON.stringify(song.structure) : null,
        song.sounds_used ? JSON.stringify(song.sounds_used) : null,
        song.melody_description || null,
        song.song_data ? JSON.stringify(song.song_data) : null,
        song.status || 'pending',
      ]
    );
    const [results] = await database.executeSql(
      'SELECT * FROM generated_songs WHERE id = ?',
      [id]
    );
    const saved = results.rows.item(0);
    return {
      ...saved,
      structure: saved.structure ? JSON.parse(saved.structure) : null,
      sounds_used: saved.sounds_used ? JSON.parse(saved.sounds_used) : [],
      song_data: saved.song_data ? JSON.parse(saved.song_data) : null,
    };
  },

  updateSong: async (id: string, updates: {
    project_id?: string;
    version?: number;
  }): Promise<void> => {
    const database = await getDb();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.project_id !== undefined) {
      fields.push('project_id = ?');
      values.push(updates.project_id);
    }
    if (updates.version !== undefined) {
      fields.push('version = ?');
      values.push(updates.version);
    }

    if (fields.length === 0) return;

    values.push(id);
    await database.executeSql(
      `UPDATE generated_songs SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  // Projects
  createProject: async (name: string, baseSongId: string, description?: string): Promise<any> => {
    const database = await getDb();
    const id = randomUUID();
    await database.executeSql(
      `INSERT INTO projects (id, name, description, base_song_id, current_version)
       VALUES (?, ?, ?, ?, 1)`,
      [id, name, description || null, baseSongId]
    );
    const [results] = await database.executeSql(
      'SELECT * FROM projects WHERE id = ?',
      [id]
    );
    return results.rows.item(0);
  },

  getAllProjects: async (): Promise<any[]> => {
    const database = await getDb();
    const [results] = await database.executeSql(
      'SELECT * FROM projects ORDER BY updated_at DESC'
    );
    const rows: any[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      rows.push(results.rows.item(i));
    }
    return rows;
  },

  getProject: async (projectId: string): Promise<any> => {
    const database = await getDb();
    const [results] = await database.executeSql(
      'SELECT * FROM projects WHERE id = ?',
      [projectId]
    );
    if (results.rows.length > 0) {
      return results.rows.item(0);
    }
    return null;
  },

  getProjectSongs: async (projectId: string): Promise<any[]> => {
    const database = await getDb();
    const [results] = await database.executeSql(
      'SELECT * FROM generated_songs WHERE project_id = ? ORDER BY version ASC',
      [projectId]
    );
    const rows: any[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      const song = results.rows.item(i);
      rows.push({
        ...song,
        structure: song.structure ? JSON.parse(song.structure) : null,
        sounds_used: song.sounds_used ? JSON.parse(song.sounds_used) : [],
        song_data: song.song_data ? JSON.parse(song.song_data) : null,
      });
    }
    return rows;
  },

  getLatestProjectSong: async (projectId: string): Promise<any> => {
    const database = await getDb();
    const [results] = await database.executeSql(
      'SELECT * FROM generated_songs WHERE project_id = ? ORDER BY version DESC LIMIT 1',
      [projectId]
    );
    if (results.rows.length > 0) {
      const song = results.rows.item(0);
      return {
        ...song,
        structure: song.structure ? JSON.parse(song.structure) : null,
        sounds_used: song.sounds_used ? JSON.parse(song.sounds_used) : [],
        song_data: song.song_data ? JSON.parse(song.song_data) : null,
      };
    }
    return null;
  },

  updateProject: async (projectId: string, updates: {
    name?: string;
    description?: string;
    current_version?: number;
  }): Promise<void> => {
    const database = await getDb();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.current_version !== undefined) {
      fields.push('current_version = ?');
      values.push(updates.current_version);
    }
    fields.push('updated_at = CURRENT_TIMESTAMP');

    if (fields.length === 0) return;

    values.push(projectId);
    await database.executeSql(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  deleteProject: async (projectId: string): Promise<void> => {
    const database = await getDb();
    await database.executeSql('DELETE FROM projects WHERE id = ?', [projectId]);
  },
};

// Close database connection (useful for cleanup)
export async function closeDb(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}
