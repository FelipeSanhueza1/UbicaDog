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
  Alert,
  Tooltip,
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
  Share as ShareIcon,
  Lock as LockIcon,
  LocalHospital as VetIcon,
  Star as StarIcon,
  ContentCopy as CopyIcon,
  ShoppingCart as BuyIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Pet } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

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
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [medicalOpen, setMedicalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isProOrAdmin = (user?.subscriptionTier && user.subscriptionTier !== 'free') || user?.role === 'admin';
  const [platePurchased, setPlatePurchased] = useState(Boolean(pet.hasPurchasedPlate));
  const isUnlocked = isProOrAdmin || platePurchased;
  const [buyingPlate, setBuyingPlate] = useState(false);
  const [purchaseSuccessMsg, setPurchaseSuccessMsg] = useState<string | null>(null);

  const handlePurchasePlate = async () => {
    setBuyingPlate(true);
    try {
      await api.post(`/pets/${pet.id}/purchase-plate`);
      setPlatePurchased(true);
      pet.hasPurchasedPlate = true;
      setPurchaseSuccessMsg(`¡Placa QR Oficial activada con éxito para ${pet.name}!`);
      onStatusToggled?.();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'No se pudo procesar la compra de la placa.');
    } finally {
      setBuyingPlate(false);
    }
  };

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

  // Viral Sharing for Lost or Registered Pets
  const handleShare = async () => {
    const publicUrl = `${window.location.origin}/p/${pet.id}`;
    const shareText = pet.isLost
      ? `🚨 ¡URGENTE! Mi mascota ${pet.name} (${pet.breed}) se extravió cerca de ${pet.homeAddress || 'nuestro hogar'}. Por favor avísame si la ves o revisa su ficha aquí:`
      : `🐾 Ficha oficial de ${pet.name} en UbicaDog:`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `UbicaDog: ${pet.name}`,
          text: shareText,
          url: publicUrl,
        });
        return;
      } catch (err) {
        // User dismissed share dialog
      }
    }

    // Fallback: Open WhatsApp with prefilled message
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${publicUrl}`)}`;
    window.open(waUrl, '_blank');

    // Also copy to clipboard for convenience
    try {
      await navigator.clipboard.writeText(`${shareText} ${publicUrl}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      // Clipboard denied
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

          {/* Medical Record Short Preview */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mt={1}
            p={1}
            bgcolor="action.hover"
            borderRadius={1.5}
          >
            <Box overflow="hidden">
              <Typography variant="caption" fontWeight="700" display="block" color="text.secondary" noWrap>
                🩺 Microchip: {pet.microchipNumber || 'Sin chip'}
              </Typography>
            </Box>
            <Button
              size="small"
              variant="text"
              startIcon={<VetIcon fontSize="small" />}
              onClick={() => setMedicalOpen(true)}
              sx={{ fontSize: '0.72rem', py: 0.2 }}
            >
              Ver Ficha
            </Button>
          </Box>
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

            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              startIcon={<ShareIcon />}
              onClick={handleShare}
              sx={{ fontWeight: 700 }}
            >
              {copiedLink ? '¡Copiado!' : 'Compartir'}
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

      {/* Smart QR Collar Dialog (Physical Security - Monetized) */}
      <Dialog
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <QrIcon color="primary" />
            <Typography variant="h6" fontWeight="800">
              Placa Inteligente QR
            </Typography>
          </Stack>
          <IconButton onClick={() => setQrOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ textAlign: 'center', py: 2.5 }}>
          {purchaseSuccessMsg && (
            <Alert severity="success" sx={{ mb: 2, textAlign: 'left', borderRadius: 2 }}>
              {purchaseSuccessMsg}
            </Alert>
          )}

          {isUnlocked ? (
            /* Paid Subscription or Plate Purchased: Full High-Res Printable Pass */
            <Box>
              <Chip
                icon={platePurchased && !isProOrAdmin ? <SecurityIcon sx={{ fontSize: '15px !important' }} /> : <StarIcon sx={{ fontSize: '15px !important' }} />}
                label={platePurchased && !isProOrAdmin ? "PLACA OFICIAL ACTIVA • PERÍMETRO PROTEGIDO" : "PLAN PRO • DESCARGA Y GRABADO HABILITADO"}
                color={platePurchased && !isProOrAdmin ? "success" : "warning"}
                size="small"
                sx={{ fontWeight: 800, mb: 2 }}
              />

              <Typography variant="body2" color="text.secondary" paragraph>
                Hoja oficial de grabado en metal e impresión plastificada para el collar de <strong>{pet.name}</strong>.
              </Typography>

              {/* Printable Collar Badge Template */}
              <Box
                sx={{
                  border: '2px dashed #2563EB',
                  borderRadius: 3,
                  p: 2,
                  bgcolor: 'white',
                  color: '#1e293b',
                  mb: 2,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                }}
              >
                <Typography variant="caption" fontWeight="800" color="primary.main" display="block">
                  🐾 UBICADOG • PLACA DE RESCATE
                </Typography>

                {pet.qrCodeUrl && (
                  <Box
                    component="img"
                    src={pet.qrCodeUrl}
                    alt="QR Code"
                    sx={{
                      width: 160,
                      height: 160,
                      my: 1,
                      p: 1,
                      border: '1px solid #cbd5e1',
                      borderRadius: 2,
                    }}
                  />
                )}

                <Typography variant="subtitle2" fontWeight="900" color="black">
                  {pet.name.toUpperCase()}
                </Typography>
                <Typography variant="caption" display="block" color="#64748b">
                  Microchip: <strong>{pet.microchipNumber || 'Registrado'}</strong>
                </Typography>
                <Typography variant="caption" display="block" color="#2563EB" fontWeight="700">
                  ESCANÉAME CON LA CÁMARA
                </Typography>
              </Box>

              <Typography variant="caption" color="text.secondary" display="block">
                Enlace público de rescate: <code>ubicadog.com/p/{pet.id}</code>
              </Typography>
            </Box>
          ) : (
            /* Free Tier: Choose between $4.500 CLP Single Plate or $2.990 CLP/mo Pro Plan */
            <Box py={1}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  bgcolor: 'primary.light',
                  color: 'primary.dark',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1.5,
                }}
              >
                <SecurityIcon fontSize="medium" />
              </Box>

              <Typography variant="h6" fontWeight="800" gutterBottom>
                Seguridad y Placa para Collar
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Protege a <strong>{pet.name}</strong> con su placa identificadora inteligente y activa el <strong>Perímetro Seguro de Hogar (150m)</strong> en el mapa.
              </Typography>

              <Stack spacing={2} sx={{ textAlign: 'left', mt: 1 }}>
                {/* Option 1: Buy Plate $4.500 CLP */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    border: '2px solid',
                    borderColor: 'primary.main',
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.08)' : 'rgba(37, 99, 235, 0.04)',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="subtitle2" fontWeight="800" color="primary.main">
                      Opción 1: Placa Oficial Grabada
                    </Typography>
                    <Chip label="$4.500 CLP" size="small" color="primary" sx={{ fontWeight: 800 }} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                    Pago único para {pet.name}. Incluye grabado metálico oficial, código QR permanente y perímetro seguro de 150m en el radar.
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    startIcon={buyingPlate ? <CircularProgress size={16} color="inherit" /> : <BuyIcon />}
                    onClick={handlePurchasePlate}
                    disabled={buyingPlate}
                    sx={{ fontWeight: 800, minHeight: 40 }}
                  >
                    {buyingPlate ? 'Procesando...' : 'Comprar Placa ($4.500 CLP)'}
                  </Button>
                </Box>

                {/* Option 2: Pro Subscription $2.990 CLP */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'warning.main',
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.04)',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="subtitle2" fontWeight="800" color="warning.main">
                      Opción 2: Suscripción UbicaDog Pro
                    </Typography>
                    <Chip label="$2.990 CLP/mes" size="small" color="warning" sx={{ fontWeight: 800 }} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                    Mascotas ilimitadas, kits de placa para todas tus mascotas, radio de búsqueda ampliado al doble (x2) y alertas prioritarias comunitarias.
                  </Typography>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="warning"
                    startIcon={<StarIcon />}
                    onClick={() => {
                      setQrOpen(false);
                      navigate('/pricing');
                    }}
                    sx={{ fontWeight: 800, minHeight: 40 }}
                  >
                    Ver Plan Pro ($2.990 CLP)
                  </Button>
                </Box>
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          {isUnlocked ? (
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
              sx={{ fontWeight: 800, minHeight: 44 }}
            >
              Imprimir Kit de Placa y Credencial
            </Button>
          ) : (
            <Button
              fullWidth
              variant="text"
              color="inherit"
              onClick={() => setQrOpen(false)}
              sx={{ minHeight: 44 }}
            >
              Cerrar
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Medical Record Dialog (Offline Resilience) */}
      <Dialog
        open={medicalOpen}
        onClose={() => setMedicalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <VetIcon color="primary" />
            <Typography variant="h6" fontWeight="800">
              Ficha Médica: {pet.name}
            </Typography>
          </Stack>
          <IconButton onClick={() => setMedicalOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box mb={2}>
            <Typography variant="subtitle2" fontWeight="700" color="text.secondary">
              Número de Microchip Nacional
            </Typography>
            <Typography variant="body1" fontWeight="800">
              {pet.microchipNumber || 'No registrado aún'}
            </Typography>
          </Box>

          <Box mb={2}>
            <Typography variant="subtitle2" fontWeight="700" color="text.secondary">
              Estado de Esterilización
            </Typography>
            <Typography variant="body1" fontWeight="600">
              {pet.medicalRecord?.sterilized ? '✅ Esterilizado / Castrado' : '❌ No esterilizado'}
            </Typography>
          </Box>

          <Box mb={2}>
            <Typography variant="subtitle2" fontWeight="700" color="text.secondary">
              Vacunas Registradas
            </Typography>
            {pet.medicalRecord?.vaccines && pet.medicalRecord.vaccines.length > 0 ? (
              <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} mt={0.5}>
                {pet.medicalRecord.vaccines.map((vac, i) => (
                  <Chip key={i} label={vac} size="small" color="primary" variant="outlined" />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Sin vacunas cargadas
              </Typography>
            )}
          </Box>

          <Box mb={2}>
            <Typography variant="subtitle2" fontWeight="700" color="text.secondary">
              Alergias o Cuidados Crónicos
            </Typography>
            <Typography variant="body2">
              {pet.medicalRecord?.allergies || 'Ninguna alergia declarada.'}
            </Typography>
          </Box>

          {pet.medicalRecord?.notes && (
            <Box mb={1}>
              <Typography variant="subtitle2" fontWeight="700" color="text.secondary">
                Notas Médicas Veterinarias
              </Typography>
              <Typography variant="body2">
                {pet.medicalRecord.notes}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 1.5 }} />

          <Typography variant="caption" color="text.secondary" display="block">
            ⚡ Esta ficha se sincroniza y almacena de forma segura en tu dispositivo para estar disponible incluso sin señal de Internet en la clínica veterinaria.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button fullWidth variant="outlined" onClick={() => setMedicalOpen(false)}>
            Cerrar Ficha
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
