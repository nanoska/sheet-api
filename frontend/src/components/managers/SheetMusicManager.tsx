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
  Upload,
  Search,
  Download,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { SheetMusic, Version, Instrument } from '../../types/api';
import { apiService } from '../../services/api';

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

interface SheetMusicFormData {
  version: number | null;
  instrument: number | null;
  type: string;
  clef: string;
  file?: File;
}

const SheetMusicManager: React.FC = () => {
  const [sheetMusic, setSheetMusic] = useState<SheetMusic[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<SheetMusicFormData>({
    version: null,
    instrument: null,
    type: 'MELODIA_PRINCIPAL',
    clef: 'SOL',
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    onDrop: (files) => setFormData(prev => ({ ...prev, file: files[0] })),
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sheetData, versionsData, instrumentsData] = await Promise.all([
        apiService.getSheetMusic(),
        apiService.getVersions(),
        apiService.getInstruments(),
      ]);
      setSheetMusic(Array.isArray(sheetData) ? sheetData : (sheetData as any).results || []);
      setVersions(Array.isArray(versionsData) ? versionsData : (versionsData as any).results || []);
      setInstruments(Array.isArray(instrumentsData) ? instrumentsData : (instrumentsData as any).results || []);
    } catch (err) {
      setError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      version: null,
      instrument: null,
      type: 'MELODIA_PRINCIPAL',
      clef: 'SOL',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.version || !formData.instrument || !formData.file) return;

    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('version', formData.version.toString());
      formDataToSend.append('instrument', formData.instrument.toString());
      formDataToSend.append('type', formData.type);
      formDataToSend.append('clef', formData.clef);
      formDataToSend.append('file', formData.file);

      await fetch(`${process.env.REACT_APP_API_URL}/api/sheet-music/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formDataToSend,
      });

      await loadData();
      setDialogOpen(false);
      setFormData({
        version: null,
        instrument: null,
        type: 'MELODIA_PRINCIPAL',
        clef: 'SOL',
      });
    } catch (err) {
      setError('Error uploading sheet music');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSheetMusic = sheetMusic.filter(sheet =>
    (sheet as any).theme_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sheet as any).instrument_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sheet as any).version_title?.toLowerCase().includes(searchTerm.toLowerCase())
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
          placeholder="Search sheet music..."
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
          onClick={handleOpenDialog}
        >
          Upload Sheet
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
        {filteredSheetMusic.map((sheet) => (
          <Card key={sheet.id} sx={{ p: 2, height: '100%' }}>
              <Box display="flex" alignItems="flex-start" gap={2}>
                <Avatar sx={{ backgroundColor: 'error.main' }}>
                  <FileText size={24} />
                </Avatar>

                <Box flexGrow={1} minWidth={0}>
                  <Typography variant="h6" noWrap>
                    {(sheet as any).instrument_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {(sheet as any).theme_title} - {(sheet as any).version_title}
                  </Typography>
                  <Box display="flex" gap={1} mt={1}>
                    <Chip size="small" label={(sheet as any).type_display} color="primary" />
                    <Chip size="small" label={(sheet as any).clef_display} />
                    {sheet.tonalidad_relativa && (
                      <Chip size="small" label={sheet.tonalidad_relativa} color="secondary" />
                    )}
                  </Box>
                </Box>

                <IconButton
                  size="small"
                  component="a"
                  href={sheet.file}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download size={16} />
                </IconButton>
              </Box>
            </Card>
        ))}
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Upload Sheet Music</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} pt={1}>
            <Autocomplete
              options={versions}
              getOptionLabel={(version) => `${version.theme_title} - ${version.title}`}
              value={versions.find(v => v.id === formData.version) || null}
              onChange={(_, value) => setFormData(prev => ({ ...prev, version: value?.id || null }))}
              renderInput={(params) => <TextField {...params} label="Version" required />}
            />

            <Autocomplete
              options={instruments}
              getOptionLabel={(instrument) => instrument.name}
              value={instruments.find(i => i.id === formData.instrument) || null}
              onChange={(_, value) => setFormData(prev => ({ ...prev, instrument: value?.id || null }))}
              renderInput={(params) => <TextField {...params} label="Instrument" required />}
            />

            <Box display="flex" gap={2}>
              <TextField
                select
                label="Type"
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
                label="Clef"
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
                p: 4,
                border: '2px dashed #333',
                borderRadius: 1,
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isDragActive ? 'action.hover' : 'transparent',
              }}
            >
              <input {...getInputProps()} />
              <Upload size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
              <Typography variant="h6">
                {formData.file ? formData.file.name : 'Drop PDF file or click to browse'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                PDF files only
              </Typography>
            </Box>

            <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting || !formData.version || !formData.instrument || !formData.file}
              >
                {submitting ? <CircularProgress size={20} /> : 'Upload'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SheetMusicManager;