import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  MenuItem,
  IconButton,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Autocomplete,
} from '@mui/material';
import {
  Plus,
  FileText,
  Edit,
  Trash2,
  Upload,
  Search,
  Music,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Version, Theme } from '../../types/api';
import { apiService } from '../../services/api';

const VERSION_TYPES = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'ENSAMBLE', label: 'Ensamble' },
  { value: 'DUETO', label: 'Dueto' },
  { value: 'GRUPO_REDUCIDO', label: 'Grupo Reducido' },
];

interface VersionFormData {
  theme: number | null;
  title: string;
  type: string;
  notes: string;
  image?: File;
  audio_file?: File;
  mus_file?: File;
}

const VersionManager: React.FC = () => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<Version | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<VersionFormData>({
    theme: null,
    title: '',
    type: 'STANDARD',
    notes: '',
  });

  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps } = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    multiple: false,
    onDrop: (files) => setFormData(prev => ({ ...prev, image: files[0] })),
  });

  const { getRootProps: getAudioRootProps, getInputProps: getAudioInputProps } = useDropzone({
    accept: { 'audio/*': ['.mp3', '.wav', '.ogg'] },
    multiple: false,
    onDrop: (files) => setFormData(prev => ({ ...prev, audio_file: files[0] })),
  });

  const { getRootProps: getMusRootProps, getInputProps: getMusInputProps } = useDropzone({
    accept: { 'application/*': ['.mscz', '.mscx'] },
    multiple: false,
    onDrop: (files) => setFormData(prev => ({ ...prev, mus_file: files[0] })),
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [versionsData, themesData] = await Promise.all([
        apiService.getVersions(),
        apiService.getThemes(),
      ]);
      setVersions(Array.isArray(versionsData) ? versionsData : (versionsData as any).results || []);
      setThemes(Array.isArray(themesData) ? themesData : (themesData as any).results || []);
    } catch (err) {
      setError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (version?: Version) => {
    if (version) {
      setEditingVersion(version);
      setFormData({
        theme: version.theme,
        title: version.title,
        type: version.type,
        notes: version.notes,
      });
    } else {
      setEditingVersion(null);
      setFormData({
        theme: null,
        title: '',
        type: 'STANDARD',
        notes: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingVersion(null);
    setFormData({
      theme: null,
      title: '',
      type: 'STANDARD',
      notes: '',
    });
  };

  const handleSubmit = async () => {
    if (!formData.theme || !formData.title.trim()) return;

    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('theme', formData.theme.toString());
      formDataToSend.append('title', formData.title);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('notes', formData.notes);

      if (formData.image) formDataToSend.append('image', formData.image);
      if (formData.audio_file) formDataToSend.append('audio_file', formData.audio_file);
      if (formData.mus_file) formDataToSend.append('mus_file', formData.mus_file);

      if (editingVersion) {
        await apiService.updateVersion(editingVersion.id, formDataToSend);
      } else {
        await apiService.createVersion(formDataToSend);
      }

      await loadData();
      handleCloseDialog();
    } catch (err) {
      setError('Error saving version');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this version?')) return;
    try {
      await apiService.deleteVersion(id);
      await loadData();
    } catch (err) {
      setError('Error deleting version');
    }
  };

  const filteredVersions = versions.filter(version =>
    version.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (version as any).theme_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box display="flex" gap={2} mb={3} alignItems="center">
        <TextField
          size="small"
          placeholder="Search versions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search size={16} style={{ marginRight: 8 }} />,
          }}
          sx={{ flexGrow: 1 }}
        />
        <Button
          variant="contained"
          startIcon={<Plus size={16} />}
          onClick={() => handleOpenDialog()}
        >
          New Version
        </Button>
      </Box>

      <Box
        display="grid"
        gridTemplateColumns={{
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
        }}
        gap={2}
      >
        {filteredVersions.map((version) => (
          <Card key={version.id} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="flex-start" gap={2}>
                <Avatar sx={{ backgroundColor: 'secondary.main' }}>
                  <FileText size={24} />
                </Avatar>

                <Box flexGrow={1} minWidth={0}>
                  <Typography variant="h6" noWrap>
                    {version.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {(version as any).theme_title}
                  </Typography>
                  <Chip
                    size="small"
                    label={(version as any).type_display || version.type}
                    color="secondary"
                    sx={{ mt: 1 }}
                  />
                </Box>

                <Box>
                  <IconButton size="small" onClick={() => handleOpenDialog(version)}>
                    <Edit size={16} />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(version.id)} color="error">
                    <Trash2 size={16} />
                  </IconButton>
                </Box>
              </Box>

              {version.notes && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {version.notes}
                </Typography>
              )}

              <Box mt="auto" pt={2} display="flex" gap={1}>
                {version.audio_file && <Chip size="small" label="Audio" />}
                {version.mus_file && <Chip size="small" label="Score" />}
                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                  {(version as any).sheet_music_count || 0} sheets
                </Typography>
              </Box>
            </Card>
        ))}
      </Box>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingVersion ? 'Edit Version' : 'New Version'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} pt={1}>
            <Autocomplete
              options={themes}
              getOptionLabel={(theme) => `${theme.title} - ${theme.artist}`}
              value={themes.find(t => t.id === formData.theme) || null}
              onChange={(_, value) => setFormData(prev => ({ ...prev, theme: value?.id || null }))}
              renderInput={(params) => <TextField {...params} label="Theme" required />}
            />

            <TextField
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              fullWidth
            />

            <TextField
              select
              label="Type"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              fullWidth
            >
              {VERSION_TYPES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              multiline
              rows={3}
              fullWidth
            />

            <Box display="flex" gap={2}>
              <Box
                {...getImageRootProps()}
                sx={{
                  flex: 1,
                  p: 2,
                  border: '2px dashed #333',
                  borderRadius: 1,
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
              >
                <input {...getImageInputProps()} />
                <Upload size={20} />
                <Typography variant="caption" display="block">
                  {formData.image ? formData.image.name : 'Image'}
                </Typography>
              </Box>
              <Box
                {...getAudioRootProps()}
                sx={{
                  flex: 1,
                  p: 2,
                  border: '2px dashed #333',
                  borderRadius: 1,
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
              >
                <input {...getAudioInputProps()} />
                <Music size={20} />
                <Typography variant="caption" display="block">
                  {formData.audio_file ? formData.audio_file.name : 'Audio'}
                </Typography>
              </Box>
              <Box
                {...getMusRootProps()}
                sx={{
                  flex: 1,
                  p: 2,
                  border: '2px dashed #333',
                  borderRadius: 1,
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
              >
                <input {...getMusInputProps()} />
                <FileText size={20} />
                <Typography variant="caption" display="block">
                  {formData.mus_file ? formData.mus_file.name : 'MuseScore'}
                </Typography>
              </Box>
            </Box>

            <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting || !formData.theme || !formData.title.trim()}
              >
                {submitting ? <CircularProgress size={20} /> : (editingVersion ? 'Update' : 'Create')}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default VersionManager;