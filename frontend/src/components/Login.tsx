import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Avatar,
  Container,
  Divider,
} from '@mui/material';
import { Music, User, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
    setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(credentials);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'radial-gradient(circle at 20% 20%, rgba(0, 212, 170, 0.1) 0%, transparent 50%), ' +
            'radial-gradient(circle at 80% 80%, rgba(79, 195, 247, 0.1) 0%, transparent 50%)',
        },
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            position: 'relative',
            zIndex: 1,
            backgroundColor: 'rgba(26, 26, 26, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid #333333',
            borderRadius: 3,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              p: 4,
              pb: 2,
              textAlign: 'center',
              background: 'linear-gradient(45deg, rgba(0, 212, 170, 0.1), rgba(79, 195, 247, 0.1))',
            }}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 2,
                background: 'linear-gradient(45deg, #00d4aa, #4fc3f7)',
                boxShadow: '0 8px 20px rgba(0, 212, 170, 0.3)',
              }}
            >
              <Music size={40} color="#000" />
            </Avatar>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #00d4aa, #4fc3f7)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                mb: 1,
              }}
            >
              SheetMusic Admin
            </Typography>

            <Typography variant="body1" color="text.secondary">
              Accede al panel de administración
            </Typography>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

          <CardContent sx={{ p: 4 }}>
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  borderColor: 'rgba(244, 67, 54, 0.3)',
                  color: '#ff6b6b',
                }}
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                id="username"
                name="username"
                label="Usuario"
                value={credentials.username}
                onChange={handleChange}
                disabled={loading}
                placeholder="Ingresa tu usuario"
                required
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, color: 'text.secondary' }}>
                      <User size={20} />
                    </Box>
                  ),
                }}
              />

              <TextField
                fullWidth
                id="password"
                name="password"
                label="Contraseña"
                type="password"
                value={credentials.password}
                onChange={handleChange}
                disabled={loading}
                placeholder="Ingresa tu contraseña"
                required
                sx={{ mb: 4 }}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, color: 'text.secondary' }}>
                      <Lock size={20} />
                    </Box>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || !credentials.username || !credentials.password}
                sx={{
                  height: 56,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  background: loading
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'linear-gradient(45deg, #00d4aa, #4fc3f7)',
                  color: loading ? '#666' : '#000',
                  boxShadow: loading
                    ? 'none'
                    : '0 8px 20px rgba(0, 212, 170, 0.3)',
                  '&:hover': {
                    background: loading
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'linear-gradient(45deg, #00c49a, #42a5f5)',
                    boxShadow: loading
                      ? 'none'
                      : '0 12px 30px rgba(0, 212, 170, 0.4)',
                  },
                  '&:disabled': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#666',
                  },
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={20} sx={{ color: '#666' }} />
                    Iniciando sesión...
                  </Box>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Sistema de gestión de partituras para orquestas de viento
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Login;