import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Star as StarIcon,
  Pets as PetIcon,
  Store as StoreIcon,
  CreditCard as CardIcon,
} from '@mui/icons-material';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SubscriptionPlan } from '../types';

export const PricingPlansPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [tabIndex, setTabIndex] = useState<number>(0); // 0: Dueños de Mascotas, 1: Tiendas y Comercios
  const [loading, setLoading] = useState(true);
  const [subscribingId, setSubscribingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/subscriptions/plans');
      setPlans(res.data.plans || []);
    } catch (err) {
      console.error('Error fetching plans', err);
      setErrorMsg('No se pudieron cargar los planes. Verifica tu conexión de red.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();

    // Check URL parameters for Stripe checkout redirect return
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout_success') === 'true') {
      const tier = params.get('tier');
      setSuccessMsg(
        tier
          ? `¡Pago recibido con éxito! Tu cuenta ha sido activada en el plan ${tier.toUpperCase()}.`
          : '¡Pago confirmado con éxito! Tu suscripción se encuentra activa.'
      );
      refreshUser();
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('checkout_cancel') === 'true') {
      setErrorMsg('El proceso de checkout de Stripe fue cancelado. No se efectuó ningún cobro.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSubscribe = async (tierId: string) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setSubscribingId(tierId);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      if (tierId === 'free') {
        const res = await api.post('/subscriptions/subscribe', { tier: tierId });
        setSuccessMsg(res.data.message);
        await refreshUser();
      } else {
        // Initiate Stripe Checkout session
        const res = await api.post('/stripe/create-checkout-session', {
          tier: tierId,
          type: tierId,
        });

        if (res.data?.url) {
          window.location.href = res.data.url;
        } else {
          // Direct fallback
          const subRes = await api.post('/subscriptions/subscribe', { tier: tierId });
          setSuccessMsg(subRes.data.message);
          await refreshUser();
        }
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error ||
          err.message ||
          'Error de red o pasarela al procesar la suscripción. Intenta nuevamente.'
      );
    } finally {
      setSubscribingId(null);
    }
  };

  const ownerPlans = plans.filter((p) => p.target === 'owner');
  const storePlans = plans.filter((p) => p.target === 'store');

  const displayedPlans = tabIndex === 0 ? ownerPlans : storePlans;

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Title */}
      <Box textAlign="center" mb={5}>
        <Chip
          label="100% Sin Publicidad Invasiva • Modelo por Suscripción"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 800, mb: 2 }}
        />
        <Typography variant="h3" fontWeight="900" gutterBottom>
          Planes y Suscripciones UbicaDog
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 650, mx: 'auto', fontWeight: 500 }}>
          Mantén a tus mascotas protegidas con beneficios avanzados o impulsa tu local comercial en el mapa de la comunidad.
        </Typography>

        {/* Tab switch between Owner vs Store */}
        <Box display="flex" justifyContent="center" mt={4}>
          <Tabs
            value={tabIndex}
            onChange={(_, val) => setTabIndex(val)}
            sx={{
              bgcolor: 'action.hover',
              p: 0.5,
              borderRadius: 3,
            }}
          >
            <Tab
              icon={<PetIcon />}
              iconPosition="start"
              label="Para Dueños de Mascotas"
              sx={{ fontWeight: 800, borderRadius: 2 }}
            />
            <Tab
              icon={<StoreIcon />}
              iconPosition="start"
              label="Para Tiendas y Locales de Mascotas"
              sx={{ fontWeight: 800, borderRadius: 2 }}
            />
          </Tabs>
        </Box>
      </Box>

      {successMsg && (
        <Alert severity="success" onClose={() => setSuccessMsg(null)} sx={{ mb: 4, borderRadius: 2 }}>
          {successMsg}
        </Alert>
      )}

      {errorMsg && (
        <Alert severity="error" onClose={() => setErrorMsg(null)} sx={{ mb: 4, borderRadius: 2 }}>
          {errorMsg}
        </Alert>
      )}

      {/* Plans Grid */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={4} justifyContent="center" alignItems="stretch">
          {displayedPlans.map((plan) => {
            const isCurrent = user?.subscriptionTier === plan.id;

            return (
              <Grid item xs={12} md={displayedPlans.length === 2 ? 6 : 4} key={plan.id}>
                <Card
                  sx={{
                    borderRadius: 4,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    border: plan.popular ? '2px solid #2563EB' : '1px solid',
                    borderColor: plan.popular ? 'primary.main' : 'divider',
                    boxShadow: plan.popular ? '0 12px 32px rgba(37, 99, 235, 0.15)' : 'none',
                    transform: plan.popular ? 'scale(1.02)' : 'none',
                  }}
                >
                  {plan.popular && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 24,
                        bgcolor: 'primary.main',
                        color: 'white',
                        px: 2,
                        py: 0.5,
                        borderBottomLeftRadius: 8,
                        borderBottomRightRadius: 8,
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      Más Recomendado
                    </Box>
                  )}

                  <CardContent sx={{ p: 4, flexGrow: 1 }}>
                    <Typography variant="overline" color="text.secondary" fontWeight="700">
                      {plan.target === 'owner' ? 'MEMBRESÍA FAMILIAR' : 'PLAN COMERCIAL'}
                    </Typography>

                    <Typography variant="h5" fontWeight="900" gutterBottom>
                      {plan.name}
                    </Typography>

                    {/* Price Tag */}
                    <Box my={2.5}>
                      <Typography variant="h3" fontWeight="900" color="primary.main" component="span">
                        {plan.priceLabel}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Benefits List */}
                    <List sx={{ p: 0 }}>
                      {plan.benefits.map((b, idx) => (
                        <ListItem key={idx} disableGutters sx={{ py: 1 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckIcon color="primary" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={b}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>

                  <CardActions sx={{ p: 4, pt: 0 }}>
                    <Button
                      fullWidth
                      size="large"
                      variant={plan.popular ? 'contained' : 'outlined'}
                      color="primary"
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isCurrent || subscribingId === plan.id}
                      startIcon={
                        subscribingId === plan.id ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <CardIcon />
                        )
                      }
                      sx={{ py: 1.4, fontWeight: 800, borderRadius: 2 }}
                    >
                      {isCurrent
                        ? 'Tu Plan Actual'
                        : subscribingId === plan.id
                        ? 'Procesando Stripe...'
                        : plan.priceClp === 0
                        ? 'Comenzar Gratis'
                        : `Suscribirme por ${plan.priceLabel}`}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Commercial FAQ / Explanation of $5.000 vs $10.000 Tiers */}
      {tabIndex === 1 && (
        <Box mt={6} p={3} bgcolor="action.hover" borderRadius={3}>
          <Typography variant="subtitle1" fontWeight="800" gutterBottom>
            ¿Cuál es la diferencia entre el Plan Básico ($5.000) y Premium ($10.000)?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • <strong>Plan Básico ($5.000 CLP/mes)</strong>: Tu tienda aparece con pin azul en el mapa con ficha de contacto y un catálogo esencial de hasta 5 artículos.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • <strong>Plan Premium ($10.000 CLP/mes)</strong>: Tu tienda resalta con un <strong>halo dorado y logo en el mapa</strong>, catálogo sin límites, y puedes emitir <strong>cupones de descuento geolocalizados</strong> que alertan a los usuarios cuando están cerca de tu local.
          </Typography>
        </Box>
      )}
    </Container>
  );
};
