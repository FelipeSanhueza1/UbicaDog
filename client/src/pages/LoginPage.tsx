import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Stack,
  Link,
} from '@mui/material';
import {
  Google as GoogleIcon,
  Pets as PetIcon,
  LockOutlined as LockIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();

  const [email, setEmail] = useState('usuario@gmail.com');
  const [password, setPassword] = useState('usuario123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/my-pets');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión. Comprueba tus datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      // In production, Google Identity Services client / Firebase is wired here:
      await googleLogin('usuario.google@gmail.com', 'Usuario Google Autenticado', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80');
      navigate('/my-pets');
    } catch (err: any) {
      setError('Error al autenticar con Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Box textAlign="center" mb={3}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '14px',
              backgroundColor: 'primary.main',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              mb: 1.5,
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
            }}
          >
            <PetIcon fontSize="large" />
          </Box>
          <Typography variant="h5" fontWeight="800">
            Ingresar a UbicaDog
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Accede para registrar mascotas o activar alertas de búsqueda
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Google Sign-In Button */}
        <Button
          fullWidth
          variant="outlined"
          size="large"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleAuth}
          disabled={loading}
          sx={{
            py: 1.2,
            borderColor: 'divider',
            color: 'text.primary',
            fontWeight: 700,
            mb: 2,
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'action.hover',
            },
          }}
        >
          Continuar con Google
        </Button>

        <Divider sx={{ my: 2 }}>
          <Typography variant="caption" color="text.secondary">
            O con tu correo electrónico
          </Typography>
        </Divider>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Correo Electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={{ mb: 2.5 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            disabled={loading}
            sx={{ py: 1.2, fontWeight: 700 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar Sesión'}
          </Button>
        </form>

        <Box textAlign="center" mt={3}>
          <Typography variant="body2" color="text.secondary">
            ¿No tienes cuenta?{' '}
            <Link
              component="button"
              variant="body2"
              fontWeight="700"
              onClick={() => navigate('/register')}
            >
              Regístrate gratis
            </Link>
          </Typography>
        </Box>

        <Divider sx={{ my: 2.5 }} />

        {/* Separate Employee Login Access */}
        <Box textAlign="center">
          <Button
            size="small"
            color="inherit"
            startIcon={<AdminIcon fontSize="small" />}
            onClick={() => navigate('/employee-login')}
            sx={{ fontSize: '0.8rem', opacity: 0.85 }}
          >
            Acceso Exclusivo Personal y Empleados
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};
