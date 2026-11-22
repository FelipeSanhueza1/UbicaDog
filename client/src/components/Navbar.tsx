import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Pets as PetsIcon,
  Map as MapIcon,
  AddLocationAlt as ReportIcon,
  NotificationsActive as AlertIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  AdminPanelSettings as AdminIcon,
  LocalHospital as VetIcon,
  Store as StoreIcon,
  Star as StarIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  GetApp as GetAppIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../theme/ThemeContext';

interface NavbarProps {
  onOpenQuickReport: () => void;
  activeLostCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenQuickReport, activeLostCount = 2 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useAppTheme();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert(
        'Para instalar UbicaDog en tu celular:\n• En Safari (iPhone): Presiona el botón "Compartir" (ícono con flecha hacia arriba) y selecciona "Agregar a pantalla de inicio".\n• En Chrome (Android): Toca el menú de 3 puntos y presiona "Instalar aplicación".'
      );
    }
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNav = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const isEmployeeOrAdmin = user && (user.role === 'employee' || user.role === 'admin');

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        backdropFilter: 'blur(10px)',
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1.5, sm: 2 } }}>
        {/* Logo and Brand */}
        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          sx={{ cursor: 'pointer' }}
          onClick={() => handleNav('/')}
        >
          <Box
            sx={{
              width: { xs: 36, sm: 42 },
              height: { xs: 36, sm: 42 },
              borderRadius: '12px',
              backgroundColor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
            }}
          >
            <PetsIcon fontSize="medium" />
          </Box>
          <Box>
            <Typography
              variant="h6"
              fontWeight="800"
              sx={{ lineHeight: 1.1, color: 'text.primary', fontSize: { xs: '1.05rem', sm: '1.25rem' } }}
            >
              Ubica<span style={{ color: '#2563EB' }}>Dog</span>
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}
            >
              Red Georreferenciada de Rescate
            </Typography>
          </Box>
        </Box>

        {/* Center Nav Links (Desktop) */}
        <Box display={{ xs: 'none', lg: 'flex' }} alignItems="center" gap={0.5}>
          <Button
            startIcon={<MapIcon />}
            color={location.pathname === '/' ? 'primary' : 'inherit'}
            variant={location.pathname === '/' ? 'contained' : 'text'}
            onClick={() => handleNav('/')}
            sx={{ fontWeight: 600 }}
          >
            Mapa y Radar
          </Button>

          <Button
            startIcon={
              <Badge badgeContent={activeLostCount} color="secondary">
                <AlertIcon />
              </Badge>
            }
            color={location.pathname === '/sightings' ? 'primary' : 'inherit'}
            onClick={() => handleNav('/sightings')}
            sx={{ fontWeight: 600 }}
          >
            Avistamientos
          </Button>

          {/* Veterinary directory */}
          <Button
            startIcon={<VetIcon sx={{ color: '#10B981' }} />}
            color={location.pathname === '/veterinaries' ? 'primary' : 'inherit'}
            onClick={() => handleNav('/veterinaries')}
            sx={{ fontWeight: 600 }}
          >
            Veterinarias
          </Button>

          {/* Plans & Pricing Button */}
          <Button
            startIcon={<StarIcon sx={{ color: '#F59E0B' }} />}
            color={location.pathname === '/pricing' ? 'primary' : 'inherit'}
            onClick={() => handleNav('/pricing')}
            sx={{ fontWeight: 700 }}
          >
            Planes
          </Button>

          {user && (
            <Button
              startIcon={<PetsIcon />}
              color={location.pathname === '/my-pets' ? 'primary' : 'inherit'}
              onClick={() => handleNav('/my-pets')}
              sx={{ fontWeight: 600 }}
            >
              Mis Mascotas
            </Button>
          )}

          {isEmployeeOrAdmin && (
            <Chip
              icon={<AdminIcon />}
              label={user.role === 'admin' ? 'Panel Admin' : 'Portal Empleado'}
              color="primary"
              variant={location.pathname.startsWith('/admin') ? 'filled' : 'outlined'}
              onClick={() => handleNav('/admin')}
              clickable
              sx={{ fontWeight: 700, ml: 1 }}
            />
          )}
        </Box>

        {/* Right Action Buttons */}
        <Box display="flex" alignItems="center" gap={{ xs: 0.8, sm: 1.5 }}>
          {/* Quick Street Sighting Button */}
          <Button
            variant="contained"
            color="secondary"
            startIcon={<ReportIcon />}
            onClick={onOpenQuickReport}
            sx={{
              fontWeight: 700,
              fontSize: { xs: '0.78rem', sm: '0.875rem' },
              px: { xs: 1.2, sm: 2 },
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)',
            }}
          >
            Reportar Callejero
          </Button>

          {/* Theme Mode Toggle Button */}
          <Tooltip title={`Cambiar a modo ${mode === 'light' ? 'oscuro' : 'claro'}`}>
            <IconButton onClick={toggleTheme} color="inherit" size="small">
              {mode === 'dark' ? <LightIcon sx={{ color: '#FBBF24' }} /> : <DarkIcon />}
            </IconButton>
          </Tooltip>

          {/* User Menu / Login Buttons (Desktop) */}
          <Box display={{ xs: 'none', sm: 'flex' }} alignItems="center">
            {user ? (
              <Box>
                <IconButton onClick={handleMenu} size="small" sx={{ p: 0.5 }}>
                  <Avatar
                    src={user.avatarUrl}
                    alt={user.name}
                    sx={{ width: 36, height: 36, border: '2px solid #2563EB' }}
                  >
                    {user.name.charAt(0)}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  PaperProps={{
                    sx: { width: 220, mt: 1, borderRadius: 2 },
                  }}
                >
                  <Box px={2} py={1}>
                    <Typography variant="subtitle2" fontWeight="700">
                      {user.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.email}
                    </Typography>
                    <Box mt={0.5}>
                      <Chip
                        label={user.subscriptionTier ? user.subscriptionTier.toUpperCase().replace('_', ' ') : 'FREE'}
                        size="small"
                        color="warning"
                        sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                      />
                    </Box>
                  </Box>
                  <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
                    <PersonIcon fontSize="small" sx={{ mr: 1.5 }} /> Mi Perfil
                  </MenuItem>
                  <MenuItem onClick={() => { handleClose(); navigate('/my-pets'); }}>
                    <PetsIcon fontSize="small" sx={{ mr: 1.5 }} /> Mis Mascotas
                  </MenuItem>
                  <MenuItem onClick={() => { handleClose(); navigate('/pricing'); }}>
                    <StarIcon fontSize="small" sx={{ mr: 1.5, color: '#F59E0B' }} /> Mi Suscripción
                  </MenuItem>
                  {isEmployeeOrAdmin && (
                    <MenuItem onClick={() => { handleClose(); navigate('/admin'); }}>
                      <AdminIcon fontSize="small" sx={{ mr: 1.5, color: 'primary.main' }} /> Panel de Administración
                    </MenuItem>
                  )}
                  <MenuItem onClick={() => { handleClose(); logout(); navigate('/'); }}>
                    <LogoutIcon fontSize="small" sx={{ mr: 1.5, color: 'error.main' }} /> Cerrar Sesión
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => navigate('/login')}
                  size="small"
                  sx={{ fontWeight: 600 }}
                >
                  Ingresar
                </Button>
              </Box>
            )}
          </Box>

          {/* Mobile Hamburger Menu Button */}
          <IconButton
            color="inherit"
            edge="end"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú de opciones"
            sx={{ display: { xs: 'inline-flex', lg: 'none' }, ml: 0.5 }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Toolbar>

      {/* Responsive Navigation Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '85vw', sm: 340 },
            p: 2.5,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          },
        }}
      >
        <Box>
          {/* Drawer Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '10px',
                  backgroundColor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <PetsIcon fontSize="small" />
              </Box>
              <Typography variant="h6" fontWeight="800">
                Ubica<span style={{ color: '#2563EB' }}>Dog</span>
              </Typography>
            </Box>
            <IconButton onClick={() => setDrawerOpen(false)} size="small" aria-label="Cerrar menú">
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* User Info inside Drawer */}
          {user ? (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'action.hover',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Avatar src={user.avatarUrl} alt={user.name} sx={{ width: 44, height: 44 }}>
                {user.name.charAt(0)}
              </Avatar>
              <Box overflow="hidden">
                <Typography variant="subtitle2" fontWeight="700" noWrap>
                  {user.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {user.email}
                </Typography>
                <Chip
                  label={user.subscriptionTier ? user.subscriptionTier.toUpperCase().replace('_', ' ') : 'PLAN GRATIS'}
                  size="small"
                  color="warning"
                  sx={{ mt: 0.5, fontWeight: 800, fontSize: '0.65rem' }}
                />
              </Box>
            </Box>
          ) : (
            <Box mb={2}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<LoginIcon />}
                onClick={() => handleNav('/login')}
                sx={{ mb: 1, fontWeight: 700 }}
              >
                Iniciar Sesión
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="inherit"
                onClick={() => handleNav('/register')}
                sx={{ fontWeight: 600 }}
              >
                Crear Cuenta Nueva
              </Button>
            </Box>
          )}

          {/* Navigation Links List */}
          <List sx={{ pt: 0 }}>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={location.pathname === '/'}
                onClick={() => handleNav('/')}
                sx={{ borderRadius: 2 }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                  <MapIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Mapa y Radar en Vivo"
                  primaryTypographyProps={{ fontWeight: location.pathname === '/' ? 800 : 600 }}
                />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={location.pathname === '/sightings'}
                onClick={() => handleNav('/sightings')}
                sx={{ borderRadius: 2 }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'secondary.main' }}>
                  <Badge badgeContent={activeLostCount} color="secondary">
                    <AlertIcon />
                  </Badge>
                </ListItemIcon>
                <ListItemText
                  primary="Avistamientos Callejeros"
                  primaryTypographyProps={{ fontWeight: location.pathname === '/sightings' ? 800 : 600 }}
                />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={location.pathname === '/veterinaries'}
                onClick={() => handleNav('/veterinaries')}
                sx={{ borderRadius: 2 }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: '#10B981' }}>
                  <VetIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Veterinarias de Urgencia"
                  primaryTypographyProps={{ fontWeight: location.pathname === '/veterinaries' ? 800 : 600 }}
                />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={location.pathname === '/pricing'}
                onClick={() => handleNav('/pricing')}
                sx={{ borderRadius: 2 }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: '#F59E0B' }}>
                  <StarIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Planes y Suscripción"
                  primaryTypographyProps={{ fontWeight: location.pathname === '/pricing' ? 800 : 600 }}
                />
              </ListItemButton>
            </ListItem>

            {user && (
              <>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    selected={location.pathname === '/my-pets'}
                    onClick={() => handleNav('/my-pets')}
                    sx={{ borderRadius: 2 }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                      <PetsIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Mis Mascotas"
                      primaryTypographyProps={{ fontWeight: location.pathname === '/my-pets' ? 800 : 600 }}
                    />
                  </ListItemButton>
                </ListItem>

                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    selected={location.pathname === '/profile'}
                    onClick={() => handleNav('/profile')}
                    sx={{ borderRadius: 2 }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                      <PersonIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Mi Perfil"
                      primaryTypographyProps={{ fontWeight: location.pathname === '/profile' ? 800 : 600 }}
                    />
                  </ListItemButton>
                </ListItem>
              </>
            )}

            {isEmployeeOrAdmin && (
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={location.pathname.startsWith('/admin')}
                  onClick={() => handleNav('/admin')}
                  sx={{ borderRadius: 2 }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                    <AdminIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={user?.role === 'admin' ? 'Panel de Administración' : 'Portal de Funcionario'}
                    primaryTypographyProps={{ fontWeight: 700 }}
                  />
                </ListItemButton>
              </ListItem>
            )}
          </List>

          {/* Quick Action Button inside Drawer */}
          <Box mt={2}>
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              size="large"
              startIcon={<ReportIcon />}
              onClick={() => {
                setDrawerOpen(false);
                onOpenQuickReport();
              }}
              sx={{
                py: 1.3,
                fontWeight: 800,
                borderRadius: 2,
                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
              }}
            >
              Publicar Mascota Callejera
            </Button>
          </Box>
        </Box>

        {/* Drawer Bottom Actions */}
        <Box pt={2}>
          <Divider sx={{ mb: 2 }} />

          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={handleInstallPWA}
              sx={{
                borderRadius: 2,
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                <GetAppIcon />
              </ListItemIcon>
              <ListItemText
                primary="Instalar App en el Celular"
                secondary="Abrir directo sin navegador"
                primaryTypographyProps={{ fontWeight: 700, fontSize: '0.85rem' }}
                secondaryTypographyProps={{ fontSize: '0.7rem' }}
              />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton onClick={toggleTheme} sx={{ borderRadius: 2 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                {mode === 'dark' ? <LightIcon sx={{ color: '#FBBF24' }} /> : <DarkIcon />}
              </ListItemIcon>
              <ListItemText primary={`Cambiar a modo ${mode === 'dark' ? 'claro' : 'oscuro'}`} />
            </ListItemButton>
          </ListItem>

          {user && (
            <ListItem disablePadding sx={{ mt: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  logout();
                  handleNav('/');
                }}
                sx={{ borderRadius: 2, color: 'error.main' }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Cerrar Sesión" primaryTypographyProps={{ fontWeight: 700 }} />
              </ListItemButton>
            </ListItem>
          )}
        </Box>
      </Drawer>
    </AppBar>
  );
};
