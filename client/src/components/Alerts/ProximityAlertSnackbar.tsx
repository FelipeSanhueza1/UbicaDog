import React, { useEffect, useState } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Button,
  Box,
  Typography,
  Slide,
  SlideProps,
} from '@mui/material';
import { NotificationsActive as AlertIcon, Notifications as PushIcon } from '@mui/icons-material';
import { socket } from '../../services/socket';
import { RadarWaveAlert } from '../../types';
import {
  showBrowserNotification,
  requestNotificationPermission,
  getNotificationPermission,
} from '../../services/notificationService';

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="down" />;
}

export const ProximityAlertSnackbar: React.FC = () => {
  const [currentAlert, setCurrentAlert] = useState<RadarWaveAlert | null>(null);
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(getNotificationPermission());

  const handleEnablePush = async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted ? 'granted' : 'denied');
  };

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  useEffect(() => {
    socket.on('radar:wave', (data: any) => {
      const alertData: RadarWaveAlert = {
        id: `alert_${Date.now()}`,
        type: data.type,
        title: data.title,
        message: data.message,
        latitude: data.latitude,
        longitude: data.longitude,
        radiusMeters: data.radiusMeters,
        data: data.data,
        timestamp: Date.now(),
      };
      setCurrentAlert(alertData);
      setOpen(true);
      playChime();
      showBrowserNotification(alertData.title, {
        body: alertData.message,
        onClickUrl: '/',
      });
    });

    socket.on('radar:proximity:alert', (data: any) => {
      const alertData: RadarWaveAlert = {
        id: `alert_prox_${Date.now()}`,
        type: data.type,
        title: `🚨 ALERTA DE PROXIMIDAD: ${data.title}`,
        message: `${data.message} ¡Está a aproximadamente ${Math.round(data.distanceFromUserMeters)} metros de ti!`,
        latitude: data.latitude,
        longitude: data.longitude,
        radiusMeters: data.radiusMeters,
        data: data.data,
        timestamp: Date.now(),
      };
      setCurrentAlert(alertData);
      setOpen(true);
      playChime();
      showBrowserNotification(alertData.title, {
        body: alertData.message,
        onClickUrl: '/',
      });
    });

    return () => {
      socket.off('radar:wave');
      socket.off('radar:proximity:alert');
    };
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  if (!currentAlert) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={9000}
      onClose={handleClose}
      TransitionComponent={SlideTransition}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ top: { xs: 70, sm: 80 } }}
    >
      <Alert
        severity={currentAlert.type === 'lost_pet' ? 'error' : 'warning'}
        variant="filled"
        icon={<AlertIcon fontSize="inherit" />}
        onClose={handleClose}
        sx={{
          width: '100%',
          maxWidth: 550,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          borderRadius: 2,
        }}
      >
        <AlertTitle sx={{ fontWeight: 800 }}>{currentAlert.title}</AlertTitle>
        <Typography variant="body2" sx={{ mb: 1 }}>
          {currentAlert.message}
        </Typography>
        <Box display="flex" justifyContent="flex-end" alignItems="center" gap={1} flexWrap="wrap">
          {permission === 'default' && (
            <Button
              size="small"
              color="inherit"
              variant="contained"
              startIcon={<PushIcon />}
              onClick={handleEnablePush}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                fontWeight: 700,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              }}
            >
              Activar Notificaciones
            </Button>
          )}
          <Button
            size="small"
            color="inherit"
            variant="outlined"
            onClick={handleClose}
            sx={{ borderColor: 'rgba(255,255,255,0.6)' }}
          >
            Entendido
          </Button>
        </Box>
      </Alert>
    </Snackbar>
  );
};
