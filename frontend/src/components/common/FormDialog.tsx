import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';
import { Save, X } from 'lucide-react';

export type FieldType = 'text' | 'email' | 'password' | 'number' | 'select' | 'boolean' | 'textarea' | 'date' | 'datetime-local';

export interface FormField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: any; label: string }[];
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
}

interface FormDialogProps {
  open: boolean;
  title: string;
  fields: FormField[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onClose: () => void;
  onSave: () => void;
  loading?: boolean;
  error?: string | null;
}

export default function FormDialog({
  open,
  title,
  fields,
  values,
  onChange,
  onClose,
  onSave,
  loading = false,
  error = null,
}: FormDialogProps) {
  const renderField = (field: FormField) => {
    const value = values[field.key] || '';

    switch (field.type) {
      case 'select':
        return (
          <FormControl fullWidth margin="normal" key={field.key}>
            <InputLabel required={field.required}>{field.label}</InputLabel>
            <Select
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
              disabled={field.disabled || loading}
              label={field.label}
            >
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'boolean':
        return (
          <FormControlLabel
            key={field.key}
            control={
              <Switch
                checked={Boolean(value)}
                onChange={(e) => onChange(field.key, e.target.checked)}
                disabled={field.disabled || loading}
              />
            }
            label={field.label}
            sx={{ mt: 1, mb: 1 }}
          />
        );

      case 'textarea':
        return (
          <TextField
            key={field.key}
            fullWidth
            margin="normal"
            label={field.label}
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            required={field.required}
            disabled={field.disabled || loading}
            placeholder={field.placeholder}
            multiline
            rows={field.rows || 3}
          />
        );

      default:
        return (
          <TextField
            key={field.key}
            fullWidth
            margin="normal"
            label={field.label}
            type={field.type}
            value={value}
            onChange={(e) => {
              const newValue = field.type === 'number'
                ? parseFloat(e.target.value) || 0
                : e.target.value;
              onChange(field.key, newValue);
            }}
            required={field.required}
            disabled={field.disabled || loading}
            placeholder={field.placeholder}
            InputLabelProps={
              field.type === 'date' || field.type === 'datetime-local'
                ? { shrink: true }
                : undefined
            }
          />
        );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        {error && (
          <Box mb={2}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Box>
        )}

        <Box component="form" noValidate autoComplete="off">
          {fields.map(renderField)}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          disabled={loading}
          startIcon={<X size={16} />}
        >
          Cancelar
        </Button>

        <Button
          onClick={onSave}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <Save size={16} />}
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}