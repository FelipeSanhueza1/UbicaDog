import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppThemeProvider } from '../../theme/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar';

describe('Navbar Component', () => {
  it('should render brand logo, navigation buttons and emergency action', () => {
    render(
      <AppThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Navbar onOpenQuickReport={() => {}} activeLostCount={3} />
          </BrowserRouter>
        </AuthProvider>
      </AppThemeProvider>
    );

    expect(screen.getByText(/Ubica/i)).toBeInTheDocument();
    expect(screen.getByText(/Dog/i)).toBeInTheDocument();
    expect(screen.getByText(/Reportar Callejero/i)).toBeInTheDocument();
  });
});
