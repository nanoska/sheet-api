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
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Plus,
  MapPin,
  Edit,
  Trash2,
  Search,
  Phone,
  Mail,
  Globe,
} from 'lucide-react';
import { Location } from '../../types/api';
import { apiService } from '../../services/api';

interface LocationFormData {
  name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  capacity: number | null;
  contact_email: string;
  contact_phone: string;
  website: string;
  notes: string;
}

const LocationManager: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'Argentina',
    capacity: null,
    contact_email: '',
    contact_phone: '',
    website: '',
    notes: '',
  });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const data = await apiService.getLocations();
      setLocations(Array.isArray(data) ? data : (data as any).results || []);
    } catch (err) {
      setError('Error loading locations');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (location?: Location) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        name: location.name,
        address: location.address,
        city: location.city,
        postal_code: location.postal_code,
        country: location.country,
        capacity: location.capacity,
        contact_email: location.contact_email || '',
        contact_phone: location.contact_phone || '',
        website: location.website || '',
        notes: location.notes || '',
      });
    } else {
      setEditingLocation(null);
      setFormData({
        name: '',
        address: '',
        city: '',
        postal_code: '',
        country: 'Argentina',
        capacity: null,
        contact_email: '',
        contact_phone: '',
        website: '',
        notes: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    setSubmitting(true);
    try {
      if (editingLocation) {
        await apiService.updateLocation(editingLocation.id, formData as any);
      } else {
        await apiService.createLocation(formData as any);
      }

      await loadLocations();
      setDialogOpen(false);
    } catch (err) {
      setError('Error saving location');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this location?')) return;
    try {
      await apiService.deleteLocation(id);
      await loadLocations();
    } catch (err) {
      setError('Error deleting location');
    }
  };

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.city.toLowerCase().includes(searchTerm.toLowerCase())
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
          placeholder="Search locations..."
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
          New Location
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
        {filteredLocations.map((location) => (
          <Card key={location.id} sx={{ p: 2, height: '100%' }}>
              <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
                <Avatar sx={{ backgroundColor: 'warning.main' }}>
                  <MapPin size={24} />
                </Avatar>

                <Box flexGrow={1} minWidth={0}>
                  <Typography variant="h6" noWrap>
                    {location.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {location.city}, {location.country}
                  </Typography>
                </Box>

                <Box>
                  <IconButton size="small" onClick={() => handleOpenDialog(location)}>
                    <Edit size={16} />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(location.id)} color="error">
                    <Trash2 size={16} />
                  </IconButton>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {location.address}
              </Typography>

              <Box display="flex" flexDirection="column" gap={1}>
                <Typography variant="body2">
                  Capacity: {location.capacity} people
                </Typography>

                {location.contact_phone && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Phone size={14} />
                    <Typography variant="body2" color="text.secondary">
                      {location.contact_phone}
                    </Typography>
                  </Box>
                )}

                {location.contact_email && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Mail size={14} />
                    <Typography variant="body2" color="text.secondary">
                      {location.contact_email}
                    </Typography>
                  </Box>
                )}

                {location.website && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Globe size={14} />
                    <Typography
                      variant="body2"
                      color="primary.main"
                      component="a"
                      href={location.website}
                      target="_blank"
                      sx={{ textDecoration: 'none' }}
                    >
                      Website
                    </Typography>
                  </Box>
                )}
              </Box>
            </Card>
        ))}
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingLocation ? 'Edit Location' : 'New Location'}</DialogTitle>
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
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              required
              fullWidth
            />

            <Box display="flex" gap={2}>
              <TextField
                label="City"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                required
                fullWidth
              />

              <TextField
                label="Postal Code"
                value={formData.postal_code}
                onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                fullWidth
              />
            </Box>

            <Box display="flex" gap={2}>
              <TextField
                label="Country"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                required
                fullWidth
              />

              <TextField
                label="Capacity"
                type="number"
                value={formData.capacity || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: Number(e.target.value) || null }))}
                required
                fullWidth
              />
            </Box>

            <Box display="flex" gap={2}>
              <TextField
                label="Contact Email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                fullWidth
              />

              <TextField
                label="Contact Phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                fullWidth
              />
            </Box>

            <TextField
              label="Website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              multiline
              rows={3}
              fullWidth
            />

            <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting || !formData.name.trim()}
              >
                {submitting ? <CircularProgress size={20} /> : (editingLocation ? 'Update' : 'Create')}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default LocationManager;