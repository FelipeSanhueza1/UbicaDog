import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  AddPhotoAlternate as PhotoIcon,
  MyLocation as GpsIcon,
  Send as SendIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { api } from '../../services/api';
import { Species, CollarStatus, AnimalCondition } from '../../types';

interface QuickSightingDialogProps {
  open: boolean;
  onClose: () => void;
  onSightingCreated: () => void;
  initialCoords?: { lat: number; lng: number };
}

export const QuickSightingDialog: React.FC<QuickSightingDialogProps> = ({
  open,
  onClose,
  onSightingCreated,
  initialCoords,
}) => {
  const [species, setSpecies] = useState<Species>('dog');
  const [collarStatus, setCollarStatus] = useState<CollarStatus>('unknown');
  const [condition, setCondition] = useState<AnimalCondition>('wandering');
  const [breed, setBreed] = useState('');
  const [photoUrl, setPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80'
  );
  const [address, setAddress] = useState('Av. Libertador Bernardo O Higgins 1400');
  const [lat, setLat] = useState(initialCoords?.lat || -33.444);
  const [lng, setLng] = useState(initialCoords?.lng || -70.655);
  const [notes, setNotes] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          setAddress(`Ubicación GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        },
        () => {
          setError('No se pudo acceder a la geolocalización del dispositivo.');
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/sightings', {
        species,
        collarStatus,
        condition,
        breed: breed || (species === 'dog' ? 'Perro callejero' : species === 'cat' ? 'Gato callejero' : 'Mascota'),
        photoUrl,
        latitude: lat,
        longitude: lng,
        address,
        seenAt: new Date().toISOString(),
        notes,
        contactPhone,
      });

      onSightingCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al publicar avistamiento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight="800">
            🚨 Publicar Mascota en la Calle
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Rápido y sencillo: difunde al instante en el mapa y alerta a la comunidad vecina.
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* 1. Species Quick Select */}
          <Typography variant="subtitle2" fontWeight="700" gutterBottom>
            1. ¿Qué animal viste?
          </Typography>
          <ToggleButtonGroup
            value={species}
            exclusive
            onChange={(_, val) => val && setSpecies(val)}
            fullWidth
            sx={{ mb: 2.5 }}
          >
            <ToggleButton value="dog" sx={{ py: 1.2, minHeight: 44, fontWeight: 700 }}>
              🐶 Perro
            </ToggleButton>
            <ToggleButton value="cat" sx={{ py: 1.2, minHeight: 44, fontWeight: 700 }}>
              🐱 Gato
            </ToggleButton>
            <ToggleButton value="other" sx={{ py: 1.2, minHeight: 44, fontWeight: 700 }}>
              🐾 Otro
            </ToggleButton>
          </ToggleButtonGroup>

          {/* 2. Collar Status Quick Select */}
          <Typography variant="subtitle2" fontWeight="700" gutterBottom>
            2. ¿Tiene collar o placa visible? (A criterio de quien lo vio)
          </Typography>
          <ToggleButtonGroup
            value={collarStatus}
            exclusive
            onChange={(_, val) => val && setCollarStatus(val)}
            fullWidth
            sx={{ mb: 2.5 }}
          >
            <ToggleButton value="with_collar" color="error" sx={{ minHeight: 44, fontWeight: 600 }}>
              🔔 Con Collar
            </ToggleButton>
            <ToggleButton value="no_collar" color="primary" sx={{ minHeight: 44, fontWeight: 600 }}>
              🚫 Sin Collar
            </ToggleButton>
            <ToggleButton value="unknown" color="standard" sx={{ minHeight: 44, fontWeight: 600 }}>
              ❓ Dudoso / De lejos
            </ToggleButton>
          </ToggleButtonGroup>

          {/* 3. Animal Condition */}
          <Typography variant="subtitle2" fontWeight="700" gutterBottom>
            3. Condición o comportamiento observado (Recomendado):
          </Typography>
          <ToggleButtonGroup
            value={condition}
            exclusive
            onChange={(_, val) => val && setCondition(val)}
            fullWidth
            sx={{ mb: 2.5 }}
          >
            <ToggleButton value="wandering" sx={{ minHeight: 44, fontSize: '0.8rem', fontWeight: 600 }}>
              🚶 Vagando
            </ToggleButton>
            <ToggleButton value="scared" sx={{ minHeight: 44, fontSize: '0.8rem', fontWeight: 600 }}>
              😨 Asustado
            </ToggleButton>
            <ToggleButton value="healthy" sx={{ minHeight: 44, fontSize: '0.8rem', fontWeight: 600 }}>
              🟢 Sano
            </ToggleButton>
            <ToggleButton value="injured" sx={{ minHeight: 44, fontSize: '0.8rem', fontWeight: 600 }}>
              🩹 Herido
            </ToggleButton>
          </ToggleButtonGroup>

          {/* 4. Photo URL & Preview */}
          <Typography variant="subtitle2" fontWeight="700" gutterBottom>
            4. Foto de la mascota:
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="URL de la imagen o captura"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            InputProps={{
              startAdornment: <PhotoIcon sx={{ color: 'action.active', mr: 1 }} />,
            }}
            sx={{ mb: 1.5 }}
          />

          {photoUrl && (
            <Box
              component="img"
              src={photoUrl}
              alt="Preview"
              sx={{
                width: '100%',
                height: 140,
                objectFit: 'cover',
                borderRadius: 2,
                mb: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            />
          )}

          {/* 5. Location and Address */}
          <Typography variant="subtitle2" fontWeight="700" gutterBottom>
            5. Lugar donde se vio:
          </Typography>
          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid item xs={9}>
              <TextField
                fullWidth
                size="small"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle, esquina, parque o punto de referencia"
              />
            </Grid>
            <Grid item xs={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GpsIcon />}
                onClick={handleUseCurrentLocation}
                sx={{ height: 40 }}
              >
                GPS
              </Button>
            </Grid>
          </Grid>

          {/* 6. Optional Notes & Phone */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Raza aproximada o color"
                placeholder="Ej. Quiltro negro con patas blancas"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Tu teléfono (opcional)"
                placeholder="+56 9 1234 5678"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                label="Detalles o señas particulares"
                placeholder="Ej. Cojea de una pata, se resguardó en la botillería de la esquina..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Grid>
          </Grid>

          {/* reCAPTCHA Protected Badge */}
          <Box display="flex" alignItems="center" gap={1} mt={2}>
            <SecurityIcon fontSize="small" color="primary" />
            <Typography variant="caption" color="text.secondary">
              Protegido contra spam con Google reCAPTCHA. Difusión inmediata por Socket.io.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="secondary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : <SendIcon />}
            sx={{ fontWeight: 700 }}
          >
            {loading ? 'Publicando...' : 'Emitir Alerta en el Mapa'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
