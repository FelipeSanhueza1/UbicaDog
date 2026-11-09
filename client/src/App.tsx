import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { AppThemeProvider } from './theme/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProximityAlertSnackbar } from './components/Alerts/ProximityAlertSnackbar';
import { QuickSightingDialog } from './components/Pets/QuickSightingDialog';

import { MapPage } from './pages/MapPage';
import { MyPetsPage } from './pages/MyPetsPage';
import { SightingsPage } from './pages/SightingsPage';
import { VeterinariesPage } from './pages/VeterinariesPage';
import { PricingPlansPage } from './pages/PricingPlansPage';
import { PetPublicProfilePage } from './pages/PetPublicProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { EmployeeLoginPage } from './pages/EmployeeLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const StaffRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || (user.role !== 'admin' && user.role !== 'employee')) {
    return <Navigate to="/employee-login" replace />;
  }
  return <>{children}</>;
};

function AppContent() {
  const [quickReportOpen, setQuickReportOpen] = useState(false);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Navbar onOpenQuickReport={() => setQuickReportOpen(true)} />
      <ProximityAlertSnackbar />

      <Box component="main" sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<MapPage onOpenQuickReport={() => setQuickReportOpen(true)} />} />
          <Route path="/sightings" element={<SightingsPage onOpenQuickReport={() => setQuickReportOpen(true)} />} />
          <Route path="/veterinaries" element={<VeterinariesPage />} />
          <Route path="/pricing" element={<PricingPlansPage />} />
          {/* Public Smart QR Emergency Profile */}
          <Route path="/p/:petId" element={<PetPublicProfilePage />} />
          <Route
            path="/my-pets"
            element={
              <ProtectedRoute>
                <MyPetsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/employee-login" element={<EmployeeLoginPage />} />
          <Route
            path="/admin"
            element={
              <StaffRoute>
                <AdminDashboardPage />
              </StaffRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>

      {/* Global Quick Sighting Street Dialog */}
      <QuickSightingDialog
        open={quickReportOpen}
        onClose={() => setQuickReportOpen(false)}
        onSightingCreated={() => {}}
      />
    </Box>
  );
}

export default function App() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </AppThemeProvider>
  );
}
