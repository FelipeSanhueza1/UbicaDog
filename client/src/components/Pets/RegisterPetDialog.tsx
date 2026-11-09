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
  Grid,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Pets as PetIcon,
  Home as HomeIcon,
  MyLocation as GpsIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Species, PetSize } from '../../types';

interface RegisterPetDialogProps {
  open: boolean;
  onClose: () => void;
  onPetRegistered: () => void;
}

export const RegisterPetDialog: React.FC<RegisterPetDialogProps> = ({
  open,
  onClose,
  onPetRegistered,
}) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('dog');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [size, setSize] = useState<PetSize>('medium');
  const [color, setColor] = useState('');
  const [microchipNumber, setMicrochipNumber] = useState('');
  const [collarDetails, setCollarDetails] = useState('');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80');
  const [homeAddress, setHomeAddress] = useState('Av. Providencia 1240, Santiago');
  const [homeLatitude, setHomeLatitude] = useState(-33.4372);
  const [homeLongitude, setHomeLongitude] = useState(-70.627);
  const [description, setDescription] = useState('');
  const [rewardAmount, setRewardAmount] = useState<number | ''>('');
  const [vaccines, setVaccines] = useState('Antirrábica al día, Óctuple al día');
  const [allergies, setAllergies] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  const handleUseGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setHomeLatitude(pos.coords.latitude);
        setHomeLongitude(pos.coords.longitude);
        setHomeAddress(`GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !species) {
      setError('El nombre y especie de la mascota son obligatorios.');
      return;
    }

    setLoading(true);
    setError(null);
    setUpgradeRequired(false);

    try {
      await api.post('/pets/register', {
        name,
        species,
        breed,
        age: age === '' ? undefined : Number(age),
        size,
        color,
        microchipNumber,
        collarDetails,
        photoUrl,
        homeLatitude,
        homeLongitude,
        homeAddress,
        description,
        rewardAmount: rewardAmount === '' ? undefined : Number(rewardAmount),
        vaccines: vaccines ? vaccines.split(',').map((v) => v.trim()) : [],
        allergies,
      });

      onPetRegistered();
      onClose();
    } catch (err: any) {
      if (err.response?.data?.code === 'SUBSCRIPTION_LIMIT_REACHED') {
        setUpgradeRequired(true);
        setError(err.response.data.error);
      } else {
        setError(err.response?.data?.error || 'Error al registrar la mascota.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <PetIcon color="primary" />
          <Typography variant="h6" fontWeight="800">
            Registrar Mascota en el Hogar
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && (
            <Alert
              severity={upgradeRequired ? 'warning' : 'error'}
              sx={{ mb: 2 }}
              action={
                upgradeRequired && (
                  <Button
                    color="inherit"
                    size="small"
                    startIcon={<StarIcon />}
                    onClick={() => {
                      onClose();
                      navigate('/pricing');
                    }}
                    sx={{ fontWeight: 800 }}
                  >
                    Ver Planes
                  </Button>
                )
              }
            >
              {error}
            </Alert>
          )}

          <Typography variant="subtitle2" color="primary" fontWeight="700" gutterBottom>
            Información de la Mascota
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre de la mascota *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Rocky"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Especie *"
                value={species}
                onChange={(e) => setSpecies(e.target.value as Species)}
              >
                <MenuItem value="dog">🐶 Perro</MenuItem>
                <MenuItem value="cat">🐱 Gato</MenuItem>
                <MenuItem value="other">🐾 Otro (Conejo, Hurón)</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Raza"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="Ej. Golden Retriever"
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Edad (años)"
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField
                select
                fullWidth
                label="Tamaño"
                value={size}
                onChange={(e) => setSize(e.target.value as PetSize)}
              >
                <MenuItem value="small">Pequeño (&lt; 10 kg)</MenuItem>
                <MenuItem value="medium">Mediano (10 - 25 kg)</MenuItem>
                <MenuItem value="large">Grande (&gt; 25 kg)</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Typography variant="subtitle2" color="primary" fontWeight="700" gutterBottom>
            Ubicación del Hogar (Punto de anclaje para el radar)
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Dirección del hogar *"
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                InputProps={{
                  startAdornment: <HomeIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button fullWidth variant="outlined" startIcon={<GpsIcon />} onClick={handleUseGPS} sx={{ height: 54 }}>
                Fijar Casa con GPS
              </Button>
            </Grid>
          </Grid>

          <Typography variant="subtitle2" color="primary" fontWeight="700" gutterBottom>
            Salud, Vacunas y Cuidados
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vacunas al día (separadas por coma)"
                value={vaccines}
                onChange={(e) => setVaccines(e.target.value)}
                placeholder="Ej. Antirrábica, Óctuple, KC"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Alergias o tratamientos médicos"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="Ej. Alergia alimentaria, cardiopatía..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="URL de Foto de la mascota"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : <PetIcon />}
            sx={{ fontWeight: 700 }}
          >
            {loading ? 'Guardando...' : 'Guardar Mascota'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
