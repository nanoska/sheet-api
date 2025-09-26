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
} from '@mui/material';
import {
  Plus,
  Music,
  Edit,
  Trash2,
  Upload,
  Search,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Theme } from '../../types/api';
import { apiService } from '../../services/api';

const TONALITY_OPTIONS = [
  { value: 'C', label: 'Do Mayor' },
  { value: 'Cm', label: 'Do menor' },
  { value: 'C#', label: 'Do# Mayor' },
  { value: 'C#m', label: 'Do# menor' },
  { value: 'D', label: 'Re Mayor' },
  { value: 'Dm', label: 'Re menor' },
  { value: 'D#', label: 'Re# Mayor' },
  { value: 'D#m', label: 'Re# menor' },
  { value: 'E', label: 'Mi Mayor' },
  { value: 'Em', label: 'Mi menor' },
  { value: 'F', label: 'Fa Mayor' },
  { value: 'Fm', label: 'Fa menor' },
  { value: 'F#', label: 'Fa# Mayor' },
  { value: 'F#m', label: 'Fa# menor' },
  { value: 'G', label: 'Sol Mayor' },
  { value: 'Gm', label: 'Sol menor' },
  { value: 'G#', label: 'Sol# Mayor' },
  { value: 'G#m', label: 'Sol# menor' },
  { value: 'A', label: 'La Mayor' },
  { value: 'Am', label: 'La menor' },
  { value: 'A#', label: 'La# Mayor' },
  { value: 'A#m', label: 'La# menor' },
  { value: 'B', label: 'Si Mayor' },
  { value: 'Bm', label: 'Si menor' },
];

interface ThemeFormData {
  title: string;
  artist: string;
  tonalidad: string;
  description: string;
  image?: File;
  audio?: File;
}

const ThemeManager: React.FC = () => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ThemeFormData>({
    title: '',
    artist: '',
    tonalidad: '',
    description: '',
  });

  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps, isDragActive: isImageDragActive } = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    multiple: false,
    onDrop: (acceptedFiles) => {
      setFormData(prev => ({ ...prev, image: acceptedFiles[0] }));
    },
  });

  const { getRootProps: getAudioRootProps, getInputProps: getAudioInputProps, isDragActive: isAudioDragActive } = useDropzone({
    accept: { 'audio/*': ['.mp3', '.wav', '.ogg'] },
    multiple: false,
    onDrop: (acceptedFiles) => {
      setFormData(prev => ({ ...prev, audio: acceptedFiles[0] }));
    },
  });

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      const data = await apiService.getThemes();
      setThemes(Array.isArray(data) ? data : (data as any).results || []);
      setError(null);
    } catch (err) {
      setError('Error loading themes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (theme?: Theme) => {
    if (theme) {
      setEditingTheme(theme);
      setFormData({
        title: theme.title,
        artist: theme.artist,
        tonalidad: theme.tonalidad,
        description: theme.description,
      });
    } else {
      setEditingTheme(null);
      setFormData({
        title: '',
        artist: '',
        tonalidad: '',
        description: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTheme(null);
    setFormData({
      title: '',
      artist: '',
      tonalidad: '',
      description: '',
    });
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;

    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('artist', formData.artist);
      formDataToSend.append('tonalidad', formData.tonalidad);
      formDataToSend.append('description', formData.description);

      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }
      if (formData.audio) {
        formDataToSend.append('audio', formData.audio);
      }

      if (editingTheme) {
        await apiService.updateTheme(editingTheme.id, formDataToSend as any);
      } else {
        await apiService.createTheme(formDataToSend as any);
      }

      await loadThemes();
      handleCloseDialog();
      setError(null);
    } catch (err) {
      setError('Error saving theme');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this theme?')) return;

    try {
      await apiService.deleteTheme(id);
      await loadThemes();
      setError(null);
    } catch (err) {
      setError('Error deleting theme');
    }
  };

  const filteredThemes = themes.filter(theme =>
    theme.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    theme.artist.toLowerCase().includes(searchTerm.toLowerCase())
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
          placeholder="Search themes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search size={16} style={{ marginRight: 8, color: '#666' }} />,
          }}
          sx={{ flexGrow: 1 }}
        />
        <Button
          variant="contained"
          startIcon={<Plus size={16} />}
          onClick={() => handleOpenDialog()}
          sx={{ whiteSpace: 'nowrap' }}
        >
          New Theme
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
        {filteredThemes.map((theme) => (
          <Card
            key={theme.id}
              sx={{
                p: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box display="flex" alignItems="flex-start" gap={2}>
                <Avatar
                  src={theme.image}
                  sx={{
                    width: 48,
                    height: 48,
                    backgroundColor: 'primary.main',
                  }}
                >
                  <Music size={24} />
                </Avatar>

                <Box flexGrow={1} minWidth={0}>
                  <Typography variant="h6" noWrap>
                    {theme.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {theme.artist}
                  </Typography>
                  {theme.tonalidad && (
                    <Chip
                      size="small"
                      label={theme.tonalidad}
                      color="primary"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>

                <Box>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(theme)}
                  >
                    <Edit size={16} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(theme.id)}
                    color="error"
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Box>
              </Box>

              {theme.description && (
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
                  {theme.description}
                </Typography>
              )}

              <Box mt="auto" pt={2}>
                <Typography variant="caption" color="text.secondary">
                  {theme.versions?.length || 0} versions
                </Typography>
              </Box>
            </Card>
        ))}
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingTheme ? 'Edit Theme' : 'New Theme'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} pt={1}>
            <TextField
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              fullWidth
            />

            <TextField
              label="Artist"
              value={formData.artist}
              onChange={(e) => setFormData(prev => ({ ...prev, artist: e.target.value }))}
              fullWidth
            />

            <TextField
              select
              label="Tonality"
              value={formData.tonalidad}
              onChange={(e) => setFormData(prev => ({ ...prev, tonalidad: e.target.value }))}
              fullWidth
            >
              {TONALITY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
                  backgroundColor: isImageDragActive ? 'action.hover' : 'transparent',
                }}
              >
                <input {...getImageInputProps()} />
                <Upload size={24} style={{ marginBottom: 8 }} />
                <Typography variant="body2">
                  {formData.image ? formData.image.name : 'Drop image or click'}
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
                  backgroundColor: isAudioDragActive ? 'action.hover' : 'transparent',
                }}
              >
                <input {...getAudioInputProps()} />
                <Music size={24} style={{ marginBottom: 8 }} />
                <Typography variant="body2">
                  {formData.audio ? formData.audio.name : 'Drop audio or click'}
                </Typography>
              </Box>
            </Box>

            <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting || !formData.title.trim()}
              >
                {submitting ? <CircularProgress size={20} /> : (editingTheme ? 'Update' : 'Create')}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ThemeManager;