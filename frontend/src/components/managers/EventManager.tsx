import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
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
  Calendar,
  Edit,
  Trash2,
  Search,
  MapPin,
  Clock,
} from 'lucide-react';
import { Event, Location, Repertoire } from '../../types/api';
import { apiService } from '../../services/api';

const EVENT_TYPES = [
  { value: 'CONCERT', label: 'Concierto' },
  { value: 'REHEARSAL', label: 'Ensayo' },
  { value: 'RECORDING', label: 'Grabación' },
  { value: 'WORKSHOP', label: 'Taller' },
  { value: 'OTHER', label: 'Otro' },
];

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'COMPLETED', label: 'Completado' },
];

interface EventFormData {
  title: string;
  event_type: string;
  status: string;
  description: string;
  start_datetime: string;
  end_datetime: string;
  location_id: number | null;
  repertoire_id: number | null;
  is_public: boolean;
  max_attendees: number | null;
  price: number;
}

const EventManager: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [repertoires, setRepertoires] = useState<Repertoire[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    event_type: 'CONCERT',
    status: 'DRAFT',
    description: '',
    start_datetime: '',
    end_datetime: '',
    location_id: null,
    repertoire_id: null,
    is_public: false,
    max_attendees: null,
    price: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [eventsData, locationsData, repertoiresData] = await Promise.all([
        apiService.getEvents(),
        apiService.getLocations(),
        apiService.getRepertoires(),
      ]);
      setEvents(Array.isArray(eventsData) ? eventsData : eventsData.results || []);
      setLocations(Array.isArray(locationsData) ? locationsData : (locationsData as any).results || []);
      setRepertoires(Array.isArray(repertoiresData) ? repertoiresData : (repertoiresData as any).results || []);
    } catch (err) {
      setError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        event_type: event.event_type,
        status: event.status,
        description: event.description || '',
        start_datetime: event.start_datetime.slice(0, 16),
        end_datetime: event.end_datetime.slice(0, 16),
        location_id: event.location_id || null,
        repertoire_id: event.repertoire_id || null,
        is_public: event.is_public,
        max_attendees: event.max_attendees || null,
        price: event.price,
      });
    } else {
      setEditingEvent(null);
      setFormData({
        title: '',
        event_type: 'CONCERT',
        status: 'DRAFT',
        description: '',
        start_datetime: '',
        end_datetime: '',
        location_id: null,
        repertoire_id: null,
        is_public: false,
        max_attendees: null,
        price: 0,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;

    setSubmitting(true);
    try {
      const eventData = {
        ...formData,
        start_datetime: new Date(formData.start_datetime).toISOString(),
        end_datetime: new Date(formData.end_datetime).toISOString(),
      };

      if (editingEvent) {
        await apiService.updateEvent(editingEvent.id, eventData as any);
      } else {
        await apiService.createEvent(eventData as any);
      }

      await loadData();
      setDialogOpen(false);
    } catch (err) {
      setError('Error saving event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await apiService.deleteEvent(id);
      await loadData();
    } catch (err) {
      setError('Error deleting event');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'success';
      case 'CANCELLED': return 'error';
      case 'COMPLETED': return 'info';
      default: return 'default';
    }
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location?.name.toLowerCase().includes(searchTerm.toLowerCase())
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
          placeholder="Search events..."
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
          New Event
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
        {filteredEvents.map((event) => (
          <Card key={event.id} sx={{ p: 2, height: '100%' }}>
              <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
                <Avatar sx={{ backgroundColor: 'info.main' }}>
                  <Calendar size={24} />
                </Avatar>

                <Box flexGrow={1} minWidth={0}>
                  <Typography variant="h6" noWrap>
                    {event.title}
                  </Typography>
                  <Box display="flex" gap={1} mt={1}>
                    <Chip
                      size="small"
                      label={event.status}
                      color={getStatusColor(event.status) as any}
                    />
                    <Chip size="small" label={event.event_type} />
                  </Box>
                </Box>

                <Box>
                  <IconButton size="small" onClick={() => handleOpenDialog(event)}>
                    <Edit size={16} />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(event.id)} color="error">
                    <Trash2 size={16} />
                  </IconButton>
                </Box>
              </Box>

              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Clock size={14} />
                  <Typography variant="body2" color="text.secondary">
                    {new Date(event.start_datetime).toLocaleString()}
                  </Typography>
                </Box>

                {event.location && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <MapPin size={14} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {event.location.name}
                    </Typography>
                  </Box>
                )}

                {event.price > 0 && (
                  <Typography variant="body2" color="primary.main">
                    ${event.price}
                  </Typography>
                )}
              </Box>
            </Card>
        ))}
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingEvent ? 'Edit Event' : 'New Event'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} pt={1}>
            <TextField
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              fullWidth
            />

            <Box display="flex" gap={2}>
              <TextField
                select
                label="Type"
                value={formData.event_type}
                onChange={(e) => setFormData(prev => ({ ...prev, event_type: e.target.value }))}
                fullWidth
              >
                {EVENT_TYPES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                fullWidth
              >
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box display="flex" gap={2}>
              <TextField
                label="Start Date & Time"
                type="datetime-local"
                value={formData.start_datetime}
                onChange={(e) => setFormData(prev => ({ ...prev, start_datetime: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="End Date & Time"
                type="datetime-local"
                value={formData.end_datetime}
                onChange={(e) => setFormData(prev => ({ ...prev, end_datetime: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <Box display="flex" gap={2}>
              <Autocomplete
                options={locations}
                getOptionLabel={(location) => location.name}
                value={locations.find(l => l.id === formData.location_id) || null}
                onChange={(_, value) => setFormData(prev => ({ ...prev, location_id: value?.id || null }))}
                renderInput={(params) => <TextField {...params} label="Location" />}
                sx={{ flex: 1 }}
              />

              <Autocomplete
                options={repertoires}
                getOptionLabel={(repertoire) => repertoire.name}
                value={repertoires.find(r => r.id === formData.repertoire_id) || null}
                onChange={(_, value) => setFormData(prev => ({ ...prev, repertoire_id: value?.id || null }))}
                renderInput={(params) => <TextField {...params} label="Repertoire" />}
                sx={{ flex: 1 }}
              />
            </Box>

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
              fullWidth
            />

            <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting || !formData.title.trim()}
              >
                {submitting ? <CircularProgress size={20} /> : (editingEvent ? 'Update' : 'Create')}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default EventManager;