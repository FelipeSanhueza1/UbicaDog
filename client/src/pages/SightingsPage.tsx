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
  TextField,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  AddLocationAlt as ReportIcon,
  Phone as PhoneIcon,
  LocationOn as PinIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { api } from '../services/api';
import { Sighting, Species, CollarStatus } from '../types';

interface SightingsPageProps {
  onOpenQuickReport: () => void;
}

export const SightingsPage: React.FC<SightingsPageProps> = ({ onOpenQuickReport }) => {
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [species, setSpecies] = useState<string>('all');
  const [collarStatus, setCollarStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const fetchSightings = async () => {
    try {
      const res = await api.get('/sightings', {
        params: {
          species: species !== 'all' ? species : undefined,
          collarStatus: collarStatus !== 'all' ? collarStatus : undefined,
        },
      });
      setSightings(res.data.sightings || []);
    } catch (err) {
      console.error('Error fetching sightings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSightings();
  }, [species, collarStatus]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Title & Action */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="800">
            Avistamientos en la Calle
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Reportes en tiempo real de mascotas encontradas por vecinos de la comunidad.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<ReportIcon />}
          onClick={onOpenQuickReport}
          sx={{ fontWeight: 700 }}
        >
          Publicar Avistamiento Callejero
        </Button>
      </Box>

      {/* Filters */}
      <Box display="flex" gap={2} mb={4} flexWrap="wrap">
        <TextField
          select
          size="small"
          label="Filtrar por Especie"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="all">Todas las especies</MenuItem>
          <MenuItem value="dog">🐶 Solo Perros</MenuItem>
          <MenuItem value="cat">🐱 Solo Gatos</MenuItem>
          <MenuItem value="other">🐾 Otros</MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          label="Collar o Placa"
          value={collarStatus}
          onChange={(e) => setCollarStatus(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="all">Cualquier estado</MenuItem>
          <MenuItem value="with_collar">🔔 Con Collar</MenuItem>
          <MenuItem value="no_collar">🚫 Sin Collar</MenuItem>
        </TextField>
      </Box>

      {/* Grid */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : sightings.length === 0 ? (
        <Typography variant="body1" color="text.secondary" textAlign="center" py={6}>
          No se encontraron reportes con los filtros seleccionados.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {sightings.map((s) => (
            <Grid item xs={12} sm={6} md={4} key={s.id}>
              <Card sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={s.photoUrl}
                  alt={s.breed || 'Mascota'}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack direction="row" spacing={1} mb={1}>
                    <Chip
                      label={s.species === 'dog' ? '🐶 Perro' : s.species === 'cat' ? '🐱 Gato' : '🐾 Mascota'}
                      size="small"
                      color="primary"
                    />
                    <Chip
                      label={
                        s.collarStatus === 'with_collar'
                          ? '🔔 Con Collar'
                          : s.collarStatus === 'no_collar'
                          ? 'Sin Collar'
                          : 'Dudoso'
                      }
                      size="small"
                      color={s.collarStatus === 'with_collar' ? 'secondary' : 'default'}
                    />
                  </Stack>

                  <Typography variant="h6" fontWeight="700" gutterBottom>
                    {s.breed || 'Mascota avistada'}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={0.5} mb={0.5}>
                    <PinIcon fontSize="small" color="action" /> {s.address}
                  </Typography>

                  <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5} mb={1.5}>
                    <TimeIcon fontSize="small" color="action" /> Visto:{' '}
                    {new Date(s.seenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                    {new Date(s.seenAt).toLocaleDateString()}
                  </Typography>

                  {s.notes && (
                    <Typography variant="body2" sx={{ fontStyle: 'italic', bgcolor: 'action.hover', p: 1, borderRadius: 1.5 }}>
                      "{s.notes}"
                    </Typography>
                  )}
                </CardContent>

                {s.contactPhone && (
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<PhoneIcon />}
                      href={`tel:${s.contactPhone}`}
                    >
                      Llamar a Quien Vio la Mascota
                    </Button>
                  </CardActions>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};
