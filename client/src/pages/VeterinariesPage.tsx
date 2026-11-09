import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
  Button,
  Stack,
  Rating,
  FormControlLabel,
  Switch,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Paper,
  Slider,
  Alert,
} from '@mui/material';
import {
  LocalHospital as VetIcon,
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon,
  MyLocation as GpsIcon,
  Star as StarIcon,
  AccessTime as TimeIcon,
  NearMe as DistIcon,
} from '@mui/icons-material';
import { api } from '../services/api';
import { Veterinary } from '../types';

export const VeterinariesPage: React.FC = () => {
  const [veterinaries, setVeterinaries] = useState<Veterinary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'distance'>('rating');
  const [only24h, setOnly24h] = useState(false);
  const [radiusKm, setRadiusKm] = useState(15);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: -33.4489,
    lng: -70.6693,
  });
  const [gpsActive, setGpsActive] = useState(false);

  const fetchVets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/veterinaries', {
        params: {
          lat: userCoords.lat,
          lng: userCoords.lng,
          sortBy,
          onlyEmergency24h: only24h,
          radiusMeters: radiusKm * 1000,
        },
      });
      setVeterinaries(res.data.veterinaries || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error de conexión al cargar clínicas veterinarias.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsActive(true);
        },
        (err) => {
          console.warn('GPS error, using default coordinates', err);
        }
      );
    }
  };

  useEffect(() => {
    handleRequestGPS();
  }, []);

  useEffect(() => {
    fetchVets();
  }, [userCoords, sortBy, only24h, radiusKm]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <VetIcon sx={{ color: '#10B981', fontSize: 36 }} />
            <Typography variant="h4" fontWeight="800">
              Directorio de Clínicas Veterinarias
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Encuentra las clínicas más cercanas ordenadas según su reputación y valoración de usuarios reales.
          </Typography>
        </Box>

        <Button
          variant={gpsActive ? 'contained' : 'outlined'}
          color="primary"
          startIcon={<GpsIcon />}
          onClick={handleRequestGPS}
          sx={{ fontWeight: 700 }}
        >
          {gpsActive ? 'Ubicación GPS Actualizada' : 'Obtener mi Ubicación GPS'}
        </Button>
      </Box>

      {/* Filter and Sorting Controls */}
      <Paper sx={{ p: 2.5, mb: 4, borderRadius: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={5}>
            <Typography variant="subtitle2" fontWeight="700" gutterBottom>
              Criterio de Ordenamiento:
            </Typography>
            <ToggleButtonGroup
              value={sortBy}
              exclusive
              onChange={(_, val) => val && setSortBy(val)}
              fullWidth
              size="small"
            >
              <ToggleButton value="rating" sx={{ fontWeight: 700 }}>
                ⭐ Mejor Valoradas Primero
              </ToggleButton>
              <ToggleButton value="distance" sx={{ fontWeight: 700 }}>
                📍 Más Cercanas Primero
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>

          <Grid item xs={12} sm={6} md={3.5}>
            <FormControlLabel
              control={
                <Switch
                  checked={only24h}
                  onChange={(e) => setOnly24h(e.target.checked)}
                  color="error"
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2" fontWeight="800" color="error.main">
                    🚨 Solo Urgencias 24 Horas
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Hospitales con turno de noche
                  </Typography>
                </Box>
              }
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3.5}>
            <Typography variant="caption" fontWeight="700" color="text.secondary">
              Radio de búsqueda: <strong>{radiusKm} km a la redonda</strong>
            </Typography>
            <Slider
              value={radiusKm}
              min={2}
              max={30}
              step={1}
              onChange={(_, val) => setRadiusKm(val as number)}
              valueLabelDisplay="auto"
              color="primary"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Soft loading indicator for refetches */}
      {loading && veterinaries.length > 0 && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Actualizando resultados por proximidad...
          </Typography>
        </Box>
      )}

      {/* Error state with retry action */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchVets} sx={{ fontWeight: 800 }}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Results Count */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">
          Mostrando <strong>{veterinaries.length} veterinarias</strong> disponibles cerca de tu posición
        </Typography>
        <Chip
          label={sortBy === 'rating' ? 'Orden: De 5.0 ⭐ a 1.0 ⭐' : 'Orden: De más cerca a más lejos'}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 700 }}
        />
      </Box>

      {/* Grid of Clinics */}
      {loading && veterinaries.length === 0 ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : veterinaries.length === 0 && !error ? (
        <Typography variant="body1" color="text.secondary" textAlign="center" py={6}>
          No se encontraron veterinarias con los filtros seleccionados en este radio.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {veterinaries.map((v) => (
            <Grid item xs={12} sm={6} md={4} key={v.id}>
              <Card
                sx={{
                  borderRadius: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: v.isEmergency24h ? '2px solid #EF4444' : '1px solid',
                  borderColor: v.isEmergency24h ? '#EF4444' : 'divider',
                }}
              >
                <CardMedia
                  component="img"
                  height="160"
                  image={v.photoUrl}
                  alt={v.clinicName}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack direction="row" spacing={1} mb={1}>
                    {v.isEmergency24h ? (
                      <Chip label="🚨 Urgencia 24h" size="small" color="error" sx={{ fontWeight: 800 }} />
                    ) : (
                      <Chip label="🏥 Atención Diurna" size="small" color="success" sx={{ fontWeight: 600 }} />
                    )}
                    {v.formattedDistance && (
                      <Chip
                        icon={<DistIcon />}
                        label={`A ${v.formattedDistance}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 700 }}
                      />
                    )}
                  </Stack>

                  <Typography variant="h6" fontWeight="800" gutterBottom>
                    {v.clinicName}
                  </Typography>

                  {/* Rating Stars & Count */}
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Rating value={v.rating} precision={0.1} readOnly size="small" />
                    <Typography variant="body2" fontWeight="800" color="primary.main">
                      {v.rating}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({v.reviewCount} opiniones)
                    </Typography>
                  </Box>

                  <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5} mb={0.5}>
                    <TimeIcon fontSize="small" /> {v.openingHours}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.85rem' }}>
                    📍 {v.address}
                  </Typography>

                  {/* Services Tags */}
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                    {v.services.map((srv, idx) => (
                      <Chip key={idx} label={srv} size="small" sx={{ fontSize: '0.7rem' }} />
                    ))}
                  </Stack>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    color={v.isEmergency24h ? 'error' : 'success'}
                    startIcon={<PhoneIcon />}
                    href={`tel:${v.phone}`}
                    sx={{ fontWeight: 700, minHeight: 44 }}
                  >
                    Llamar Urgencia
                  </Button>
                  {v.whatsapp && (
                    <Button
                      variant="outlined"
                      color="primary"
                      href={`https://wa.me/${v.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      sx={{ minHeight: 44, minWidth: 44 }}
                    >
                      <WhatsAppIcon />
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};
