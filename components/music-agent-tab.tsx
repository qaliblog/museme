import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { songsApi, projectsApi } from '../services/api';

interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  current_version: number;
  latestSong?: any;
}

interface GeneratedSong {
  id: string;
  prompt: string;
  bpm: number;
  duration_seconds: number;
  structure: any[];
  sounds_used: string[];
  melody_description: string;
  generated_at: string;
  song_data: any;
  project_id?: string;
  version?: number;
}

export function MusicAgentTab() {
  const [prompt, setPrompt] = useState('');
  const [projectName, setProjectName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectsApi.getAll();
      setProjects(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const generateSong = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt');
      return;
    }

    setGenerating(true);
    try {
      const result = await songsApi.generate(
        prompt,
        true,
        projectName.trim() || undefined
      );
      Alert.alert('Success', 'Your song arrangement has been created');
      setPrompt('');
      setProjectName('');
      fetchProjects();
    } catch (error: any) {
      Alert.alert('Generation Failed', error.message);
    } finally {
      setGenerating(false);
    }
  };

  const openEditModal = (project: Project) => {
    setSelectedProject(project);
    setEditMode(true);
    setEditPrompt('');
    setTimeStart('');
    setTimeEnd('');
    setShowEditModal(true);
  };

  const editProject = async () => {
    if (!editPrompt.trim()) {
      Alert.alert('Error', 'Please enter an edit prompt');
      return;
    }

    if (!selectedProject) {
      return;
    }

    const start = timeStart.trim() ? parseFloat(timeStart) : undefined;
    const end = timeEnd.trim() ? parseFloat(timeEnd) : undefined;

    if (start !== undefined && end !== undefined && start >= end) {
      Alert.alert('Error', 'End time must be greater than start time');
      return;
    }

    setGenerating(true);
    try {
      const result = await songsApi.editProject(
        selectedProject.id,
        editPrompt,
        start,
        end
      );
      Alert.alert(
        'Success',
        `Project updated to version ${result.version}`
      );
      setShowEditModal(false);
      setEditPrompt('');
      setTimeStart('');
      setTimeEnd('');
      setSelectedProject(null);
      fetchProjects();
    } catch (error: any) {
      Alert.alert('Edit Failed', error.message);
    } finally {
      setGenerating(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Core Music Agent</Text>
        <Text style={styles.cardDescription}>
          Generate complete 3-minute song arrangements using AI
        </Text>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Project Name (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="My Beat Project"
            value={projectName}
            onChangeText={setProjectName}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Song Prompt</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Make a 3-minute beat at 90 BPM, chill trap vibe, soft keys melody, use snare_04, kick_02, add hi-hat rolls."
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.hint}>
            Describe the song you want to generate. Include BPM, genre, mood, and
            specific samples to use.
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.button, generating && styles.buttonDisabled]}
          onPress={generateSong}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Generate New Beat</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Projects</Text>
        <Text style={styles.cardDescription}>
          {projects.length} project{projects.length !== 1 ? 's' : ''} created
        </Text>
        {loading ? (
          <ActivityIndicator style={styles.loader} />
        ) : projects.length === 0 ? (
          <Text style={styles.emptyText}>No projects created yet</Text>
        ) : (
          <View style={styles.projectsList}>
            {projects.map((project) => (
              <View key={project.id} style={styles.projectCard}>
                <View style={styles.projectHeader}>
                  <View style={styles.projectHeaderLeft}>
                    <Text style={styles.projectTitle}>{project.name}</Text>
                    <Text style={styles.projectMeta}>
                      Version {project.current_version} •{' '}
                      {project.latestSong
                        ? `${project.latestSong.bpm} BPM • ${formatTime(
                            project.latestSong.duration_seconds
                          )}`
                        : 'No songs'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal(project)}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
                {project.latestSong && (
                  <View style={styles.projectContent}>
                    <Text style={styles.projectPrompt}>
                      {project.latestSong.prompt}
                    </Text>
                    {project.latestSong.edit_prompt && (
                      <Text style={styles.editNote}>
                        Last edit: {project.latestSong.edit_prompt}
                      </Text>
                    )}
                    <View style={styles.tagsContainer}>
                      {project.latestSong.structure?.slice(0, 4).map(
                        (section: any, i: number) => (
                          <View key={i} style={styles.tag}>
                            <Text style={styles.tagText}>
                              {section.section} ({section.length}s)
                            </Text>
                          </View>
                        )
                      )}
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Edit Project: {selectedProject?.name}
            </Text>
            <Text style={styles.modalSubtitle}>
              Version {selectedProject?.current_version || 1}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Edit Prompt</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Add more hi-hats, increase the tempo, change the melody..."
                value={editPrompt}
                onChangeText={setEditPrompt}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.timeFrameContainer}>
              <Text style={styles.label}>Time Frame (Optional)</Text>
              <Text style={styles.hint}>
                Leave empty to edit the entire song, or specify a time range to
                edit only that section
              </Text>
              <View style={styles.timeInputRow}>
                <View style={styles.timeInput}>
                  <Text style={styles.timeLabel}>Start (seconds)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={timeStart}
                    onChangeText={setTimeStart}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.timeInput}>
                  <Text style={styles.timeLabel}>End (seconds)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="180"
                    value={timeEnd}
                    onChangeText={setTimeEnd}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, generating && styles.buttonDisabled]}
                onPress={editProject}
                disabled={generating}
              >
                {generating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Apply Edit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000000',
  },
  cardDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#000000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  hint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#8E8E93',
    padding: 32,
  },
  projectsList: {
    marginTop: 8,
  },
  projectCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  projectHeaderLeft: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  projectMeta: {
    fontSize: 12,
    color: '#8E8E93',
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  projectContent: {
    marginTop: 8,
  },
  projectPrompt: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
  },
  editNote: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#000000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 20,
  },
  timeFrameContainer: {
    marginBottom: 20,
  },
  timeInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E5EA',
  },
  cancelButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
