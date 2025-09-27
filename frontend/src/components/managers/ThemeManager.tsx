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
  Eye,
  FileText,
  Download,
  ArrowLeft,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Theme, Version, Instrument } from '../../types/api';
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

  // Estados para gestión de versiones de tema
  const [viewingTheme, setViewingTheme] = useState<Theme | null>(null);
  const [viewingVersion, setViewingVersion] = useState<Version | null>(null);

  // Estados para dialog de información del tema
  const [themeInfoDialogOpen, setThemeInfoDialogOpen] = useState(false);
  const [selectedThemeForInfo, setSelectedThemeForInfo] = useState<Theme | null>(null);

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
                    onClick={() => {
                      setSelectedThemeForInfo(theme);
                      setThemeInfoDialogOpen(true);
                    }}
                    color="primary"
                    title="Ver Información del Tema"
                  >
                    <Eye size={16} />
                  </IconButton>
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

      {/* Dialog de información del tema */}
      <Dialog
        open={themeInfoDialogOpen}
        onClose={() => setThemeInfoDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Información del Tema</DialogTitle>
        <DialogContent>
          {selectedThemeForInfo && (
            <ThemeInfoContent
              theme={selectedThemeForInfo}
              onViewVersions={() => {
                setThemeInfoDialogOpen(false);
                setViewingTheme(selectedThemeForInfo);
              }}
              onManageSheetMusic={(version) => {
                setThemeInfoDialogOpen(false);
                setViewingVersion(version);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

    </Box>
  );

  // Si estamos viendo versiones de un tema, mostrar esa vista
  if (viewingTheme && !viewingVersion) {
    return (
      <ThemeVersionsGrid
        theme={viewingTheme!}
        onBack={() => setViewingTheme(null)}
        onViewSheetMusic={setViewingVersion}
        onManageSheetMusic={setViewingVersion}
      />
    );
  }

  // Si estamos viendo partituras de una versión, mostrar esa vista
  if (viewingVersion) {
    return (
      <ThemeSheetMusicView
        version={viewingVersion!}
        onBack={() => setViewingVersion(null)}
      />
    );
  }
};

// Componente para mostrar información completa del tema
const ThemeInfoContent: React.FC<{
  theme: Theme;
  onViewVersions: () => void;
  onManageSheetMusic?: (version: any) => void;
}> = ({ theme, onViewVersions, onManageSheetMusic }) => {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetMusicCounts, setSheetMusicCounts] = useState<Record<number, number>>({});

  // Estado para dialog de información de versión
  const [versionInfoDialogOpen, setVersionInfoDialogOpen] = useState(false);
  const [selectedVersionForInfo, setSelectedVersionForInfo] = useState<any | null>(null);

  useEffect(() => {
    loadThemeData();
  }, [theme.id]);

  const loadThemeData = async () => {
    try {
      // Cargar versiones del tema
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/versions/?theme=${theme.id}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }
      );
      const data = await response.json();
      const versionsData = Array.isArray(data) ? data : data.results || [];
      setVersions(versionsData);

      // Cargar conteo de partituras para cada versión
      const counts: Record<number, number> = {};
      for (const version of versionsData) {
        try {
          const response = await fetch(
            `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/sheet-music/?version=${version.id}`,
            {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
            }
          );
          const sheetData = await response.json();
          counts[version.id] = Array.isArray(sheetData) ? sheetData.length : (sheetData.results?.length || 0);
        } catch {
          counts[version.id] = 0;
        }
      }
      setSheetMusicCounts(counts);
    } catch (err) {
      console.error('Error loading theme data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  const totalSheetMusic = Object.values(sheetMusicCounts).reduce((sum, count) => sum + count, 0);

  return (
    <Box pt={1}>
      {/* Información básica del tema */}
      <Box display="flex" gap={3} mb={4}>
        {theme.image && (
          <Box
            component="img"
            src={theme.image}
            alt={theme.title}
            sx={{
              width: 120,
              height: 120,
              objectFit: 'cover',
              borderRadius: 2,
            }}
          />
        )}
        <Box flexGrow={1}>
          <Typography variant="h4" gutterBottom>
            {theme.title}
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {theme.artist}
          </Typography>
          {theme.tonalidad && (
            <Chip
              label={`Tonalidad: ${theme.tonalidad}`}
              color="primary"
              sx={{ mb: 2 }}
            />
          )}
          {theme.description && (
            <Typography variant="body1" color="text.secondary">
              {theme.description}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Estadísticas */}
      <Box display="flex" gap={2} mb={3}>
        <Card sx={{ p: 2, textAlign: 'center', flex: 1 }}>
          <Typography variant="h4" color="primary.main">
            {versions.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Versiones
          </Typography>
        </Card>
        <Card sx={{ p: 2, textAlign: 'center', flex: 1 }}>
          <Typography variant="h4" color="secondary.main">
            {totalSheetMusic}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Partituras
          </Typography>
        </Card>
      </Box>

      {/* Lista de versiones */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Versiones ({versions.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Eye size={16} />}
          onClick={onViewVersions}
          disabled={versions.length === 0}
        >
          Ver Todas las Versiones
        </Button>
      </Box>

      <Box display="flex" flexDirection="column" gap={2}>
        {versions.length === 0 ? (
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No hay versiones creadas para este tema
            </Typography>
          </Card>
        ) : (
          versions.map((version) => (
            <Card
              key={version.id}
              sx={{
                p: 2,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease-in-out'
                }
              }}
              onClick={() => {
                setSelectedVersionForInfo(version);
                setVersionInfoDialogOpen(true);
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ backgroundColor: 'secondary.main' }}>
                  <Music size={20} />
                </Avatar>
                <Box flexGrow={1}>
                  <Typography variant="subtitle1">
                    {version.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {version.type_display}
                  </Typography>
                  {version.notes && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {version.notes}
                    </Typography>
                  )}
                </Box>
                <Box textAlign="center">
                  <Typography variant="h6" color="primary.main">
                    {sheetMusicCounts[version.id] || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    partituras
                  </Typography>
                </Box>
                <IconButton size="small" color="primary">
                  <Eye size={16} />
                </IconButton>
              </Box>
            </Card>
          ))
        )}
      </Box>

      {/* Audio del tema si existe */}
      {theme.audio && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Audio
          </Typography>
          <Card sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ backgroundColor: 'info.main' }}>
                <Music size={20} />
              </Avatar>
              <Box flexGrow={1}>
                <Typography variant="body2">
                  Audio del tema
                </Typography>
              </Box>
              <audio controls style={{ maxWidth: '100%' }}>
                <source src={theme.audio} type="audio/mpeg" />
                Tu navegador no soporta el elemento de audio.
              </audio>
            </Box>
          </Card>
        </Box>
      )}

      {/* Dialog de información de la versión */}
      <Dialog
        open={versionInfoDialogOpen}
        onClose={() => setVersionInfoDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Información de la Versión</DialogTitle>
        <DialogContent>
          {selectedVersionForInfo && (
            <VersionInfoContent
              version={selectedVersionForInfo}
              themeName={theme.title}
              onAddSheetMusic={onManageSheetMusic}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

// Componente para mostrar información completa de una versión
const VersionInfoContent: React.FC<{
  version: any;
  themeName: string;
  onAddSheetMusic?: (version: any) => void;
}> = ({ version, themeName, onAddSheetMusic }) => {
  const [sheetMusic, setSheetMusic] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVersionData();
  }, [version.id]);

  const loadVersionData = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/sheet-music/?version=${version.id}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }
      );
      const data = await response.json();
      setSheetMusic(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error('Error loading version data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  // Agrupar partituras por tipo
  const groupedSheetMusic = sheetMusic.reduce((acc, sheet) => {
    const type = sheet.type_display || 'Sin tipo';
    if (!acc[type]) acc[type] = [];
    acc[type].push(sheet);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <Box pt={1}>
      {/* Información básica de la versión */}
      <Box display="flex" gap={3} mb={4}>
        {version.image && (
          <Box
            component="img"
            src={version.image}
            alt={version.title}
            sx={{
              width: 120,
              height: 120,
              objectFit: 'cover',
              borderRadius: 2,
            }}
          />
        )}
        <Box flexGrow={1}>
          <Typography variant="h4" gutterBottom>
            {version.title}
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {themeName}
          </Typography>
          <Chip
            label={version.type_display}
            color="secondary"
            sx={{ mb: 2 }}
          />
          {version.notes && (
            <Typography variant="body1" color="text.secondary">
              {version.notes}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Estadísticas */}
      <Box display="flex" gap={2} mb={3}>
        <Card sx={{ p: 2, textAlign: 'center', flex: 1 }}>
          <Typography variant="h4" color="primary.main">
            {sheetMusic.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Partituras
          </Typography>
        </Card>
        <Card sx={{ p: 2, textAlign: 'center', flex: 1 }}>
          <Typography variant="h4" color="secondary.main">
            {Object.keys(groupedSheetMusic).length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tipos
          </Typography>
        </Card>
      </Box>

      {/* Archivos de la versión */}
      <Typography variant="h6" gutterBottom>
        Archivos de la Versión
      </Typography>
      <Box display="flex" gap={2} mb={4}>
        {/* Audio de la versión */}
        {version.audio_file && (
          <Card sx={{ p: 2, flex: 1 }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Avatar sx={{ backgroundColor: 'info.main' }}>
                <Music size={20} />
              </Avatar>
              <Typography variant="subtitle2">
                Audio
              </Typography>
            </Box>
            <audio controls style={{ width: '100%' }}>
              <source src={version.audio_file} type="audio/mpeg" />
              Tu navegador no soporta el elemento de audio.
            </audio>
          </Card>
        )}

        {/* Archivo MuseScore */}
        {version.mus_file && (
          <Card sx={{ p: 2, flex: 1 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ backgroundColor: 'warning.main' }}>
                <FileText size={20} />
              </Avatar>
              <Box flexGrow={1}>
                <Typography variant="subtitle2">
                  MuseScore
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Archivo de partitura
                </Typography>
              </Box>
              <IconButton
                component="a"
                href={version.mus_file}
                target="_blank"
                color="primary"
                title="Descargar archivo MuseScore"
              >
                <Download size={16} />
              </IconButton>
            </Box>
          </Card>
        )}
      </Box>

      {/* Partituras agrupadas por tipo */}
      <Typography variant="h6" gutterBottom>
        Partituras ({sheetMusic.length})
      </Typography>

      {Object.keys(groupedSheetMusic).length === 0 ? (
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            No hay partituras cargadas para esta versión
          </Typography>
          {onAddSheetMusic && (
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={() => onAddSheetMusic(version)}
              color="primary"
            >
              Agregar Partituras
            </Button>
          )}
        </Card>
      ) : (
        Object.entries(groupedSheetMusic).map(([type, sheets]) => (
          <Box key={type} mb={3}>
            <Typography variant="subtitle1" color="primary.main" gutterBottom>
              {type} ({(sheets as any[]).length})
            </Typography>
            <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={2}>
              {(sheets as any[]).map((sheet: any) => (
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
                        {sheet.clef_display}
                      </Typography>
                      {sheet.tonalidad_relativa && (
                        <Box mt={0.5}>
                          <Chip
                            size="small"
                            label={sheet.tonalidad_relativa}
                            color="secondary"
                          />
                        </Box>
                      )}
                    </Box>
                    <IconButton
                      component="a"
                      href={sheet.file}
                      target="_blank"
                      color="primary"
                      title="Descargar PDF"
                    >
                      <Download size={16} />
                    </IconButton>
                  </Box>
                </Card>
              ))}
            </Box>
          </Box>
        ))
      )}
    </Box>
  );
};

// Componente para mostrar versiones de un tema
const ThemeVersionsGrid: React.FC<{
  theme: Theme;
  onBack: () => void;
  onViewSheetMusic: (version: Version) => void;
  onManageSheetMusic?: (version: any) => void;
}> = ({ theme, onBack, onViewSheetMusic, onManageSheetMusic }) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetMusicCounts, setSheetMusicCounts] = useState<Record<number, number>>({});

  // Estados para dialog de información de versión
  const [versionInfoDialogOpen, setVersionInfoDialogOpen] = useState(false);
  const [selectedVersionForInfo, setSelectedVersionForInfo] = useState<Version | null>(null);

  useEffect(() => {
    loadVersions();
  }, [theme.id]);

  const loadVersions = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/versions/?theme=${theme.id}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }
      );
      const data = await response.json();
      const versionsData = Array.isArray(data) ? data : data.results || [];
      setVersions(versionsData);

      // Cargar conteo de partituras para cada versión
      const counts: Record<number, number> = {};
      for (const version of versionsData) {
        try {
          const response = await fetch(
            `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/sheet-music/?version=${version.id}`,
            {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
            }
          );
          const sheetData = await response.json();
          counts[version.id] = Array.isArray(sheetData) ? sheetData.length : (sheetData.results?.length || 0);
        } catch {
          counts[version.id] = 0;
        }
      }
      setSheetMusicCounts(counts);
    } catch (err) {
      console.error('Error loading versions:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={onBack}>
          <ArrowLeft size={20} />
        </IconButton>
        <Box>
          <Typography variant="h5">
            {theme.title} - Versiones
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {theme.artist} • {versions.length} versiones
          </Typography>
        </Box>
      </Box>

      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={2}>
        {versions.map((version) => (
          <Card key={version.id} sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ backgroundColor: 'secondary.main' }}>
                <Music size={20} />
              </Avatar>
              <Box flexGrow={1}>
                <Typography variant="subtitle1">
                  {version.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {version.type_display}
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mt={1}>
                  <Chip
                    size="small"
                    label={`${sheetMusicCounts[version.id] || 0} partituras`}
                    color="primary"
                  />
                </Box>
              </Box>
              <Box>
                <IconButton
                  size="small"
                  onClick={() => {
                    setSelectedVersionForInfo(version);
                    setVersionInfoDialogOpen(true);
                  }}
                  color="secondary"
                  title="Información de la Versión"
                >
                  <Eye size={16} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onViewSheetMusic(version)}
                  color="primary"
                  title="Gestionar Partituras"
                >
                  <FileText size={16} />
                </IconButton>
              </Box>
            </Box>
          </Card>
        ))}
      </Box>

      {/* Dialog de información de la versión */}
      <Dialog
        open={versionInfoDialogOpen}
        onClose={() => setVersionInfoDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Información de la Versión</DialogTitle>
        <DialogContent>
          {selectedVersionForInfo && (
            <VersionInfoContent
              version={selectedVersionForInfo}
              themeName={theme.title}
              onAddSheetMusic={onManageSheetMusic}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

// Componente para mostrar partituras de una versión de tema
const ThemeSheetMusicView: React.FC<{
  version: Version;
  onBack: () => void;
}> = ({ version, onBack }) => {
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

  // Estados para edición de partituras
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSheet, setEditingSheet] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    instrument: null as number | null,
    type: 'MELODIA_PRINCIPAL',
    clef: 'SOL',
  });

  // Estados para dialog de información de partitura
  const [sheetInfoDialogOpen, setSheetInfoDialogOpen] = useState(false);
  const [selectedSheetForInfo, setSelectedSheetForInfo] = useState<any | null>(null);

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
    onDrop: (files: File[]) => setFormData(prev => ({ ...prev, file: files[0] })),
  });

  useEffect(() => {
    loadData();
  }, [version.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      const [sheetsData, instrumentsData] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/sheet-music/?version=${version.id}`, {
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
      formDataToSend.append('version', version.id.toString());
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

  const handleEditSheet = (sheet: any) => {
    setEditingSheet(sheet);
    setEditFormData({
      instrument: sheet.instrument,
      type: sheet.type,
      clef: sheet.clef,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateSheet = async () => {
    if (!editingSheet || !editFormData.instrument) return;

    try {
      const updateData = {
        instrument: editFormData.instrument,
        type: editFormData.type,
        clef: editFormData.clef,
      };

      await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/sheet-music/${editingSheet.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      await loadData();
      setEditDialogOpen(false);
      setEditingSheet(null);
    } catch (err) {
      console.error('Error updating sheet music:', err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={onBack}>
          <ArrowLeft size={20} />
        </IconButton>
        <Box flexGrow={1}>
          <Typography variant="h6">
            {version.title} - Partituras
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {sheetMusic.length} partituras disponibles
          </Typography>
        </Box>
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
                onClick={() => {
                  setSelectedSheetForInfo(sheet);
                  setSheetInfoDialogOpen(true);
                }}
                color="secondary"
                title="Información de la Partitura"
              >
                <Eye size={16} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleEditSheet(sheet)}
                title="Editar Partitura"
              >
                <Edit size={16} />
              </IconButton>
              <IconButton
                size="small"
                component="a"
                href={sheet.file}
                target="_blank"
                color="primary"
                title="Descargar PDF"
              >
                <Download size={16} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleDelete(sheet.id)}
                color="error"
                title="Eliminar Partitura"
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
            <TextField
              select
              label="Instrumento"
              value={instruments.find(i => i.id === formData.instrument)?.name || ''}
              onChange={(e) => {
                const instrument = instruments.find(i => i.name === e.target.value);
                setFormData(prev => ({ ...prev, instrument: instrument?.id || null }));
              }}
              fullWidth
              required
            >
              {instruments.map((instrument) => (
                <MenuItem key={instrument.id} value={instrument.name}>
                  {instrument.name}
                </MenuItem>
              ))}
            </TextField>

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

      {/* Dialog para editar partitura */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Partitura</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} pt={1}>
            <TextField
              select
              label="Instrumento"
              value={instruments.find(i => i.id === editFormData.instrument)?.name || ''}
              onChange={(e) => {
                const instrument = instruments.find(i => i.name === e.target.value);
                setEditFormData(prev => ({ ...prev, instrument: instrument?.id || null }));
              }}
              fullWidth
              required
            >
              {instruments.map((instrument) => (
                <MenuItem key={instrument.id} value={instrument.name}>
                  {instrument.name}
                </MenuItem>
              ))}
            </TextField>

            <Box display="flex" gap={2}>
              <TextField
                select
                label="Tipo"
                value={editFormData.type}
                onChange={(e) => setEditFormData(prev => ({ ...prev, type: e.target.value }))}
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
                value={editFormData.clef}
                onChange={(e) => setEditFormData(prev => ({ ...prev, clef: e.target.value }))}
                fullWidth
              >
                {CLEF_TYPES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              <Button
                variant="contained"
                onClick={handleUpdateSheet}
                disabled={!editFormData.instrument}
              >
                Actualizar
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Dialog de información de la partitura */}
      <Dialog
        open={sheetInfoDialogOpen}
        onClose={() => setSheetInfoDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Información de la Partitura</DialogTitle>
        <DialogContent>
          {selectedSheetForInfo && (
            <SheetMusicInfoContent
              sheet={selectedSheetForInfo}
              versionTitle={version.title}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

// Componente para mostrar información completa de una partitura
const SheetMusicInfoContent: React.FC<{
  sheet: any;
  versionTitle: string;
}> = ({ sheet, versionTitle }) => {
  return (
    <Box pt={1}>
      {/* Información básica de la partitura */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          {sheet.instrument_name}
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {versionTitle}
        </Typography>
        <Box display="flex" gap={1} mb={2}>
          <Chip
            label={sheet.type_display}
            color="primary"
          />
          <Chip
            label={sheet.clef_display}
            color="secondary"
          />
          {sheet.tonalidad_relativa && (
            <Chip
              label={sheet.tonalidad_relativa}
              color="info"
            />
          )}
        </Box>
      </Box>

      {/* Información detallada */}
      <Box display="flex" flexDirection="column" gap={3}>
        <Card sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Detalles del Instrumento
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Instrumento:
              </Typography>
              <Typography variant="body2">
                {sheet.instrument_name}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Tipo de partitura:
              </Typography>
              <Typography variant="body2">
                {sheet.type_display}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Clave:
              </Typography>
              <Typography variant="body2">
                {sheet.clef_display}
              </Typography>
            </Box>
            {sheet.tonalidad_relativa && (
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Tonalidad relativa:
                </Typography>
                <Typography variant="body2" color="primary.main">
                  {sheet.tonalidad_relativa}
                </Typography>
              </Box>
            )}
          </Box>
        </Card>

        {/* Archivo PDF */}
        <Card sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Archivo PDF
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ backgroundColor: 'error.main' }}>
              <FileText size={20} />
            </Avatar>
            <Box flexGrow={1}>
              <Typography variant="body2">
                Partitura en PDF
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Archivo listo para descarga e impresión
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Download size={16} />}
              component="a"
              href={sheet.file}
              target="_blank"
              color="primary"
            >
              Descargar
            </Button>
          </Box>
        </Card>

        {/* Información técnica */}
        {sheet.created_at && (
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Información Técnica
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  ID de partitura:
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  #{sheet.id}
                </Typography>
              </Box>
              {sheet.created_at && (
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Fecha de creación:
                  </Typography>
                  <Typography variant="body2">
                    {new Date(sheet.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              )}
            </Box>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default ThemeManager;