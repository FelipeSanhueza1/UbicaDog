import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Stack,
  Button,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import {
  AddLocationAlt as ReportIcon,
  Warning as WarningIcon,
  LocalHospital as VetIcon,
  Store as StoreIcon,
} from '@mui/icons-material';
import { UbicaMap } from '../components/Map/UbicaMap';
import { api } from '../services/api';
import { Sighting, LostRadarPet, Veterinary, PetStore } from '../types';

interface MapPageProps {
  onOpenQuickReport: () => void;
}

export const MapPage: React.FC<MapPageProps> = ({ onOpenQuickReport }) => {
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [lostPets, setLostPets] = useState<LostRadarPet[]>([]);
  const [veterinaries, setVeterinaries] = useState<Veterinary[]>([]);
  const [stores, setStores] = useState<PetStore[]>([]);

  const [showVets, setShowVets] = useState(true);
  const [showStores, setShowStores] = useState(true);
  const [showOnlyEmergency, setShowOnlyEmergency] = useState(false);

  const [speciesFilter, setSpeciesFilter] = useState<'all' | 'dog' | 'cat' | 'other'>('all');
  const [collarFilter, setCollarFilter] = useState<'all' | 'with_collar' | 'no_collar'>('all');

  const fetchData = async () => {
    try {
      const [sightingsRes, radarRes, vetsRes, storesRes] = await Promise.all([
        api.get('/sightings'),
        api.get('/pets/radar-active'),
        api.get('/veterinaries', { params: { sortBy: 'rating' } }),
        api.get('/stores'),
      ]);
      setSightings(sightingsRes.data.sightings || []);
      setLostPets(radarRes.data.radarPets || []);
      setVeterinaries(vetsRes.data.veterinaries || []);
      setStores(storesRes.data.stores || []);
    } catch (err) {
      console.error('Error fetching map data', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredSightings = sightings.filter((s) => {
    if (speciesFilter !== 'all' && s.species !== speciesFilter) return false;
    if (collarFilter !== 'all' && s.collarStatus !== collarFilter) return false;
    return true;
  });

  const filteredLostPets = lostPets.filter((p) => {
    if (speciesFilter !== 'all' && p.species !== speciesFilter) return false;
    return true;
  });

  const filteredVets = showVets
    ? showOnlyEmergency
      ? veterinaries.filter((v) => v.isEmergency24h)
      : veterinaries
    : [];

  const filteredStores = showStores ? stores : [];

  return (
    <Box sx={{ position: 'relative', width: '100%', height: 'calc(100vh - 65px)', overflow: 'hidden' }}>
      <UbicaMap
        sightings={filteredSightings}
        lostPets={filteredLostPets}
        veterinaries={filteredVets}
        stores={filteredStores}
      />

      {/* Floating Control Overlay */}
      <Paper
        elevation={4}
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 1000,
          p: 2,
          borderRadius: 3,
          backdropFilter: 'blur(10px)',
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.94)' : 'rgba(255, 255, 255, 0.94)',
          maxWidth: 390,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon color="error" fontSize="small" />
            <Typography variant="subtitle2" fontWeight="800">
              Radar UbicaDog en Vivo
            </Typography>
          </Box>
          <Chip
            label={`${lostPets.length} Perdidos • ${sightings.length} Vistos`}
            size="small"
            color="error"
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        </Stack>

        {/* Species Filters */}
        <Stack direction="row" spacing={0.8} mb={1}>
          <Chip
            label="Todos"
            size="small"
            color={speciesFilter === 'all' ? 'primary' : 'default'}
            onClick={() => setSpeciesFilter('all')}
            clickable
          />
          <Chip
            label="🐶 Perros"
            size="small"
            color={speciesFilter === 'dog' ? 'primary' : 'default'}
            onClick={() => setSpeciesFilter('dog')}
            clickable
          />
          <Chip
            label="🐱 Gatos"
            size="small"
            color={speciesFilter === 'cat' ? 'primary' : 'default'}
            onClick={() => setSpeciesFilter('cat')}
            clickable
          />
        </Stack>

        <Divider sx={{ my: 1 }} />

        {/* Directory Toggles: Vets & Stores */}
        <Typography variant="caption" fontWeight="800" color="text.secondary" display="block" mb={0.5}>
          SERVICIOS EN EL MAPA:
        </Typography>

        <Stack direction="row" spacing={1} mb={1}>
          <Chip
            icon={<VetIcon />}
            label="Veterinarias"
            color={showVets ? 'success' : 'default'}
            variant={showVets ? 'filled' : 'outlined'}
            onClick={() => setShowVets(!showVets)}
            clickable
            size="small"
            sx={{ fontWeight: 700 }}
          />
          <Chip
            icon={<StoreIcon />}
            label="Tiendas"
            color={showStores ? 'primary' : 'default'}
            variant={showStores ? 'filled' : 'outlined'}
            onClick={() => setShowStores(!showStores)}
            clickable
            size="small"
            sx={{ fontWeight: 700 }}
          />
        </Stack>

        {showVets && (
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showOnlyEmergency}
                onChange={(e) => setShowOnlyEmergency(e.target.checked)}
                color="error"
              />
            }
            label={
              <Typography variant="caption" fontWeight="700" color="error.main">
                Solo Urgencias 24 Horas
              </Typography>
            }
          />
        )}
      </Paper>

      {/* Floating Bottom Action for Street Sighting */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
        }}
      >
        <Button
          variant="contained"
          color="secondary"
          size="large"
          startIcon={<ReportIcon />}
          onClick={onOpenQuickReport}
          sx={{
            px: 3,
            py: 1.4,
            fontWeight: 800,
            fontSize: '1rem',
            borderRadius: 50,
            boxShadow: '0 8px 24px rgba(249, 115, 22, 0.45)',
          }}
        >
          ¿Viste una Mascota en la Calle? Publicar Aquí
        </Button>
      </Box>
    </Box>
  );
};
