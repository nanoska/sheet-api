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
  Sheet,
  Download,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Version, Theme, Instrument } from '../../types/api';
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
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<Version | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetMusicDialogOpen, setSheetMusicDialogOpen] = useState(false);
  const [selectedVersionForSheets, setSelectedVersionForSheets] = useState<Version | null>(null);

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

  const handleViewSheets = (version: Version) => {
    setSelectedVersionForSheets(version);
    setSheetMusicDialogOpen(true);
  };

  const filteredVersions = versions.filter(version => {
    const matchesSearch = version.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (version as any).theme_title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || version.type === typeFilter;
    return matchesSearch && matchesType;
  });

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
        <TextField
          select
          size="small"
          label="Tipo de Versión"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {VERSION_TYPES.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
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
                  <IconButton size="small" onClick={() => handleViewSheets(version)} color="primary">
                    <Sheet size={16} />
                  </IconButton>
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

      {/* Dialog para gestionar partituras de una versión */}
      <Dialog
        open={sheetMusicDialogOpen}
        onClose={() => setSheetMusicDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Partituras - {selectedVersionForSheets?.title}
          <Typography variant="body2" color="text.secondary">
            {selectedVersionForSheets && (selectedVersionForSheets as any).theme_title}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedVersionForSheets && (
            <SheetMusicForVersion versionId={selectedVersionForSheets.id} />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

// Componente para gestionar partituras de una versión específica
const SheetMusicForVersion: React.FC<{ versionId: number }> = ({ versionId }) => {
  const [sheetMusic, setSheetMusic] = useState<any[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    instrument: null as number | null,
    type: 'MELODIA_PRINCIPAL',
    clef: 'SOL',
    file: null as File | null,
  });

  const SHEET_TYPES = [
    { value: 'MELODIA_PRINCIPAL', label: 'Melodía Principal' },
    { value: 'MELODIA_SECUNDARIA', label: 'Melodía Secundaria' },
    { value: 'ARMONIA', label: 'Armonía' },
    { value: 'BAJO', label: 'Bajo' },
  ];

  const CLEF_TYPES = [
    { value: 'SOL', label: 'Clave de Sol' },
    { value: 'FA', label: 'Clave de Fa' },
  ];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    onDrop: (files) => setFormData(prev => ({ ...prev, file: files[0] })),
  });

  useEffect(() => {
    loadData();
  }, [versionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      const [sheetsData, instrumentsData] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/sheet-music/?version=${versionId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }).then(res => res.json()),
        apiService.getInstruments(),
      ]);
      setSheetMusic(Array.isArray(sheetsData) ? sheetsData : (sheetsData as any).results || []);
      setInstruments(Array.isArray(instrumentsData) ? instrumentsData : (instrumentsData as any).results || []);
    } catch (err) {
      console.error('Error loading sheet music:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.instrument || !formData.file) return;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('version', versionId.toString());
      formDataToSend.append('instrument', formData.instrument.toString());
      formDataToSend.append('type', formData.type);
      formDataToSend.append('clef', formData.clef);
      formDataToSend.append('file', formData.file);

      await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/sheet-music/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
        body: formDataToSend,
      });

      await loadData();
      setDialogOpen(false);
      setFormData({ instrument: null, type: 'MELODIA_PRINCIPAL', clef: 'SOL', file: null });
    } catch (err) {
      console.error('Error uploading sheet music:', err);
    }
  };

  const handleDelete = async (sheetId: number) => {
    if (!window.confirm('¿Eliminar esta partitura?')) return;

    try {
      await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/sheet-music/${sheetId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
      });
      await loadData();
    } catch (err) {
      console.error('Error deleting sheet music:', err);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Partituras ({sheetMusic.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={16} />}
          onClick={() => setDialogOpen(true)}
        >
          Agregar Partitura
        </Button>
      </Box>

      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={2}>
        {sheetMusic.map((sheet) => (
          <Card key={sheet.id} sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ backgroundColor: 'error.main' }}>
                <FileText size={20} />
              </Avatar>
              <Box flexGrow={1}>
                <Typography variant="subtitle2">
                  {sheet.instrument_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {sheet.type_display} - {sheet.clef_display}
                </Typography>
                {sheet.tonalidad_relativa && (
                  <Chip
                    size="small"
                    label={sheet.tonalidad_relativa}
                    color="secondary"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
              <IconButton
                size="small"
                component="a"
                href={sheet.file}
                target="_blank"
                color="primary"
              >
                <Download size={16} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleDelete(sheet.id)}
                color="error"
              >
                <Trash2 size={16} />
              </IconButton>
            </Box>
          </Card>
        ))}
      </Box>

      {/* Dialog para agregar nueva partitura */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar Partitura</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} pt={1}>
            <Autocomplete
              options={instruments}
              getOptionLabel={(instrument) => instrument.name}
              value={instruments.find(i => i.id === formData.instrument) || null}
              onChange={(_, value) => setFormData(prev => ({ ...prev, instrument: value?.id || null }))}
              renderInput={(params) => <TextField {...params} label="Instrumento" required />}
            />

            <Box display="flex" gap={2}>
              <TextField
                select
                label="Tipo"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                fullWidth
              >
                {SHEET_TYPES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Clave"
                value={formData.clef}
                onChange={(e) => setFormData(prev => ({ ...prev, clef: e.target.value }))}
                fullWidth
              >
                {CLEF_TYPES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box
              {...getRootProps()}
              sx={{
                p: 3,
                border: '2px dashed #333',
                borderRadius: 1,
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isDragActive ? 'action.hover' : 'transparent',
              }}
            >
              <input {...getInputProps()} />
              <Upload size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
              <Typography variant="body2">
                {formData.file ? formData.file.name : 'Soltar archivo PDF o hacer clic'}
              </Typography>
            </Box>

            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!formData.instrument || !formData.file}
              >
                Subir
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default VersionManager;