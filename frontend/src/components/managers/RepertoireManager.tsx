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
  IconButton,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  MenuItem,
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import {
  Plus,
  List as ListIcon,
  Edit,
  Trash2,
  Search,
  Music,
  FileText,
  Eye,
  Upload,
  Download,
} from 'lucide-react';
import { Repertoire, Version } from '../../types/api';
import { apiService } from '../../services/api';

interface RepertoireFormData {
  name: string;
  description: string;
}

const RepertoireManager: React.FC = () => {
  const [repertoires, setRepertoires] = useState<Repertoire[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRepertoire, setEditingRepertoire] = useState<Repertoire | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para gestión de versiones
  const [versionsDialogOpen, setVersionsDialogOpen] = useState(false);
  const [selectedRepertoire, setSelectedRepertoire] = useState<Repertoire | null>(null);
  const [sheetMusicDialogOpen, setSheetMusicDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);

  // Estados para agregar versiones al repertorio
  const [addVersionsDialogOpen, setAddVersionsDialogOpen] = useState(false);

  // Estados para edición de versiones
  const [versionEditDialogOpen, setVersionEditDialogOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<Version | null>(null);
  const [versionFormData, setVersionFormData] = useState({
    title: '',
    type: 'STANDARD',
    notes: '',
    image: null as File | null,
    audio_file: null as File | null,
    mus_file: null as File | null,
    removeImage: false,
  });

  const [formData, setFormData] = useState<RepertoireFormData>({
    name: '',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [repertoiresData, versionsData] = await Promise.all([
        apiService.getRepertoires(),
        apiService.getVersions(),
      ]);
      setRepertoires(Array.isArray(repertoiresData) ? repertoiresData : (repertoiresData as any).results || []);
      setVersions(Array.isArray(versionsData) ? versionsData : (versionsData as any).results || []);
    } catch (err) {
      setError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (repertoire?: Repertoire) => {
    if (repertoire) {
      setEditingRepertoire(repertoire);
      setFormData({
        name: repertoire.name,
        description: repertoire.description || '',
      });
    } else {
      setEditingRepertoire(null);
      setFormData({
        name: '',
        description: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    setSubmitting(true);
    try {
      if (editingRepertoire) {
        await apiService.updateRepertoire(editingRepertoire.id, formData);
      } else {
        await apiService.createRepertoire(formData as any);
      }

      await loadData();
      setDialogOpen(false);
    } catch (err) {
      setError('Error saving repertoire');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this repertoire?')) return;
    try {
      await apiService.deleteRepertoire(id);
      await loadData();
    } catch (err) {
      setError('Error deleting repertoire');
    }
  };

  const handleViewVersions = (repertoire: Repertoire) => {
    setSelectedRepertoire(repertoire);
    setVersionsDialogOpen(true);
  };

  const handleViewSheetMusic = (version: Version) => {
    setSelectedVersion(version);
    setSheetMusicDialogOpen(true);
  };

  const handleEditVersion = (version: Version) => {
    setEditingVersion(version);
    setVersionFormData({
      title: version.title,
      type: version.type,
      notes: version.notes || '',
      image: null,
      audio_file: null,
      mus_file: null,
      removeImage: false,
    });
    setVersionEditDialogOpen(true);
  };

  const handleUpdateVersion = async () => {
    if (!editingVersion || !versionFormData.title.trim()) return;

    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', versionFormData.title);
      formDataToSend.append('type', versionFormData.type);
      formDataToSend.append('notes', versionFormData.notes);

      // Manejar imagen: si se marca para eliminar, enviar string vacío; si hay nueva, enviarla
      if (versionFormData.removeImage) {
        formDataToSend.append('image', '');
      } else if (versionFormData.image) {
        formDataToSend.append('image', versionFormData.image);
      }

      if (versionFormData.audio_file) formDataToSend.append('audio_file', versionFormData.audio_file);
      if (versionFormData.mus_file) formDataToSend.append('mus_file', versionFormData.mus_file);

      await apiService.updateVersion(editingVersion.id, formDataToSend);

      // Recargar datos
      await loadData();
      setVersionEditDialogOpen(false);
      setEditingVersion(null);
    } catch (err) {
      setError('Error updating version');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRepertoires = repertoires.filter(repertoire =>
    repertoire.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repertoire.description?.toLowerCase().includes(searchTerm.toLowerCase())
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
          placeholder="Search repertoires..."
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
          New Repertoire
        </Button>
      </Box>

      <Box
        display="grid"
        gridTemplateColumns={{
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
        }}
        gap={2}
      >
        {filteredRepertoires.map((repertoire) => (
          <Card key={repertoire.id} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
                <Avatar sx={{ backgroundColor: 'success.main' }}>
                  <ListIcon size={24} />
                </Avatar>

                <Box flexGrow={1} minWidth={0}>
                  <Typography variant="h6" noWrap>
                    {repertoire.name}
                  </Typography>
                  <Chip
                    size="small"
                    label={`${repertoire.version_count} versions`}
                    color="primary"
                    sx={{ mt: 1 }}
                  />
                </Box>

                <Box>
                  <IconButton
                    size="small"
                    onClick={() => handleViewVersions(repertoire)}
                    color="primary"
                    title="View Versions & Sheet Music"
                  >
                    <Eye size={16} />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleOpenDialog(repertoire)}>
                    <Edit size={16} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(repertoire.id)}
                    color="error"
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Box>
              </Box>

              {repertoire.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {repertoire.description}
                </Typography>
              )}

              {repertoire.versions && repertoire.versions.length > 0 && (
                <Box mt="auto">
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Versions:
                  </Typography>
                  <List dense sx={{ p: 0 }}>
                    {repertoire.versions.slice(0, 3).map((rv) => (
                      <ListItem key={rv.id} sx={{ px: 0, py: 0.5 }}>
                        <Music size={14} style={{ marginRight: 8 }} />
                        <ListItemText
                          primary={
                            <Typography variant="body2" noWrap>
                              {rv.version.theme_title} - {rv.version.title}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                    {repertoire.versions.length > 3 && (
                      <ListItem sx={{ px: 0, py: 0.5 }}>
                        <ListItemText
                          primary={
                            <Typography variant="caption" color="text.secondary">
                              +{repertoire.versions.length - 3} more...
                            </Typography>
                          }
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}
            </Card>
        ))}
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRepertoire ? 'Edit Repertoire' : 'New Repertoire'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} pt={1}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              fullWidth
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={4}
              fullWidth
            />

            <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting || !formData.name.trim()}
              >
                {submitting ? <CircularProgress size={20} /> : (editingRepertoire ? 'Update' : 'Create')}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver versiones del repertorio */}
      <Dialog
        open={versionsDialogOpen}
        onClose={() => setVersionsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6">
                Versiones en "{selectedRepertoire?.name}"
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gestiona las partituras de cada versión
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={() => setAddVersionsDialogOpen(true)}
              color="primary"
            >
              Agregar Versiones
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRepertoire && (
            <VersionsGrid
              repertoire={selectedRepertoire}
              onViewSheetMusic={handleViewSheetMusic}
              onEditVersion={handleEditVersion}
              onRefresh={loadData}
              onAddVersions={() => setAddVersionsDialogOpen(true)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para agregar versiones al repertorio */}
      <Dialog
        open={addVersionsDialogOpen}
        onClose={() => setAddVersionsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Agregar Versiones al Repertorio</DialogTitle>
        <DialogContent>
          {selectedRepertoire && (
            <AddVersionsToRepertoire
              repertoire={selectedRepertoire}
              allVersions={versions}
              onClose={() => {
                setAddVersionsDialogOpen(false);
                loadData();
              }}
            />
          )}
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
          Partituras - {selectedVersion?.title}
          <Typography variant="body2" color="text.secondary">
            {selectedVersion && (selectedVersion as any).theme_title}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedVersion && (
            <SheetMusicForVersionInRepertoire
              versionId={selectedVersion.id}
              onClose={() => setSheetMusicDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para editar versión */}
      <Dialog
        open={versionEditDialogOpen}
        onClose={() => setVersionEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Editar Versión</DialogTitle>
        <DialogContent>
          {editingVersion && (
            <VersionEditForm
              version={editingVersion}
              formData={versionFormData}
              setFormData={setVersionFormData}
              onSubmit={handleUpdateVersion}
              onCancel={() => setVersionEditDialogOpen(false)}
              submitting={submitting}
            />
          )}
        </DialogContent>
      </Dialog>

    </Box>
  );
};

// Componente para formulario de edición de versión
const VersionEditForm: React.FC<{
  version: Version;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
}> = ({ version, formData, setFormData, onSubmit, onCancel, submitting }) => {

  const VERSION_TYPES = [
    { value: 'STANDARD', label: 'Standard' },
    { value: 'ENSAMBLE', label: 'Ensamble' },
    { value: 'DUETO', label: 'Dueto' },
    { value: 'GRUPO_REDUCIDO', label: 'Grupo Reducido' },
  ];

  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps } = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    multiple: false,
    onDrop: (files) => {
      setFormData((prev: any) => ({ ...prev, image: files[0], removeImage: false }));
    },
  });

  const { getRootProps: getAudioRootProps, getInputProps: getAudioInputProps } = useDropzone({
    accept: { 'audio/*': ['.mp3', '.wav', '.ogg'] },
    multiple: false,
    onDrop: (files) => setFormData((prev: any) => ({ ...prev, audio_file: files[0] })),
  });

  const { getRootProps: getMusRootProps, getInputProps: getMusInputProps } = useDropzone({
    accept: { 'application/*': ['.mscz', '.mscx'] },
    multiple: false,
    onDrop: (files) => setFormData((prev: any) => ({ ...prev, mus_file: files[0] })),
  });

  return (
    <Box display="flex" flexDirection="column" gap={3} pt={1}>
      <TextField
        label="Título"
        value={formData.title}
        onChange={(e) => setFormData((prev: any) => ({ ...prev, title: e.target.value }))}
        required
        fullWidth
      />

      <TextField
        select
        label="Tipo"
        value={formData.type}
        onChange={(e) => setFormData((prev: any) => ({ ...prev, type: e.target.value }))}
        fullWidth
      >
        {VERSION_TYPES.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        label="Notas"
        value={formData.notes}
        onChange={(e) => setFormData((prev: any) => ({ ...prev, notes: e.target.value }))}
        multiline
        rows={3}
        fullWidth
      />

      {/* Vista previa de imagen actual */}
      {version.image_url && !formData.image && !formData.removeImage && (
        <Card sx={{ p: 2, backgroundColor: 'background.default' }}>
          <Typography variant="subtitle2" gutterBottom>
            Imagen actual
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              component="img"
              src={version.image_url}
              alt={version.title}
              sx={{
                width: 100,
                height: 100,
                objectFit: 'cover',
                borderRadius: 1,
                border: version.has_own_image ? '2px solid #00d4aa' : '2px solid #999',
              }}
            />
            <Box flexGrow={1}>
              <Chip
                size="small"
                label={version.has_own_image ? 'Imagen propia' : 'Heredada del tema'}
                color={version.has_own_image ? 'primary' : 'default'}
                sx={{ mb: 1 }}
              />
              <Typography variant="caption" display="block" color="text.secondary">
                {version.has_own_image
                  ? 'Esta versión tiene su propia imagen'
                  : 'Esta versión usa la imagen del tema'}
              </Typography>
              {version.has_own_image && (
                <Button
                  size="small"
                  color="error"
                  onClick={() => setFormData((prev: any) => ({ ...prev, removeImage: true }))}
                  sx={{ mt: 1 }}
                >
                  Eliminar imagen propia
                </Button>
              )}
            </Box>
          </Box>
        </Card>
      )}

      {formData.removeImage && (
        <Alert severity="warning">
          La imagen propia será eliminada al guardar. La versión heredará la imagen del tema.
        </Alert>
      )}

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
            {formData.image ? formData.image.name : formData.removeImage ? 'Subir nueva imagen (opcional)' : 'Cambiar imagen'}
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
        <Button onClick={onCancel}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={submitting || !formData.title.trim()}
        >
          {submitting ? <CircularProgress size={20} /> : 'Actualizar'}
        </Button>
      </Box>
    </Box>
  );
};

// Componente para mostrar versiones de un repertorio
const VersionsGrid: React.FC<{
  repertoire: Repertoire;
  onViewSheetMusic: (version: Version) => void;
  onEditVersion: (version: Version) => void;
  onRefresh?: () => void;
  onAddVersions?: () => void;
}> = ({ repertoire, onViewSheetMusic, onEditVersion, onRefresh, onAddVersions }) => {
  const [sheetMusicCounts, setSheetMusicCounts] = useState<Record<number, number>>({});

  // Estados para dialog de información de versión
  const [versionInfoDialogOpen, setVersionInfoDialogOpen] = useState(false);
  const [selectedVersionForInfo, setSelectedVersionForInfo] = useState<Version | null>(null);

  useEffect(() => {
    // Cargar conteo de partituras para cada versión
    const loadSheetMusicCounts = async () => {
      if (!repertoire.versions) return;

      const counts: Record<number, number> = {};
      for (const rv of repertoire.versions) {
        try {
          const response = await fetch(
            `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/sheet-music/?version=${rv.version.id}`,
            {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
            }
          );
          const data = await response.json();
          counts[rv.version.id] = Array.isArray(data) ? data.length : (data.results?.length || 0);
        } catch (err) {
          counts[rv.version.id] = 0;
        }
      }
      setSheetMusicCounts(counts);
    };

    loadSheetMusicCounts();
  }, [repertoire.versions]);

  if (!repertoire.versions || repertoire.versions.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary" mb={2}>
          No hay versiones en este repertorio
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Agrega versiones de temas musicales a este repertorio
        </Typography>
        {onAddVersions && (
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={onAddVersions}
            color="primary"
          >
            Agregar Versiones
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box
      display="grid"
      gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))"
      gap={2}
      mt={2}
    >
      {repertoire.versions.map((rv) => (
        <Card key={rv.version.id} sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Avatar sx={{ backgroundColor: 'secondary.main' }}>
              <Music size={20} />
            </Avatar>
            <Box flexGrow={1}>
              <Typography variant="h6">
                {rv.version.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {(rv.version as any).theme_title}
              </Typography>
              <Chip
                size="small"
                label={(rv.version as any).type_display || rv.version.type}
                color="secondary"
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>

          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <FileText size={14} />
              <Typography variant="body2" color="text.secondary">
                {sheetMusicCounts[rv.version.id] || 0} partituras
              </Typography>
            </Box>

            <Box>
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedVersionForInfo(rv.version);
                  setVersionInfoDialogOpen(true);
                }}
                color="secondary"
                title="Información de la Versión"
              >
                <Eye size={16} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => onEditVersion(rv.version)}
                title="Editar Versión"
              >
                <Edit size={16} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => onViewSheetMusic(rv.version)}
                color="primary"
                title="Gestionar Partituras"
              >
                <FileText size={16} />
              </IconButton>
            </Box>
          </Box>

          {rv.notes && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1, fontStyle: 'italic' }}
            >
              "{rv.notes}"
            </Typography>
          )}
        </Card>
      ))}

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
            <VersionInfoContentRepertoire
              version={selectedVersionForInfo}
              themeName={(selectedVersionForInfo as any).theme_title || 'Tema'}
              onAddSheetMusic={onViewSheetMusic}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

// Componente reutilizado del VersionManager para gestionar partituras
const SheetMusicForVersionInRepertoire: React.FC<{
  versionId: number;
  onClose: () => void;
}> = ({ versionId, onClose }) => {
  const [version, setVersion] = useState<Version | null>(null);
  const [sheetMusic, setSheetMusic] = useState<any[]>([]);
  const [versionFiles, setVersionFiles] = useState<any[]>([]);
  const [instruments, setInstruments] = useState<any[]>([]);
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
  }, [versionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      const [versionData, sheetsData, versionFilesData, instrumentsData] = await Promise.all([
        apiService.getVersion(versionId),
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/sheet-music/?version=${versionId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }).then(res => res.json()),
        apiService.getVersionFiles({ version: versionId }),
        apiService.getInstruments(),
      ]);
      setVersion(versionData);
      setSheetMusic(Array.isArray(sheetsData) ? sheetsData : (sheetsData as any).results || []);
      setVersionFiles(Array.isArray(versionFilesData) ? versionFilesData : (versionFilesData as any).results || []);
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

  const handleDeleteVersionFile = async (fileId: number) => {
    if (!window.confirm('¿Eliminar este archivo?')) return;

    try {
      await apiService.deleteVersionFile(fileId);
      await loadData();
    } catch (err) {
      console.error('Error deleting version file:', err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  // Detectar si la versión usa VersionFiles en lugar de SheetMusic
  const usesVersionFiles = version && ['DUETO', 'ENSAMBLE', 'GRUPO_REDUCIDO'].includes(version.type);

  return (
    <Box>
      {/* Mostrar VersionFiles si corresponde */}
      {usesVersionFiles ? (
        <>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Archivos ({versionFiles.length})
            </Typography>
            <Alert severity="info" sx={{ flexGrow: 1, mx: 2 }}>
              Para versiones tipo {version?.type_display}, use el Administrador de Versiones para agregar archivos
            </Alert>
          </Box>

          <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={2}>
            {versionFiles.map((file: any) => (
              <Card key={file.id} sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ backgroundColor: 'primary.main' }}>
                    <FileText size={20} />
                  </Avatar>
                  <Box flexGrow={1}>
                    <Typography variant="subtitle2">
                      {file.tuning_display || file.instrument_name || file.file_type_display}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {file.file_type_display}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    component="a"
                    href={typeof file.file === 'string' ? file.file : '#'}
                    target="_blank"
                    color="primary"
                    title="Descargar PDF"
                  >
                    <Download size={16} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteVersionFile(file.id)}
                    color="error"
                    title="Eliminar Archivo"
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Box>
                {file.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {file.description}
                  </Typography>
                )}
                {file.has_own_audio && (
                  <Chip
                    size="small"
                    icon={<Music size={14} />}
                    label="Audio disponible"
                    color="secondary"
                    sx={{ mt: 1 }}
                  />
                )}
              </Card>
            ))}
          </Box>
        </>
      ) : (
        /* Interfaz para SheetMusic (versiones STANDARD) */
        <>
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
            <SheetMusicInfoContentRepertoire
              sheet={selectedSheetForInfo}
              versionTitle="Versión"
            />
          )}
        </DialogContent>
      </Dialog>
        </>
      )}
    </Box>
  );
};

// Componente para mostrar información completa de una versión en repertorio
const VersionInfoContentRepertoire: React.FC<{
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
  const groupedSheetMusic = sheetMusic.reduce((acc: Record<string, any[]>, sheet: any) => {
    const type = sheet.type_display || 'Sin tipo';
    if (!acc[type]) acc[type] = [];
    acc[type].push(sheet);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <Box pt={1}>
      {/* Información básica de la versión */}
      <Box display="flex" gap={3} mb={4}>
        {version.image_url && (
          <Box
            component="img"
            src={version.image_url}
            alt={version.title}
            sx={{
              width: 120,
              height: 120,
              objectFit: 'cover',
              borderRadius: 2,
              border: version.has_own_image ? '2px solid #00d4aa' : '2px solid #999',
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
            label={version.type_display || version.type}
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
              {type} ({sheets.length})
            </Typography>
            <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={2}>
              {sheets.map((sheet) => (
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

// Componente para mostrar información completa de una partitura en repertorio
const SheetMusicInfoContentRepertoire: React.FC<{
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

// Componente para agregar versiones a un repertorio
const AddVersionsToRepertoire: React.FC<{
  repertoire: Repertoire;
  allVersions: Version[];
  onClose: () => void;
}> = ({ repertoire, allVersions, onClose }) => {
  const [selectedVersionIds, setSelectedVersionIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const VERSION_TYPES = [
    { value: 'ALL', label: 'Todos los tipos' },
    { value: 'STANDARD', label: 'Standard' },
    { value: 'ENSAMBLE', label: 'Ensamble' },
    { value: 'DUETO', label: 'Dueto' },
    { value: 'GRUPO_REDUCIDO', label: 'Grupo Reducido' },
  ];

  // IDs de versiones ya en el repertorio
  const existingVersionIds = repertoire.versions?.map(rv => rv.version.id) || [];

  // Filtrar versiones disponibles
  const filteredVersions = allVersions.filter(version => {
    const matchesSearch =
      (version.theme_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((version as any).artist || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      version.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'ALL' || version.type === typeFilter;

    return matchesSearch && matchesType;
  });

  // Separar versiones en disponibles y ya agregadas
  const availableVersions = filteredVersions.filter(v => !existingVersionIds.includes(v.id));
  const alreadyAddedVersions = filteredVersions.filter(v => existingVersionIds.includes(v.id));

  const handleToggleVersion = (versionId: number) => {
    setSelectedVersionIds(prev =>
      prev.includes(versionId)
        ? prev.filter(id => id !== versionId)
        : [...prev, versionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedVersionIds.length === availableVersions.length) {
      setSelectedVersionIds([]);
    } else {
      setSelectedVersionIds(availableVersions.map(v => v.id));
    }
  };

  const handleSubmit = async () => {
    if (selectedVersionIds.length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/repertoires/${repertoire.id}/add_versions/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version_ids: selectedVersionIds,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Error al agregar versiones');
      }

      const data = await response.json();

      if (data.errors && data.errors.length > 0) {
        setError(data.errors.join(', '));
      } else {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar versiones');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box pt={1}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Búsqueda y filtros */}
      <Box display="flex" gap={2} mb={3}>
        <TextField
          size="small"
          placeholder="Buscar por tema, artista..."
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
          label="Tipo"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          {VERSION_TYPES.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Seleccionar todas */}
      {availableVersions.length > 0 && (
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Button
            size="small"
            variant="outlined"
            onClick={handleSelectAll}
          >
            {selectedVersionIds.length === availableVersions.length ? 'Deseleccionar' : 'Seleccionar'} todas ({availableVersions.length})
          </Button>
          <Typography variant="body2" color="text.secondary">
            {selectedVersionIds.length} seleccionadas
          </Typography>
        </Box>
      )}

      {/* Lista de versiones disponibles */}
      <Box sx={{ maxHeight: '400px', overflowY: 'auto', mb: 2 }}>
        {availableVersions.length === 0 && alreadyAddedVersions.length === 0 && (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
            No se encontraron versiones
          </Typography>
        )}

        {availableVersions.length === 0 && alreadyAddedVersions.length > 0 && (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
            Todas las versiones filtradas ya están en el repertorio
          </Typography>
        )}

        {availableVersions.map((version) => (
          <Card
            key={version.id}
            sx={{
              p: 2,
              mb: 1,
              cursor: 'pointer',
              backgroundColor: selectedVersionIds.includes(version.id) ? 'action.selected' : 'background.paper',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
            onClick={() => handleToggleVersion(version.id)}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <input
                type="checkbox"
                checked={selectedVersionIds.includes(version.id)}
                onChange={() => handleToggleVersion(version.id)}
                style={{ cursor: 'pointer' }}
              />
              <Avatar sx={{ backgroundColor: 'secondary.main' }}>
                <Music size={20} />
              </Avatar>
              <Box flexGrow={1}>
                <Typography variant="subtitle2">
                  {version.theme_title || 'Sin tema'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(version as any).artist || 'Sin artista'} • {version.title}
                </Typography>
              </Box>
              <Chip
                size="small"
                label={(version as any).type_display || version.type}
                color="secondary"
              />
            </Box>
          </Card>
        ))}

        {/* Versiones ya agregadas (solo informativo) */}
        {alreadyAddedVersions.length > 0 && (
          <Box mt={3}>
            <Typography variant="subtitle2" color="text.secondary" mb={1}>
              Ya en el repertorio ({alreadyAddedVersions.length})
            </Typography>
            {alreadyAddedVersions.map((version) => (
              <Card
                key={version.id}
                sx={{
                  p: 2,
                  mb: 1,
                  opacity: 0.6,
                  backgroundColor: 'action.disabledBackground',
                }}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ backgroundColor: 'grey.500' }}>
                    <Music size={20} />
                  </Avatar>
                  <Box flexGrow={1}>
                    <Typography variant="subtitle2">
                      {version.theme_title || 'Sin tema'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {(version as any).artist || 'Sin artista'} • {version.title}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label="Ya agregada"
                    color="default"
                  />
                </Box>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      {/* Botones de acción */}
      <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
        <Button onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || selectedVersionIds.length === 0}
          startIcon={submitting ? <CircularProgress size={16} /> : <Plus size={16} />}
        >
          {submitting ? 'Agregando...' : `Agregar ${selectedVersionIds.length} versiones`}
        </Button>
      </Box>
    </Box>
  );
};

export default RepertoireManager;