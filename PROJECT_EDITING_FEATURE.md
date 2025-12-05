# Project Editing Feature

This document describes the new project/beat editing functionality that allows users to save beats as projects and edit them with subsequent prompts.

## Features

### 1. Project Management
- **Automatic Project Creation**: When generating a new beat, it's automatically saved as a project
- **Project Naming**: Users can optionally name their projects
- **Version Tracking**: Each edit creates a new version while preserving the history
- **Project List**: View all projects with their latest versions

### 2. Beat Editing
- **Edit Existing Projects**: Users can make a second prompt on any project to edit it
- **Full Song Editing**: Edit the entire beat with a new prompt
- **Time-Frame Editing**: Edit specific time ranges (e.g., 0-30 seconds, 60-90 seconds)
- **Edit History**: Track all edits with version numbers

### 3. Time-Frame Specific Editing
- **Selective Editing**: Edit only a portion of the song by specifying start and end times
- **Context Preservation**: The AI maintains the rest of the song while editing the specified time frame
- **Flexible Time Ranges**: Any time range can be specified (e.g., intro, verse, hook sections)

## Database Schema Changes

### New Tables
- **projects**: Stores project metadata
  - `id`: Unique project identifier
  - `name`: Project name
  - `description`: Optional description
  - `created_at`: Creation timestamp
  - `updated_at`: Last update timestamp
  - `current_version`: Latest version number
  - `base_song_id`: Reference to the original song

### Updated Tables
- **generated_songs**: Extended with project support
  - `project_id`: Links song to a project
  - `version`: Version number within the project
  - `edit_prompt`: The prompt used for this edit
  - `edit_time_start`: Start time for time-frame edits (optional)
  - `edit_time_end`: End time for time-frame edits (optional)
  - `parent_song_id`: Reference to the previous version

## Usage

### Creating a New Project/Beat

1. Go to the **Music Agent** tab
2. (Optional) Enter a project name
3. Enter your song generation prompt
4. Tap "Generate New Beat"
5. The beat is automatically saved as a project

### Editing an Existing Project

1. In the **Music Agent** tab, find your project
2. Tap the **"Edit"** button on the project card
3. Enter your edit prompt (e.g., "Add more hi-hats", "Increase tempo", "Change melody")
4. (Optional) Specify a time frame:
   - Leave empty to edit the entire song
   - Enter start and end times (in seconds) to edit only that section
5. Tap **"Apply Edit"**
6. A new version is created with your edits

### Time-Frame Editing Examples

- **Edit intro only**: Start: 0, End: 8
- **Edit verse section**: Start: 8, End: 40
- **Edit hook**: Start: 40, End: 56
- **Edit bridge**: Start: 104, End: 120

## API Changes

### New Service Functions

#### `songsApi.generate()`
- Now accepts optional `createProject` and `projectName` parameters
- Automatically creates a project when `createProject` is true
- Returns both the song and project information

#### `songsApi.editProject()`
- New function for editing existing projects
- Parameters:
  - `projectId`: The project to edit
  - `editPrompt`: The edit instruction
  - `timeStart`: Optional start time in seconds
  - `timeEnd`: Optional end time in seconds
- Returns the new version of the song

#### `projectsApi`
- `getAll()`: Get all projects with their latest songs
- `get(projectId)`: Get a specific project with all its versions
- `delete(projectId)`: Delete a project

### Gemini Manager Updates

#### `geminiManager.editSong()`
- New method for editing songs
- Takes the existing song, edit prompt, and optional time frame
- Generates updated song structure based on the edit request
- Preserves unchanged sections when time-frame editing is used

## UI Changes

### Music Agent Tab
- **Project List**: Shows all projects instead of individual songs
- **Project Cards**: Display project name, version, BPM, duration
- **Edit Button**: Each project has an edit button
- **Edit Modal**: Modal dialog for entering edit prompts and time frames
- **Version Display**: Shows current version number for each project

## Workflow Example

1. **Create Beat**:
   - Prompt: "Make a 3-minute trap beat at 90 BPM with heavy 808s"
   - Project: "My Trap Beat v1" created

2. **Edit Entire Beat**:
   - Edit Prompt: "Add more hi-hat rolls and increase the tempo to 95 BPM"
   - Result: "My Trap Beat v2" with updated structure

3. **Edit Specific Section**:
   - Edit Prompt: "Make the intro more dramatic with a riser"
   - Time Frame: Start: 0, End: 8
   - Result: "My Trap Beat v3" with modified intro only

4. **Continue Editing**:
   - Each edit creates a new version
   - All versions are preserved in the project history

## Technical Details

### Version Management
- Each project starts at version 1
- Each edit increments the version number
- Previous versions are preserved via `parent_song_id` references
- The project's `current_version` tracks the latest version

### Time-Frame Editing Logic
- When time frame is specified, the AI is instructed to:
  - Keep the rest of the song unchanged
  - Modify only sections overlapping with the time frame
  - Update the structure accordingly
- The entire song structure is still returned, but changes focus on the specified range

### Data Migration
- Existing songs without projects will continue to work
- New songs are automatically assigned to projects
- Projects can be created retroactively if needed

## Future Enhancements

Potential improvements:
- View version history and compare versions
- Revert to previous versions
- Export individual versions
- Merge edits from multiple versions
- Visual timeline for time-frame selection
- Preview changes before applying
