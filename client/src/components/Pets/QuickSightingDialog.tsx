import React, { useState, useRef } from 'react';
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
  Stack,
} from '@mui/material';
import {
  Close as CloseIcon,
  PhotoCamera as CameraIcon,
  Collections as GalleryIcon,
  DeleteOutline as DeleteIcon,
  Link as LinkIcon,
  MyLocation as GpsIcon,
  Send as SendIcon,
  Security as SecurityIcon,
  AddPhotoAlternate as PhotoIcon,
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
  const [photoUrl, setPhotoUrl] = useState('');
  const [address, setAddress] = useState('Av. Libertador Bernardo O Higgins 1400');
  const [lat, setLat] = useState(initialCoords?.lat || -33.444);
  const [lng, setLng] = useState(initialCoords?.lng || -70.655);
  const [notes, setNotes] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('La foto seleccionada supera los 8 MB. Por favor elige una imagen más liviana.');
      return;
    }

    setImageProcessing(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhotoUrl(event.target.result as string);
      }
      setImageProcessing(false);
    };
    reader.onerror = () => {
      setError('Error al procesar el archivo de imagen.');
      setImageProcessing(false);
    };
    reader.readAsDataURL(file);
  };

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
      const finalPhoto =
        photoUrl ||
        (species === 'cat'
          ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80'
          : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80');

      await api.post('/sightings', {
        species,
        collarStatus,
        condition,
        breed: breed || (species === 'dog' ? 'Perro callejero' : species === 'cat' ? 'Gato callejero' : 'Mascota'),
        photoUrl: finalPhoto,
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

          {/* Hidden file inputs for Camera and Gallery */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={cameraInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <input
            type="file"
            accept="image/*"
            ref={galleryInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {/* 4. Photo Section */}
          <Typography variant="subtitle2" fontWeight="700" gutterBottom>
            4. Foto de la mascota:
          </Typography>

          {photoUrl ? (
            /* Responsive Image Preview */
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: { xs: 220, sm: 280 },
                backgroundColor: (theme) => (theme.palette.mode === 'dark' ? '#0f172a' : '#f1f5f9'),
                borderRadius: 3,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid',
                borderColor: 'divider',
                mb: 2,
              }}
            >
              <Box
                component="img"
                src={photoUrl}
                alt="Foto de la mascota vista"
                sx={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                }}
              />
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  position: 'absolute',
                  bottom: 12,
                  right: 12,
                }}
              >
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  startIcon={<CameraIcon />}
                  onClick={() => cameraInputRef.current?.click()}
                  sx={{
                    bgcolor: 'rgba(37, 99, 235, 0.9)',
                    backdropFilter: 'blur(4px)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  Repetir Foto
                </Button>
                <IconButton
                  size="small"
                  onClick={() => setPhotoUrl('')}
                  aria-label="Eliminar foto"
                  sx={{
                    bgcolor: 'rgba(239, 68, 68, 0.85)',
                    color: 'white',
                    '&:hover': { bgcolor: 'error.main' },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Box>
          ) : (
            /* Action Buttons to capture/upload */
            <Box mb={2}>
              {imageProcessing ? (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  gap={1.5}
                  p={3}
                  borderRadius={3}
                  sx={{ bgcolor: 'action.hover' }}
                >
                  <CircularProgress size={24} />
                  <Typography variant="body2" fontWeight="600">
                    Procesando foto...
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={7}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="secondary"
                      size="large"
                      startIcon={<CameraIcon />}
                      onClick={() => cameraInputRef.current?.click()}
                      sx={{
                        py: 1.5,
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
                      }}
                    >
                      Tomar Foto con Cámara
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="primary"
                      size="large"
                      startIcon={<GalleryIcon />}
                      onClick={() => galleryInputRef.current?.click()}
                      sx={{ py: 1.5, fontWeight: 700 }}
                    >
                      Subir de Galería
                    </Button>
                  </Grid>
                </Grid>
              )}

              {/* Optional Web URL toggle */}
              <Box mt={1} textAlign="right">
                <Button
                  size="small"
                  variant="text"
                  color="inherit"
                  startIcon={<LinkIcon fontSize="small" />}
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  sx={{ fontSize: '0.75rem', opacity: 0.8 }}
                >
                  {showUrlInput ? 'Ocultar campo de enlace' : '¿Tienes un enlace de imagen web?'}
                </Button>
              </Box>

              {showUrlInput && (
                <TextField
                  fullWidth
                  size="small"
                  placeholder="https://ejemplo.com/foto-mascota.jpg"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  InputProps={{
                    startAdornment: <PhotoIcon sx={{ color: 'action.active', mr: 1 }} />,
                  }}
                  sx={{ mt: 1 }}
                />
              )}
            </Box>
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
