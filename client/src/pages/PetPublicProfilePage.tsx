import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  MyLocation as GpsIcon,
  Warning as WarningIcon,
  CheckCircle as SafeIcon,
  Pets as PetIcon,
  MedicalServices as MedIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { api } from '../services/api';

export const PetPublicProfilePage: React.FC = () => {
  const { petId } = useParams<{ petId: string }>();
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gpsSent, setGpsSent] = useState(false);
  const [gpsSending, setGpsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPet = async () => {
      try {
        const res = await api.get(`/pets/public/${petId}`);
        setPet(res.data.pet);
      } catch (err: any) {
        setError('No se pudo encontrar la ficha de la mascota. Verifica el código escaneado.');
      } finally {
        setLoading(false);
      }
    };
    fetchPet();
  }, [petId]);

  const handleSendGPSLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }

    setGpsSending(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          // Post automatic street sighting connected to this pet
          await api.post('/sightings', {
            species: pet.species,
            collarStatus: 'with_collar',
            condition: 'wandering',
            breed: pet.breed,
            photoUrl: pet.photoUrl,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            address: `Escaneo de Placa QR (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`,
            seenAt: new Date().toISOString(),
            notes: `¡El transeúnte escaneó la placa QR en la calle y envió su ubicación en vivo!`,
            contactPhone: pet.ownerPhone,
          });
          setGpsSent(true);
        } catch (e) {
          console.error(e);
        } finally {
          setGpsSending(false);
        }
      },
      () => {
        alert('Por favor autoriza el permiso de GPS para compartir la ubicación exacta al dueño.');
        setGpsSending(false);
      }
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !pet) {
    return (
      <Container maxWidth="xs" sx={{ py: 6 }}>
        <Alert severity="error">{error || 'Mascota no encontrada.'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs" sx={{ py: 3, px: 2 }}>
      <Paper
        elevation={4}
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          border: pet.isLost ? '3px solid #EF4444' : '1px solid',
          borderColor: pet.isLost ? 'error.main' : 'divider',
        }}
      >
        {/* Top Emergency Status Banner */}
        <Box
          p={2}
          bgcolor={pet.isLost ? 'error.main' : 'success.main'}
          color="white"
          textAlign="center"
        >
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} mb={0.5}>
            {pet.isLost ? <WarningIcon /> : <SafeIcon />}
            <Typography variant="h6" fontWeight="900">
              {pet.isLost ? '¡ESTA MASCOTA ESTÁ PERDIDA!' : 'Mascota Protegida con UbicaDog'}
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            {pet.isLost
              ? 'Por favor contacta a su familia inmediatamente.'
              : 'Placa oficial inteligente vinculada al Registro Nacional.'}
          </Typography>
        </Box>

        {/* Pet Photo */}
        <Box
          component="img"
          src={pet.photoUrl}
          alt={pet.name}
          sx={{ width: '100%', height: 260, objectFit: 'cover' }}
        />

        <Box p={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h4" fontWeight="900">
              {pet.name}
            </Typography>
            <Chip
              label={pet.species === 'dog' ? '🐶 Perro' : '🐱 Gato'}
              color="primary"
              sx={{ fontWeight: 700 }}
            />
          </Box>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            {pet.breed} • {pet.color}
          </Typography>

          {pet.rewardAmount && (
            <Box my={1.5} p={1.5} bgcolor="warning.50" borderRadius={2} border="1px solid #F59E0B">
              <Typography variant="caption" fontWeight="800" color="warning.dark" display="block">
                💰 RECOMPENSA OFRECIDA POR SU FAMILIA:
              </Typography>
              <Typography variant="h5" fontWeight="900" color="warning.main">
                ${pet.rewardAmount.toLocaleString()} CLP
              </Typography>
            </Box>
          )}

          {/* CRITICAL ACTIONS: Call Owner & Send GPS */}
          <Stack spacing={1.5} my={2.5}>
            <Button
              fullWidth
              size="large"
              variant="contained"
              color={pet.isLost ? 'error' : 'primary'}
              startIcon={<PhoneIcon />}
              href={`tel:${pet.ownerPhone}`}
              sx={{ py: 1.5, fontWeight: 900, fontSize: '1.05rem', borderRadius: 2 }}
            >
              Llamar a {pet.ownerName} ({pet.ownerPhone})
            </Button>

            <Button
              fullWidth
              size="large"
              variant="outlined"
              color="secondary"
              startIcon={gpsSending ? <CircularProgress size={20} /> : <GpsIcon />}
              onClick={handleSendGPSLocation}
              disabled={gpsSent || gpsSending}
              sx={{ py: 1.3, fontWeight: 800, borderRadius: 2 }}
            >
              {gpsSent ? '✅ ¡Ubicación enviada al dueño!' : '📍 Enviar mi Ubicación GPS al Dueño'}
            </Button>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Medical Records & Care Info */}
          <Typography variant="subtitle2" fontWeight="800" color="text.secondary" gutterBottom>
            Ficha de Salud y Cuidados:
          </Typography>

          {pet.medicalRecord && (
            <Box>
              {pet.medicalRecord.allergies && (
                <Typography variant="caption" color="error.main" display="block" mb={0.5}>
                  ⚠️ <strong>Alergia:</strong> {pet.medicalRecord.allergies}
                </Typography>
              )}
              {pet.medicalRecord.vaccines && (
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                  💉 <strong>Vacunas:</strong> {pet.medicalRecord.vaccines.join(', ')}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" display="block">
                🩺 <strong>Esterilizado/a:</strong> {pet.medicalRecord.sterilized ? 'Sí' : 'No'}
              </Typography>
            </Box>
          )}

          {pet.collarDetails && (
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              🏷️ <strong>Collar:</strong> {pet.collarDetails}
            </Typography>
          )}
        </Box>
      </Paper>
    </Container>
  );
};
