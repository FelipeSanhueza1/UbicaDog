import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Paper,
  Stack,
} from '@mui/material';
import { Add as AddIcon, Pets as PetIcon, InfoOutlined as InfoIcon, CloudOff as OfflineIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Pet } from '../types';
import { LostPetRadiusCard } from '../components/Pets/LostPetRadiusCard';
import { RegisterPetDialog } from '../components/Pets/RegisterPetDialog';
import { StripeBoostModal } from '../components/Common/StripeBoostModal';
import { saveOfflinePets, getOfflinePets } from '../services/offlineStorageService';

export const MyPetsPage: React.FC = () => {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [boostPet, setBoostPet] = useState<Pet | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  const fetchPets = async () => {
    try {
      const res = await api.get('/pets/my-pets');
      const fetchedPets = res.data.pets || [];
      setPets(fetchedPets);
      saveOfflinePets(fetchedPets);
      setIsOffline(false);
    } catch (err) {
      console.warn('Network error fetching pets, loading from offline cache', err);
      const cached = getOfflinePets();
      if (cached.length > 0) {
        setPets(cached);
        setIsOffline(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPets();
    }

    const handleOnline = () => {
      setIsOffline(false);
      fetchPets();
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="800">
            Mis Mascotas Registradas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Registra tu hogar para activar la onda de búsqueda y el cálculo de distancia estimada en segundos.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setRegisterOpen(true)}
          sx={{ fontWeight: 700 }}
        >
          Registrar Nueva Mascota
        </Button>
      </Box>

      {/* Offline Alert if working disconnected */}
      {isOffline && (
        <Alert
          severity="warning"
          icon={<OfflineIcon />}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          <strong>Modo Sin Conexión Activado:</strong> Estás consultando la copia local de tus mascotas y fichas médicas sincronizada en tu dispositivo. Puedes ver vacunas y números de microchip sin problemas en la clínica.
        </Alert>
      )}

      {/* Info notice about dynamic wander radius */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 4,
          borderRadius: 3,
          backgroundColor: 'primary.50',
          border: '1px solid',
          borderColor: 'primary.200',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <InfoIcon color="primary" sx={{ mt: 0.2 }} />
          <Box>
            <Typography variant="subtitle2" fontWeight="700" color="primary.dark">
              ¿Cómo funciona el Radar de Pérdida en UbicaDog?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Al presionar el botón <strong>"ACTIVAR: MI MASCOTA ESTÁ PERDIDA"</strong>, el sistema ancla el origen en tu hogar o última coordenada vista, proyecta una onda expansiva en tiempo real y calcula un radio que <strong>aumenta diariamente</strong> según la especie y tamaño, notificando automáticamente a los vecinos en ese perímetro.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Pet Cards List */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : pets.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <PetIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" fontWeight="700" gutterBottom>
            Aún no has registrado ninguna mascota
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: 'auto', mb: 3 }}>
            Registra a tus perros o gatos con su dirección de hogar y fotos para tenerlos protegidos ante cualquier eventualidad.
          </Typography>
          <Button variant="contained" color="primary" onClick={() => setRegisterOpen(true)}>
            Registrar mi primera mascota
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {pets.map((pet) => (
            <Grid item xs={12} sm={6} md={4} key={pet.id}>
              <LostPetRadiusCard
                pet={pet}
                onStatusToggled={fetchPets}
                onBoostClick={(p) => setBoostPet(p)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Register Pet Modal */}
      <RegisterPetDialog
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onPetRegistered={fetchPets}
      />

      {/* Stripe Geofence Boost Modal */}
      <StripeBoostModal
        open={Boolean(boostPet)}
        onClose={() => setBoostPet(null)}
        pet={boostPet}
      />
    </Container>
  );
};
