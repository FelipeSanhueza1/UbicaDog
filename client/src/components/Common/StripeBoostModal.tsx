import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon, CreditCard as CardIcon, Bolt as BoltIcon } from '@mui/icons-material';
import { api } from '../../services/api';
import { Pet } from '../../types';

interface StripeBoostModalProps {
  open: boolean;
  onClose: () => void;
  pet: Pet | null;
}

export const StripeBoostModal: React.FC<StripeBoostModalProps> = ({ open, onClose, pet }) => {
  const [tier, setTier] = useState('3000');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await api.post('/stripe/create-checkout-session', {
        amount: Number(tier),
        petId: pet?.id,
        description: `Impulso Geofence Prioritario para ${pet?.name || 'Mascota'}`,
        type: 'boost',
      });

      if (res.data.simulated) {
        setStatusMsg('¡Pago Stripe verificado en modo demo! El radio de difusión ha sido ampliado y destacado.');
        setTimeout(() => {
          onClose();
        }, 2200);
      } else if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      setStatusMsg('Error al conectar con la pasarela de pagos Stripe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <BoltIcon color="warning" />
          <Typography variant="h6" fontWeight="800">
            Impulsar Búsqueda en Radar
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" paragraph>
          Aumenta el radio de notificación push y destaca a <strong>{pet?.name}</strong> en el mapa con un halo de alta visibilidad para todos los usuarios.
        </Typography>

        {statusMsg && (
          <Alert severity={statusMsg.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
            {statusMsg}
          </Alert>
        )}

        <RadioGroup value={tier} onChange={(e) => setTier(e.target.value)}>
          <Box p={1.5} mb={1} borderRadius={2} border="1px solid" borderColor="divider">
            <FormControlLabel
              value="3000"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="subtitle2" fontWeight="700">
                    Radio +2 km Extra — $3.000 CLP
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Notificación a todos los teléfonos en 2 km adicionales a la redonda.
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Box p={1.5} mb={1} borderRadius={2} border="2px solid #F97316" bgcolor="warning.50">
            <FormControlLabel
              value="7000"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="subtitle2" fontWeight="800" color="warning.dark">
                    ⭐ Radar Metropolitano +5 km — $7.000 CLP (Recomendado)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Alerta masiva con prioridad alta en feeds y mapa por 72 horas.
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Box p={1.5} borderRadius={2} border="1px solid" borderColor="divider">
            <FormControlLabel
              value="15000"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="subtitle2" fontWeight="700">
                    Búsqueda Premium Toda la Ciudad — $15.000 CLP
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Fondo de recompensa protegido y difusión en toda la comuna.
                  </Typography>
                </Box>
              }
            />
          </Box>
        </RadioGroup>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="warning"
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CardIcon />}
          onClick={handleCheckout}
          disabled={loading}
          sx={{ fontWeight: 800 }}
        >
          {loading ? 'Procesando Stripe...' : 'Pagar con Stripe'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
