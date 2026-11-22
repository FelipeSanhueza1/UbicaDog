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
  IconButton,
  Collapse,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import {
  AddLocationAlt as ReportIcon,
  Warning as WarningIcon,
  LocalHospital as VetIcon,
  Store as StoreIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  Close as ClearIcon,
} from '@mui/icons-material';
import { UbicaMap } from '../components/Map/UbicaMap';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { searchPlaces, GeocodedPlace, calculateDistanceKm } from '../services/geoService';
import { useAuth } from '../context/AuthContext';
import { Sighting, LostRadarPet, Veterinary, PetStore } from '../types';

interface MapPageProps {
  onOpenQuickReport: () => void;
  lastReportedSighting?: Sighting | null;
}

export const MapPage: React.FC<MapPageProps> = ({ onOpenQuickReport, lastReportedSighting }) => {
  const { user } = useAuth();
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [lostPets, setLostPets] = useState<LostRadarPet[]>([]);
  const [veterinaries, setVeterinaries] = useState<Veterinary[]>([]);
  const [stores, setStores] = useState<PetStore[]>([]);

  const [showVets, setShowVets] = useState(true);
  const [showStores, setShowStores] = useState(true);
  const [showOnlyEmergency, setShowOnlyEmergency] = useState(false);

  const [speciesFilter, setSpeciesFilter] = useState<'all' | 'dog' | 'cat' | 'other'>('all');
  const [collarFilter, setCollarFilter] = useState<'all' | 'with_collar' | 'no_collar'>('all');
  const [radarRadiusKm, setRadarRadiusKm] = useState<number | null>(null);
  const [currentUserCoords, setCurrentUserCoords] = useState<{ lat: number; lng: number } | null>(
    user?.homeLatitude && user?.homeLongitude ? { lat: user.homeLatitude, lng: user.homeLongitude } : null
  );
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  // Address and Commune Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodedPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [flyToCoords, setFlyToCoords] = useState<{ lat: number; lng: number } | null>(null);

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

  // Real-time socket updates for immediate sightings and radar waves
  useEffect(() => {
    socket.on('sighting:new', (newSighting: Sighting) => {
      setSightings((prev) => [newSighting, ...prev.filter((s) => s.id !== newSighting.id)]);
    });

    socket.on('radar:wave', (payload: any) => {
      if (payload.type === 'sighting' && payload.data) {
        setSightings((prev) => [payload.data, ...prev.filter((s) => s.id !== payload.data.id)]);
      } else if (payload.type === 'lost_pet' && payload.data) {
        setLostPets((prev) => [payload.data, ...prev.filter((p) => p.petId !== payload.data.petId)]);
      }
    });

    return () => {
      socket.off('sighting:new');
      socket.off('radar:wave');
    };
  }, []);

  // If a sighting was just submitted by the user in this session, inject immediately and fly to it
  useEffect(() => {
    if (lastReportedSighting) {
      setSightings((prev) => [lastReportedSighting, ...prev.filter((s) => s.id !== lastReportedSighting.id)]);
      setFlyToCoords({ lat: lastReportedSighting.latitude, lng: lastReportedSighting.longitude });
    }
  }, [lastReportedSighting]);

  // Debounced search for streets and communes
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const places = await searchPlaces(searchQuery);
      setSearchResults(places);
      setIsSearching(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectPlace = (place: GeocodedPlace) => {
    setFlyToCoords({ lat: place.lat, lng: place.lng });
    setSearchQuery(place.displayName.split(',')[0]);
    setSearchResults([]);
  };

  const filteredSightings = sightings.filter((s) => {
    if (speciesFilter !== 'all' && s.species !== speciesFilter) return false;
    if (collarFilter !== 'all' && s.collarStatus !== collarFilter) return false;
    if (radarRadiusKm && currentUserCoords) {
      const dist = calculateDistanceKm(currentUserCoords.lat, currentUserCoords.lng, s.latitude, s.longitude);
      if (dist > radarRadiusKm) return false;
    }
    return true;
  });

  const filteredLostPets = lostPets.filter((p) => {
    if (speciesFilter !== 'all' && p.species !== speciesFilter) return false;
    if (radarRadiusKm && currentUserCoords) {
      const dist = calculateDistanceKm(currentUserCoords.lat, currentUserCoords.lng, p.centerLatitude, p.centerLongitude);
      if (dist > radarRadiusKm) return false;
    }
    return true;
  });

  const filteredVets = showVets
    ? veterinaries.filter((v) => {
        if (showOnlyEmergency && !v.isEmergency24h) return false;
        if (radarRadiusKm && currentUserCoords) {
          const dist = calculateDistanceKm(currentUserCoords.lat, currentUserCoords.lng, v.latitude, v.longitude);
          if (dist > radarRadiusKm) return false;
        }
        return true;
      })
    : [];

  const filteredStores = showStores
    ? stores.filter((st) => {
        if (radarRadiusKm && currentUserCoords) {
          const dist = calculateDistanceKm(currentUserCoords.lat, currentUserCoords.lng, st.latitude, st.longitude);
          if (dist > radarRadiusKm) return false;
        }
        return true;
      })
    : [];

  return (
    <Box sx={{ position: 'relative', width: '100%', height: 'calc(100vh - 65px)', overflow: 'hidden' }}>
      <UbicaMap
        sightings={filteredSightings}
        lostPets={filteredLostPets}
        veterinaries={filteredVets}
        stores={filteredStores}
        flyToCoords={flyToCoords}
        onUserLocationFound={(lat, lng) => setCurrentUserCoords({ lat, lng })}
      />

      {/* Search Bar for Streets and Communes (Next to Leaflet zoom controls) */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 12, sm: 16 },
          left: { xs: 58, sm: 66 },
          zIndex: 1000,
          width: { xs: 'calc(100vw - 230px)', sm: 280, md: 340 },
          maxWidth: 360,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: '2px 8px',
            borderRadius: 3,
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.94)' : 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar calle o comuna..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'primary.main', mr: 0.5 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {isSearching ? (
                    <CircularProgress size={16} />
                  ) : searchQuery ? (
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  ) : null}
                </InputAdornment>
              ),
              sx: { fontSize: '0.85rem' },
            }}
          />
        </Paper>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <Paper
            elevation={4}
            sx={{
              mt: 0.5,
              maxHeight: 220,
              overflowY: 'auto',
              borderRadius: 2,
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            }}
          >
            <List dense disablePadding>
              {searchResults.map((place, idx) => (
                <ListItem key={idx} disablePadding>
                  <ListItemButton onClick={() => handleSelectPlace(place)}>
                    <ListItemText
                      primary={place.displayName.split(',')[0]}
                      secondary={place.displayName.split(',').slice(1, 3).join(',')}
                      primaryTypographyProps={{ fontWeight: 700, fontSize: '0.85rem' }}
                      secondaryTypographyProps={{ fontSize: '0.72rem' }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Box>

      {/* Floating Control Overlay - Positioned on Top Right to avoid blocking Leaflet zoom controls */}
      <Paper
        elevation={4}
        sx={{
          position: 'absolute',
          top: { xs: 12, sm: 16 },
          right: { xs: 12, sm: 16 },
          left: 'auto',
          zIndex: 1000,
          p: { xs: 1.5, sm: 2 },
          borderRadius: 3,
          backdropFilter: 'blur(10px)',
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.94)' : 'rgba(255, 255, 255, 0.94)',
          maxWidth: { xs: 'calc(100vw - 24px)', sm: 360 },
          width: { xs: 'calc(100vw - 24px)', sm: 360 },
          transition: 'all 0.2s ease',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={panelCollapsed ? 0 : 1}>
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon color="error" fontSize="small" />
            <Typography variant="subtitle2" fontWeight="800">
              Radar en Vivo
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Chip
              label={`${lostPets.length} Perdidos • ${sightings.length} Vistos`}
              size="small"
              color="error"
              variant="outlined"
              sx={{ fontWeight: 700, fontSize: '0.75rem' }}
            />
            <IconButton
              size="small"
              onClick={() => setPanelCollapsed(!panelCollapsed)}
              aria-label={panelCollapsed ? 'Expandir panel de filtros' : 'Minimizar panel de filtros'}
              sx={{ p: 0.5 }}
            >
              {panelCollapsed ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
            </IconButton>
          </Box>
        </Stack>

        <Collapse in={!panelCollapsed}>
          <Box pt={0.5}>
            {/* Species Filters */}
            <Typography variant="caption" fontWeight="800" color="text.secondary" display="block" mb={0.5}>
              ESPECIES:
            </Typography>
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

            {/* Radar Radius Filter */}
            <Typography variant="caption" fontWeight="800" color="text.secondary" display="block" mb={0.5}>
              RADIO DE BÚSQUEDA:
            </Typography>
            <Stack direction="row" spacing={0.6} mb={1} flexWrap="wrap" gap={0.5}>
              {[
                { label: 'Todos', value: null },
                { label: '1 km', value: 1 },
                { label: '3 km', value: 3 },
                { label: '5 km', value: 5 },
                { label: '10 km', value: 10 },
              ].map((r) => (
                <Chip
                  key={r.label}
                  label={r.label}
                  size="small"
                  color={radarRadiusKm === r.value ? 'error' : 'default'}
                  variant={radarRadiusKm === r.value ? 'filled' : 'outlined'}
                  onClick={() => setRadarRadiusKm(r.value)}
                  clickable
                  sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                />
              ))}
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
          </Box>
        </Collapse>
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
