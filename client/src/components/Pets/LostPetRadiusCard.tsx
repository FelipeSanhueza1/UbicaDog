import React, { useState } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  Stack,
  Divider,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as SafeIcon,
  Radar as RadarIcon,
  Bolt as BoostIcon,
  Home as HomeIcon,
  QrCode2 as QrIcon,
  Close as CloseIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { Pet } from '../../types';
import { api } from '../../services/api';

interface LostPetRadiusCardProps {
  pet: Pet;
  onStatusToggled: () => void;
  onBoostClick: (pet: Pet) => void;
}

export const LostPetRadiusCard: React.FC<LostPetRadiusCardProps> = ({
  pet,
  onStatusToggled,
  onBoostClick,
}) => {
  const [loading, setLoading] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      await api.patch(`/pets/${pet.id}/toggle-lost`);
      onStatusToggled();
    } catch (err) {
      console.error('Error toggling lost state', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: pet.isLost ? '2px solid #EF4444' : '1px solid',
          borderColor: pet.isLost ? '#EF4444' : 'divider',
          boxShadow: pet.isLost ? '0 8px 24px rgba(239, 68, 68, 0.2)' : '0 2px 10px rgba(0,0,0,0.05)',
          position: 'relative',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Top Banner Status */}
        <Box
          sx={{
            py: 0.8,
            px: 2,
            backgroundColor: pet.isLost ? 'error.main' : 'success.main',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            {pet.isLost ? <WarningIcon fontSize="small" /> : <SafeIcon fontSize="small" />}
            <Typography variant="subtitle2" fontWeight="800">
              {pet.isLost ? '🚨 ALERTA ACTIVA: MASCOTA EXTRAVIADA' : '🟢 ESTADO: SEGURO EN HOGAR'}
            </Typography>
          </Stack>
          {pet.isLost && pet.radar && (
            <Chip
              label={`${pet.radar.daysLost === 0 ? 'Extraviado Hoy' : `${pet.radar.daysLost} días fuera`}`}
              size="small"
              sx={{ backgroundColor: 'white', color: 'error.main', fontWeight: 800 }}
            />
          )}
        </Box>

        {/* Pet Photo */}
        <CardMedia component="img" height="200" image={pet.photoUrl} alt={pet.name} sx={{ objectFit: 'cover' }} />

        <CardContent sx={{ pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Box>
              <Typography variant="h5" fontWeight="800">
                {pet.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {pet.species === 'dog' ? '🐶 Perro' : pet.species === 'cat' ? '🐱 Gato' : '🐾 Mascota'} • {pet.breed}
              </Typography>
            </Box>
            {pet.rewardAmount && (
              <Chip
                label={`$${pet.rewardAmount.toLocaleString()}`}
                color="warning"
                variant="filled"
                sx={{ fontWeight: 700 }}
              />
            )}
          </Stack>

          <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5} mb={1.5}>
            <HomeIcon fontSize="inherit" /> Casa: {pet.homeAddress}
          </Typography>

          {/* DYNAMIC ESTIMATED WANDER RADIUS SECTION */}
          {pet.isLost && pet.radar && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2'),
                border: '1px solid',
                borderColor: 'error.light',
                my: 1.5,
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Stack direction="row" spacing={0.8} alignItems="center">
                  <RadarIcon color="error" />
                  <Typography variant="subtitle2" fontWeight="800" color="error.dark">
                    Radio de Dispersión Estimado:
                  </Typography>
                </Stack>
                <Typography variant="h6" fontWeight="900" color="error.main">
                  {pet.radar.formattedRadius}
                </Typography>
              </Box>

              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                Distancia estimada: <strong>{pet.radar.radiusMeters} metros</strong> desde el hogar.
              </Typography>

              <LinearProgress
                variant="determinate"
                value={Math.min(100, (pet.radar.radiusMeters / 15000) * 100)}
                color="error"
                sx={{ height: 8, borderRadius: 4, mb: 1 }}
              />
            </Box>
          )}

          {/* Medical Record Preview */}
          {pet.medicalRecord && (
            <Box mt={1} p={1} bgcolor="action.hover" borderRadius={1.5}>
              <Typography variant="caption" fontWeight="700" display="block" color="text.secondary">
                🩺 Vacunas: {pet.medicalRecord.vaccines.join(', ') || 'Al día'}
              </Typography>
            </Box>
          )}
        </CardContent>

        <Divider />

        <CardActions sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            fullWidth
            size="large"
            variant="contained"
            color={pet.isLost ? 'success' : 'error'}
            onClick={handleToggle}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : pet.isLost ? <SafeIcon /> : <WarningIcon />}
            sx={{ py: 1.2, fontWeight: 800 }}
          >
            {pet.isLost ? '¡Mascota Recuperada! Desactivar Alerta' : '🚨 ACTIVAR: MI MASCOTA ESTÁ PERDIDA'}
          </Button>

          <Stack direction="row" spacing={1} width="100%">
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              startIcon={<QrIcon />}
              onClick={() => setQrOpen(true)}
              sx={{ fontWeight: 700 }}
            >
              Placa QR
            </Button>

            {pet.isLost && (
              <Button
                fullWidth
                variant="outlined"
                color="warning"
                startIcon={<BoostIcon />}
                onClick={() => onBoostClick(pet)}
                sx={{ fontWeight: 700 }}
              >
                Impulsar
              </Button>
            )}
          </Stack>
        </CardActions>
      </Card>

      {/* Smart QR Collar Dialog */}
      <Dialog open={qrOpen} onClose={() => setQrOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="800">
            Placa Inteligente QR para Collar
          </Typography>
          <IconButton onClick={() => setQrOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            Imprime o graba este código en la placa del collar de <strong>{pet.name}</strong>. Si alguien lo encuentra en la calle y lo escanea con la cámara de su celular, accederá a tu contacto directo y podrá enviarte su ubicación GPS con un toque.
          </Typography>

          {pet.qrCodeUrl && (
            <Box
              component="img"
              src={pet.qrCodeUrl}
              alt="QR Code"
              sx={{
                width: 200,
                height: 200,
                borderRadius: 2,
                p: 1.5,
                bgcolor: 'white',
                border: '2px solid #2563EB',
                boxShadow: '0 4px 16px rgba(37,99,235,0.2)',
                mb: 2,
              }}
            />
          )}

          <Typography variant="caption" color="text.secondary" display="block">
            Enlace público directo: <code>ubicadog.com/p/{pet.id}</code>
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button fullWidth variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>
            Imprimir Placa para Collar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
