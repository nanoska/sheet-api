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
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Plus,
  List as ListIcon,
  Edit,
  Trash2,
  Search,
  Music,
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
    </Box>
  );
};

export default RepertoireManager;