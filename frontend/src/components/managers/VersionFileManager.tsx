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
  Chip,
  CircularProgress,
  Alert,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  DialogActions,
} from '@mui/material';
import {
  Plus,
  FileText,
  Edit,
  Trash2,
  Upload,
  Search,
  Music2,
  Download,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { VersionFile, Version, Instrument } from '../../types/api';
import { apiService } from '../../services/api';

const FILE_TYPE_CHOICES = [
  { value: 'DUETO_TRANSPOSITION', label: 'Dueto - Transposición' },
  { value: 'ENSAMBLE_INSTRUMENT', label: 'Ensamble - Instrumento' },
  { value: 'STANDARD_SCORE', label: 'Standard - Partitura General' },
];

const TUNING_CHOICES = [
  { value: 'Bb', label: 'Si bemol - Clave de Sol' },
  { value: 'Eb', label: 'Mi bemol - Clave de Sol' },
  { value: 'F', label: 'Fa - Clave de Sol' },
  { value: 'C', label: 'Do - Clave de Sol' },
  { value: 'C_BASS', label: 'Do - Clave de Fa (Bass)' },
];

interface VersionFileFormData {
  version: number | null;
  file_type: string;
  tuning?: string;
  instrument?: number | null;
  file?: File;
  audio?: File;
  description: string;
}

const VersionFileManager: React.FC = () => {
  const [versionFiles, setVersionFiles] = useState<VersionFile[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVersionFile, setEditingVersionFile] = useState<VersionFile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<VersionFileFormData>({
    version: null,
    file_type: 'STANDARD_SCORE',
    tuning: undefined,
    instrument: null,
    description: '',
  });

  const { getRootProps: getFileRootProps, getInputProps: getFileInputProps } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    onDrop: (files) => setFormData(prev => ({ ...prev, file: files[0] })),
  });

  const { getRootProps: getAudioRootProps, getInputProps: getAudioInputProps } = useDropzone({
    accept: { 'audio/*': ['.mp3', '.wav', '.ogg'] },
    multiple: false,
    onDrop: (files) => setFormData(prev => ({ ...prev, audio: files[0] })),
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [versionFilesData, versionsData, instrumentsData] = await Promise.all([
        apiService.getVersionFiles(),
        apiService.getVersions(),
        apiService.getInstruments(),
      ]);
      setVersionFiles(Array.isArray(versionFilesData) ? versionFilesData : (versionFilesData as any).results || []);
      setVersions(Array.isArray(versionsData) ? versionsData : (versionsData as any).results || []);
      setInstruments(Array.isArray(instrumentsData) ? instrumentsData : (instrumentsData as any).results || []);
    } catch (err) {
      setError('Error loading data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (versionFile?: VersionFile) => {
    if (versionFile) {
      setEditingVersionFile(versionFile);
      setFormData({
        version: versionFile.version,
        file_type: versionFile.file_type,
        tuning: versionFile.tuning,
        instrument: versionFile.instrument || null,
        description: versionFile.description || '',
      });
    } else {
      setEditingVersionFile(null);
      setFormData({
        version: null,
        file_type: 'STANDARD_SCORE',
        tuning: undefined,
        instrument: null,
        description: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingVersionFile(null);
    setFormData({
      version: null,
      file_type: 'STANDARD_SCORE',
      tuning: undefined,
      instrument: null,
      description: '',
    });
  };

  const handleSubmit = async () => {
    if (!formData.version) {
      setError('Version is required');
      return;
    }

    // Validation based on file_type
    if (formData.file_type === 'DUETO_TRANSPOSITION' && !formData.tuning) {
      setError('Tuning is required for DUETO_TRANSPOSITION');
      return;
    }

    if (formData.file_type === 'ENSAMBLE_INSTRUMENT' && !formData.instrument) {
      setError('Instrument is required for ENSAMBLE_INSTRUMENT');
      return;
    }

    if (!editingVersionFile && !formData.file) {
      setError('File is required');
      return;
    }

    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('version', formData.version.toString());
      formDataToSend.append('file_type', formData.file_type);

      if (formData.tuning) {
        formDataToSend.append('tuning', formData.tuning);
      }

      if (formData.instrument) {
        formDataToSend.append('instrument', formData.instrument.toString());
      }

      if (formData.description) {
        formDataToSend.append('description', formData.description);
      }

      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }

      if (formData.audio) {
        formDataToSend.append('audio', formData.audio);
      }

      if (editingVersionFile) {
        await apiService.updateVersionFile(editingVersionFile.id, formDataToSend);
      } else {
        await apiService.createVersionFile(formDataToSend);
      }

      await loadData();
      handleCloseDialog();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error saving version file');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this version file?')) return;

    try {
      await apiService.deleteVersionFile(id);
      await loadData();
    } catch (err) {
      setError('Error deleting version file');
      console.error(err);
    }
  };

  const filteredVersionFiles = versionFiles.filter((vf) =>
    vf.theme_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vf.version_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vf.file_type_display?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vf.tuning_display?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vf.instrument_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'DUETO_TRANSPOSITION': return '#00d4aa';
      case 'ENSAMBLE_INSTRUMENT': return '#4fc3f7';
      case 'STANDARD_SCORE': return '#9c27b0';
      default: return '#666';
    }
  };

  // Get version object for autocomplete
  const selectedVersion = versions.find(v => v.id === formData.version) || null;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: '#00d4aa', fontWeight: 600 }}>
          Version Files
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => handleOpenDialog()}
          sx={{
            background: 'linear-gradient(135deg, #00d4aa 0%, #4fc3f7 100%)',
            '&:hover': { opacity: 0.9 },
          }}
        >
          Add Version File
        </Button>
      </Box>

      <TextField
        fullWidth
        placeholder="Search by theme, version, type, tuning, or instrument..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: <Search size={20} style={{ marginRight: 8, color: '#00d4aa' }} />,
        }}
        sx={{ mb: 3 }}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 2 }}>
        {filteredVersionFiles.map((versionFile) => (
          <Card
            key={versionFile.id}
            sx={{
              p: 2,
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              '&:hover': {
                border: `1px solid ${getFileTypeColor(versionFile.file_type)}`,
                boxShadow: `0 0 20px ${getFileTypeColor(versionFile.file_type)}33`,
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <FileText size={24} color={getFileTypeColor(versionFile.file_type)} />
                <Box>
                  <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                    {versionFile.theme_title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#aaa' }}>
                    {versionFile.version_title}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton size="small" onClick={() => handleOpenDialog(versionFile)} sx={{ color: '#4fc3f7' }}>
                  <Edit size={18} />
                </IconButton>
                <IconButton size="small" onClick={() => handleDelete(versionFile.id)} sx={{ color: '#ff4444' }}>
                  <Trash2 size={18} />
                </IconButton>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip
                label={versionFile.file_type_display}
                size="small"
                sx={{
                  bgcolor: `${getFileTypeColor(versionFile.file_type)}22`,
                  color: getFileTypeColor(versionFile.file_type),
                  border: `1px solid ${getFileTypeColor(versionFile.file_type)}`,
                }}
              />
              {versionFile.tuning_display && (
                <Chip label={versionFile.tuning_display} size="small" variant="outlined" />
              )}
              {versionFile.instrument_name && (
                <Chip label={versionFile.instrument_name} size="small" variant="outlined" />
              )}
              {versionFile.has_audio && (
                <Chip
                  icon={<Music2 size={14} />}
                  label="Audio"
                  size="small"
                  sx={{ bgcolor: '#4fc3f722', color: '#4fc3f7' }}
                />
              )}
            </Box>

            {versionFile.description && (
              <Typography variant="body2" sx={{ color: '#999', fontSize: '0.875rem', mb: 2 }}>
                {versionFile.description}
              </Typography>
            )}

            <Button
              fullWidth
              variant="outlined"
              startIcon={<Download size={16} />}
              component="a"
              href={typeof versionFile.file === 'string' ? versionFile.file : '#'}
              target="_blank"
              sx={{ color: '#00d4aa', borderColor: '#00d4aa', '&:hover': { borderColor: '#00d4aa', bgcolor: '#00d4aa22' } }}
            >
              Download PDF
            </Button>
          </Card>
        ))}
      </Box>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #00d4aa 0%, #4fc3f7 100%)', color: '#fff' }}>
          {editingVersionFile ? 'Edit Version File' : 'Add New Version File'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Autocomplete
            fullWidth
            options={versions}
            getOptionLabel={(option) => `${option.theme_title} - ${option.title} (${option.type_display})`}
            value={selectedVersion}
            onChange={(_, newValue) => setFormData(prev => ({ ...prev, version: newValue?.id || null }))}
            renderInput={(params) => <TextField {...params} label="Version" required />}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>File Type</InputLabel>
            <Select
              value={formData.file_type}
              onChange={(e) => setFormData(prev => ({ ...prev, file_type: e.target.value }))}
              label="File Type"
            >
              {FILE_TYPE_CHOICES.map((choice) => (
                <MenuItem key={choice.value} value={choice.value}>
                  {choice.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {formData.file_type === 'DUETO_TRANSPOSITION' && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Tuning / Transposition</InputLabel>
              <Select
                value={formData.tuning || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, tuning: e.target.value }))}
                label="Tuning / Transposition"
              >
                {TUNING_CHOICES.map((choice) => (
                  <MenuItem key={choice.value} value={choice.value}>
                    {choice.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {formData.file_type === 'ENSAMBLE_INSTRUMENT' && (
            <Autocomplete
              fullWidth
              options={instruments}
              getOptionLabel={(option) => `${option.name} (${option.afinacion})`}
              value={instruments.find(i => i.id === formData.instrument) || null}
              onChange={(_, newValue) => setFormData(prev => ({ ...prev, instrument: newValue?.id || null }))}
              renderInput={(params) => <TextField {...params} label="Instrument" required />}
              sx={{ mb: 2 }}
            />
          )}

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            sx={{ mb: 2 }}
          />

          <Box
            {...getFileRootProps()}
            sx={{
              border: '2px dashed #00d4aa',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              mb: 2,
              '&:hover': { bgcolor: '#00d4aa11' },
            }}
          >
            <input {...getFileInputProps()} />
            <Upload size={32} color="#00d4aa" style={{ marginBottom: 8 }} />
            <Typography variant="body2">
              {formData.file ? formData.file.name : 'Drop PDF file here or click to select'}
            </Typography>
          </Box>

          <Box
            {...getAudioRootProps()}
            sx={{
              border: '2px dashed #4fc3f7',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': { bgcolor: '#4fc3f711' },
            }}
          >
            <input {...getAudioInputProps()} />
            <Music2 size={32} color="#4fc3f7" style={{ marginBottom: 8 }} />
            <Typography variant="body2">
              {formData.audio ? formData.audio.name : 'Drop audio file here (optional)'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
            sx={{
              background: 'linear-gradient(135deg, #00d4aa 0%, #4fc3f7 100%)',
              '&:hover': { opacity: 0.9 },
            }}
          >
            {submitting ? <CircularProgress size={24} /> : editingVersionFile ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VersionFileManager;
