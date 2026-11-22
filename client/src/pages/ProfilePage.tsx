import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  MyLocation as GpsIcon,
  PhotoCamera as CameraIcon,
  Lock as LockIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as SuccessIcon,
  Save as SaveIcon,
  AdminPanelSettings as AdminIcon,
  Pets as PetsIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/imageCompressor';
import { getUserCoordinates, reverseGeocode } from '../services/geoService';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [homeAddress, setHomeAddress] = useState(user?.homeAddress || '');
  const [homeLatitude, setHomeLatitude] = useState<number | undefined>(user?.homeLatitude);
  const [homeLongitude, setHomeLongitude] = useState<number | undefined>(user?.homeLongitude);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [locatingGps, setLocatingGps] = useState(false);
  const [compressingPhoto, setCompressingPhoto] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatarUrl || '');
      setHomeAddress(user.homeAddress || '');
      setHomeLatitude(user.homeLatitude);
      setHomeLongitude(user.homeLongitude);
    }
  }, [user]);

  // Handle avatar photo selection
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressingPhoto(true);
    setErrorMessage(null);
    try {
      const compressedDataUrl = await compressImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.85,
      });
      setAvatarUrl(compressedDataUrl);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar la imagen de perfil.');
    } finally {
      setCompressingPhoto(false);
    }
  };

  // Handle GPS Home location detection
  const handleDetectGps = async () => {
    setLocatingGps(true);
    setErrorMessage(null);
    try {
      const coords = await getUserCoordinates();
      setHomeLatitude(coords.lat);
      setHomeLongitude(coords.lng);

      const resolvedAddress = await reverseGeocode(coords.lat, coords.lng);
      if (resolvedAddress) {
        setHomeAddress(resolvedAddress);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo obtener la ubicación GPS.');
    } finally {
      setLocatingGps(false);
    }
  };

  // Submit profile updates
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate passwords if changing
    if (newPassword || currentPassword) {
      if (!currentPassword) {
        setErrorMessage('Debes ingresar tu contraseña actual para establecer una nueva.');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMessage('La nueva contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('La nueva contraseña y su confirmación no coinciden.');
        return;
      }
    }

    setLoading(true);
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatarUrl,
        homeAddress: homeAddress.trim(),
        homeLatitude,
        homeLongitude,
        ...(newPassword ? { currentPassword, newPassword } : {}),
      });

      setSuccessMessage('¡Tu perfil ha sido actualizado exitosamente!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al guardar los cambios en tu perfil.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = user?.role === 'admin';

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      {/* Page Header */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight="800" color="text.primary">
            Mi Perfil
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administra tus datos personales, ubicación de tu hogar y credenciales de acceso
          </Typography>
        </Box>

        <Box display="flex" gap={1}>
          {isSuperAdmin && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AdminIcon />}
              onClick={() => navigate('/admin')}
              sx={{ fontWeight: 700 }}
            >
              Panel de Administración
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<PetsIcon />}
            onClick={() => navigate('/my-pets')}
            sx={{ fontWeight: 600 }}
          >
            Mis Mascotas
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {successMessage && (
        <Alert
          severity="success"
          icon={<SuccessIcon />}
          onClose={() => setSuccessMessage(null)}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="error" onClose={() => setErrorMessage(null)} sx={{ mb: 3, borderRadius: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Left Column: Avatar & Summary Card */}
          <Grid item xs={12} md={4}>
            <Card elevation={2} sx={{ borderRadius: 3, textAlign: 'center', p: 3 }}>
              <Box position="relative" display="inline-block" mb={2}>
                <Avatar
                  src={avatarUrl}
                  alt={name}
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    border: '4px solid',
                    borderColor: isSuperAdmin ? 'warning.main' : 'primary.main',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    fontSize: '2.5rem',
                  }}
                >
                  {name ? name.charAt(0).toUpperCase() : <PersonIcon fontSize="large" />}
                </Avatar>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  accept="image/*"
                  style={{ display: 'none' }}
                />

                {/* Camera Overlay Button */}
                <Tooltip title="Cambiar foto de perfil">
                  <IconButton
                    color="primary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={compressingPhoto}
                    aria-label="Subir foto de perfil"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: 'background.paper',
                      boxShadow: 3,
                      minWidth: 44,
                      minHeight: 44,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    {compressingPhoto ? <CircularProgress size={20} /> : <CameraIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Box>

              <Typography variant="h6" fontWeight="700" noWrap>
                {name || 'Usuario UbicaDog'}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap mb={1.5}>
                {email}
              </Typography>

              <Box display="flex" justifyContent="center" gap={1} flexWrap="wrap" mb={2}>
                <Chip
                  label={isSuperAdmin ? 'SUPER ADMINISTRADOR' : 'DUEÑO DE MASCOTA'}
                  color={isSuperAdmin ? 'warning' : 'primary'}
                  size="small"
                  sx={{ fontWeight: 800, fontSize: '0.68rem' }}
                />
                <Chip
                  icon={<StarIcon sx={{ fontSize: '14px !important' }} />}
                  label={`PLAN ${user?.subscriptionTier ? user.subscriptionTier.toUpperCase().replace('_', ' ') : 'GRATUITO'}`}
                  variant="outlined"
                  color="warning"
                  size="small"
                  onClick={() => navigate('/pricing')}
                  sx={{ fontWeight: 700, fontSize: '0.68rem', cursor: 'pointer' }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box textAlign="left">
                <Typography variant="caption" color="text.secondary" display="block">
                  <strong>ID de Cuenta:</strong> <code>{user?.id}</code>
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  <strong>Miembro desde:</strong>{' '}
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Reciente'}
                </Typography>
              </Box>
            </Card>
          </Grid>

          {/* Right Column: Profile Info Fields */}
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight="700" mb={2.5}>
                Información Personal
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nombre Completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ color: 'text.secondary', mr: 1 }} fontSize="small" />,
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Correo Electrónico"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: <EmailIcon sx={{ color: 'text.secondary', mr: 1 }} fontSize="small" />,
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Teléfono Móvil o WhatsApp de Contacto"
                    placeholder="+56 9 1234 5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    helperText="Visible cuando publiques alertas para que vecinos o rescatistas te contacten rápidamente."
                    InputProps={{
                      startAdornment: <PhoneIcon sx={{ color: 'text.secondary', mr: 1 }} fontSize="small" />,
                    }}
                  />
                </Grid>

                {/* Home Address Section */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="subtitle2" fontWeight="700" color="text.primary" mb={0.5}>
                    Ubicación de tu Hogar
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                    Sirve como centro de radar para avisarte de inmediato si se avista una mascota perdida cerca de tu casa.
                  </Typography>

                  <TextField
                    fullWidth
                    label="Dirección de Casa (Comuna, Calle, Número)"
                    placeholder="Ej. Av. Providencia 1240, Santiago"
                    value={homeAddress}
                    onChange={(e) => setHomeAddress(e.target.value)}
                    sx={{ mb: 1.5 }}
                    InputProps={{
                      startAdornment: <HomeIcon sx={{ color: 'text.secondary', mr: 1 }} fontSize="small" />,
                    }}
                  />

                  <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="small"
                      startIcon={locatingGps ? <CircularProgress size={16} /> : <GpsIcon />}
                      onClick={handleDetectGps}
                      disabled={locatingGps}
                      sx={{ minHeight: 44, fontWeight: 700 }}
                    >
                      {locatingGps ? 'Detectando GPS...' : 'Usar mi ubicación GPS actual'}
                    </Button>

                    {homeLatitude && homeLongitude && (
                      <Chip
                        label={`GPS Fijado: ${homeLatitude.toFixed(4)}, ${homeLongitude.toFixed(4)}`}
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ fontWeight: 700 }}
                      />
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Password Change Accordion */}
            <Paper elevation={2} sx={{ borderRadius: 3, mb: 3, overflow: 'hidden' }}>
              <Accordion disableGutters elevation={0}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <LockIcon color="action" />
                    <Box>
                      <Typography variant="subtitle1" fontWeight="700">
                        Cambiar Contraseña
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Opcional: actualiza tu contraseña de acceso si lo necesitas
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: { xs: 2, md: 3 }, pb: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="password"
                        label="Contraseña Actual"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Ingresa tu contraseña actual para confirmar cambios"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="password"
                        label="Nueva Contraseña"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="password"
                        label="Confirmar Nueva Contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite la nueva contraseña"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Paper>

            {/* Submit Action Button */}
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate('/')}
                disabled={loading}
                sx={{ minHeight: 44, px: 3, fontWeight: 600 }}
              >
                Volver
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                sx={{
                  minHeight: 44,
                  px: 4,
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                }}
              >
                {loading ? 'Guardando Cambios...' : 'Guardar Cambios'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
};
