import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Chip,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Shield as ShieldIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const EmployeeLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { employeeLogin } = useAuth();

  const [email, setEmail] = useState('empleado@ubicadog.com');
  const [password, setPassword] = useState('empleado123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await employeeLogin(email, password);
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Acceso denegado: Credenciales corporativas no válidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Paper
        elevation={6}
        sx={{
          p: 4,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'primary.dark',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: 'linear-gradient(90deg, #2563EB, #1D4ED8)',
          }}
        />

        <Box textAlign="center" mb={3}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '16px',
              backgroundColor: 'primary.dark',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              mb: 1.5,
              boxShadow: '0 6px 20px rgba(30, 64, 175, 0.4)',
            }}
          >
            <AdminIcon fontSize="large" />
          </Box>
          <Typography variant="h5" fontWeight="900" color="text.primary">
            Portal Corporativo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Acceso exclusivo para empleados y moderadores de UbicaDog
          </Typography>
          <Box mt={1}>
            <Chip
              label="Acceso Restringido • Rango Staff"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Correo Corporativo"
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
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ShieldIcon />}
            sx={{ py: 1.3, fontWeight: 800, bgcolor: 'primary.dark' }}
          >
            {loading ? 'Verificando Rango...' : 'Ingresar al Panel de Control'}
          </Button>
        </form>

        <Box mt={3} p={1.5} bgcolor="action.hover" borderRadius={2}>
          <Typography variant="caption" fontWeight="700" display="block" color="text.secondary">
            Credenciales de prueba para revisión:
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            • Empleado: <code>empleado@ubicadog.com</code> / <code>empleado123</code>
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            • Admin: <code>admin@ubicadog.com</code> / <code>admin123</code>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};
