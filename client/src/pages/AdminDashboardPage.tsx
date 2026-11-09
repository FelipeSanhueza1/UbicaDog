import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  IconButton,
  TextField,
  Alert,
  CircularProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  People as UsersIcon,
  Pets as PetIcon,
  Warning as WarningIcon,
  CheckCircle as SafeIcon,
  Delete as DeleteIcon,
  Send as BroadcastIcon,
  Visibility as ViewIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Sighting, User } from '../types';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [tabIndex, setTabIndex] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastRadius, setBroadcastRadius] = useState(5000);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [statsRes, sightingsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/sightings'),
        api.get('/admin/users'),
      ]);
      setStats(statsRes.data.stats);
      setSightings(sightingsRes.data.sightings || []);
      setUsers(usersRes.data.users || []);
    } catch (err) {
      console.error('Error fetching admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteSighting = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este avistamiento?')) return;
    try {
      await api.delete(`/admin/sightings/${id}`);
      setActionMsg('Avistamiento eliminado con éxito.');
      fetchData();
    } catch (err) {
      setActionMsg('Error al eliminar avistamiento.');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'active' | 'resolved' | 'hidden') => {
    try {
      await api.patch(`/sightings/${id}/status`, { status: newStatus });
      setActionMsg(`Estado del avistamiento actualizado a: ${newStatus}`);
      fetchData();
    } catch (err) {
      setActionMsg('Error al actualizar estado.');
    }
  };

  const handleBroadcast = async () => {
    try {
      await api.post('/admin/broadcast', {
        title: broadcastTitle,
        message: broadcastMsg,
        latitude: -33.4489,
        longitude: -70.6693,
        radiusMeters: broadcastRadius,
      });
      setBroadcastOpen(false);
      setBroadcastTitle('');
      setBroadcastMsg('');
      setActionMsg('¡Transmisión oficial de emergencia emitida con éxito por toda la red de UbicaDog!');
    } catch (err) {
      setActionMsg('Error al emitir transmisión de emergencia.');
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'employee')) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error">
          Acceso no autorizado. Este panel es exclusivo para personal de la empresa.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Top Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <AdminIcon color="primary" fontSize="large" />
            <Typography variant="h4" fontWeight="900">
              Panel de Control Corporativo
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Gestión en tiempo real de reportes comunitarios, radares de búsqueda y cuentas de usuario.
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="error"
          startIcon={<BroadcastIcon />}
          onClick={() => setBroadcastOpen(true)}
          sx={{ fontWeight: 800 }}
        >
          Emitir Alerta Radial de Emergencia
        </Button>
      </Box>

      {actionMsg && (
        <Alert severity="info" onClose={() => setActionMsg(null)} sx={{ mb: 3 }}>
          {actionMsg}
        </Alert>
      )}

      {/* KPI Cards */}
      {stats && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, borderLeft: '5px solid #2563EB' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary" fontWeight="700">
                  USUARIOS REGISTRADOS
                </Typography>
                <Typography variant="h4" fontWeight="800">
                  {stats.totalUsers}
                </Typography>
                <Typography variant="caption" color="success.main" fontWeight="600">
                  ● Base de datos activa
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, borderLeft: '5px solid #EF4444' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary" fontWeight="700">
                  MASCOTAS EXTRAVIADAS (RADAR)
                </Typography>
                <Typography variant="h4" fontWeight="800" color="error.main">
                  {stats.activeLostPets}
                </Typography>
                <Typography variant="caption" color="error.main" fontWeight="600">
                  🚨 Ondas activas en mapa
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, borderLeft: '5px solid #F97316' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary" fontWeight="700">
                  AVISTAMIENTOS EN CALLE
                </Typography>
                <Typography variant="h4" fontWeight="800" color="secondary.main">
                  {stats.totalSightings}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stats.activeSightings} pendientes de rescate
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, borderLeft: '5px solid #10B981' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary" fontWeight="700">
                  REUNIONES Y RESCATES
                </Typography>
                <Typography variant="h4" fontWeight="800" color="success.main">
                  {stats.reunitedPets}
                </Typography>
                <Typography variant="caption" color="success.main" fontWeight="600">
                  💚 Mascotas seguras
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Management Tabs */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs
          value={tabIndex}
          onChange={(_, val) => setTabIndex(val)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label={`Moderación de Avistamientos (${sightings.length})`} sx={{ fontWeight: 700 }} />
          <Tab label={`Usuarios y Permisos (${users.length})`} sx={{ fontWeight: 700 }} />
        </Tabs>

        {/* Tab 0: Sightings Moderation */}
        {tabIndex === 0 && (
          <Box p={2}>
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Foto</TableCell>
                    <TableCell>Especie / Raza</TableCell>
                    <TableCell>Collar</TableCell>
                    <TableCell>Ubicación</TableCell>
                    <TableCell>Fecha / Hora</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Acciones de Moderación</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sightings.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell>
                        <Box
                          component="img"
                          src={s.photoUrl}
                          alt="Pet"
                          sx={{ width: 44, height: 44, borderRadius: 1.5, objectFit: 'cover' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="700">
                          {s.breed}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {s.species.toUpperCase()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            s.collarStatus === 'with_collar'
                              ? 'Con Collar'
                              : s.collarStatus === 'no_collar'
                              ? 'Sin Collar'
                              : 'Dudoso'
                          }
                          size="small"
                          color={s.collarStatus === 'with_collar' ? 'error' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{s.address}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(s.seenAt).toLocaleDateString()} {new Date(s.seenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={s.status.toUpperCase()}
                          size="small"
                          color={s.status === 'active' ? 'primary' : s.status === 'resolved' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          {s.status === 'active' ? (
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              onClick={() => handleUpdateStatus(s.id, 'resolved')}
                            >
                              Resolver
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleUpdateStatus(s.id, 'active')}
                            >
                              Reactivar
                            </Button>
                          )}
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteSighting(s.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        )}

        {/* Tab 1: Users */}
        {tabIndex === 1 && (
          <Box p={2}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Correo</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Rol / Nivel</TableCell>
                  <TableCell>Registro</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="700">
                        {u.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.phone || 'No registrado'}</TableCell>
                    <TableCell>
                      <Chip
                        label={u.role.toUpperCase()}
                        size="small"
                        color={u.role === 'admin' ? 'error' : u.role === 'employee' ? 'primary' : 'default'}
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">Usuario activo</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      {/* Emergency Broadcast Dialog */}
      <Dialog open={broadcastOpen} onClose={() => setBroadcastOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          🚨 Emitir Comunicado Radial de Emergencia
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" paragraph>
            Esta alerta enviará una onda de sonido y vibración por WebSocket a todas las instancias activas de la app en un radio determinado.
          </Typography>
          <TextField
            fullWidth
            label="Título de la Alerta"
            value={broadcastTitle}
            onChange={(e) => setBroadcastTitle(e.target.value)}
            placeholder="Ej. Operativo de Rescate Masivo en Parque O'Higgins"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Mensaje para los Vecinos"
            value={broadcastMsg}
            onChange={(e) => setBroadcastMsg(e.target.value)}
            placeholder="Ej. Se busca perrita herida con collar rojo en el sector norte. Por favor avisar si la ven."
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="number"
            label="Radio de Alerta (metros)"
            value={broadcastRadius}
            onChange={(e) => setBroadcastRadius(Number(e.target.value))}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setBroadcastOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<BroadcastIcon />}
            onClick={handleBroadcast}
            disabled={!broadcastTitle || !broadcastMsg}
            sx={{ fontWeight: 800 }}
          >
            Emitir a Toda la Comunidad
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
