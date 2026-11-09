import React, { useState } from 'react';
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

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
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
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo and Brand */}
        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <Box
            sx={{
              width: 42,
              height: 42,
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
            <Typography variant="h6" fontWeight="800" sx={{ lineHeight: 1.1, color: 'text.primary' }}>
              Ubica<span style={{ color: '#2563EB' }}>Dog</span>
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Red Georreferenciada de Rescate
            </Typography>
          </Box>
        </Box>

        {/* Center Nav Links */}
        <Box display={{ xs: 'none', lg: 'flex' }} alignItems="center" gap={0.5}>
          <Button
            startIcon={<MapIcon />}
            color={location.pathname === '/' ? 'primary' : 'inherit'}
            variant={location.pathname === '/' ? 'contained' : 'text'}
            onClick={() => navigate('/')}
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
            onClick={() => navigate('/sightings')}
            sx={{ fontWeight: 600 }}
          >
            Avistamientos
          </Button>

          {/* New Veterinary directory */}
          <Button
            startIcon={<VetIcon sx={{ color: '#10B981' }} />}
            color={location.pathname === '/veterinaries' ? 'primary' : 'inherit'}
            onClick={() => navigate('/veterinaries')}
            sx={{ fontWeight: 600 }}
          >
            Veterinarias
          </Button>

          {/* Plans & Pricing Button */}
          <Button
            startIcon={<StarIcon sx={{ color: '#F59E0B' }} />}
            color={location.pathname === '/pricing' ? 'primary' : 'inherit'}
            onClick={() => navigate('/pricing')}
            sx={{ fontWeight: 700 }}
          >
            Planes
          </Button>

          {user && (
            <Button
              startIcon={<PetsIcon />}
              color={location.pathname === '/my-pets' ? 'primary' : 'inherit'}
              onClick={() => navigate('/my-pets')}
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
              onClick={() => navigate('/admin')}
              clickable
              sx={{ fontWeight: 700, ml: 1 }}
            />
          )}
        </Box>

        {/* Right Action Buttons */}
        <Box display="flex" alignItems="center" gap={1.5}>
          {/* Quick Street Sighting Button */}
          <Button
            variant="contained"
            color="secondary"
            startIcon={<ReportIcon />}
            onClick={onOpenQuickReport}
            sx={{
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)',
            }}
          >
            Reportar Callejero
          </Button>

          {/* Theme Mode Toggle Button */}
          <Tooltip title={`Cambiar a modo ${mode === 'light' ? 'oscuro' : 'claro'}`}>
            <IconButton onClick={toggleTheme} color="inherit">
              {mode === 'dark' ? <LightIcon sx={{ color: '#FBBF24' }} /> : <DarkIcon />}
            </IconButton>
          </Tooltip>

          {/* User Menu / Login Buttons */}
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
                <MenuItem onClick={() => { handleClose(); navigate('/my-pets'); }}>
                  <PetsIcon fontSize="small" sx={{ mr: 1.5 }} /> Mis Mascotas
                </MenuItem>
                <MenuItem onClick={() => { handleClose(); navigate('/pricing'); }}>
                  <StarIcon fontSize="small" sx={{ mr: 1.5, color: '#F59E0B' }} /> Mi Suscripción
                </MenuItem>
                {isEmployeeOrAdmin && (
                  <MenuItem onClick={() => { handleClose(); navigate('/admin'); }}>
                    <AdminIcon fontSize="small" sx={{ mr: 1.5 }} /> Panel Corporativo
                  </MenuItem>
                )}
                <MenuItem onClick={() => { handleClose(); logout(); navigate('/'); }}>
                  Cerrar Sesión
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate('/login')}
                sx={{ fontWeight: 600 }}
              >
                Ingresar
              </Button>
              <Button
                variant="text"
                color="inherit"
                onClick={() => navigate('/employee-login')}
                size="small"
                startIcon={<AdminIcon fontSize="small" />}
                sx={{ fontSize: '0.75rem', opacity: 0.8 }}
              >
                Personal
              </Button>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
