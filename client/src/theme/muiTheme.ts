import { createTheme, PaletteOptions, SimplePaletteColorOptions } from '@mui/material/styles';

// ==========================================
// MODULE AUGMENTATION FOR MATERIAL UI (MUI)
// ==========================================
declare module '@mui/material/styles' {
  interface Palette {
    tertiary: Palette['primary'];
    border: {
      default: string;
    };
  }

  interface PaletteOptions {
    tertiary?: SimplePaletteColorOptions & {
      50?: string;
      100?: string;
      200?: string;
      300?: string;
      400?: string;
      500?: string;
      600?: string;
      700?: string;
      800?: string;
      900?: string;
    };
    border?: {
      default?: string;
    };
  }

  interface PaletteColor {
    50?: string;
    100?: string;
    200?: string;
    300?: string;
    400?: string;
    500?: string;
    600?: string;
    700?: string;
    800?: string;
    900?: string;
  }

  interface SimplePaletteColorOptions {
    50?: string;
    100?: string;
    200?: string;
    300?: string;
    400?: string;
    500?: string;
    600?: string;
    700?: string;
    800?: string;
    900?: string;
  }

  interface TypeBackground {
    surface: string;
  }

  interface TypeText {
    inverse: string;
  }
}

// ==========================================
// LIGHT PALETTE
// ==========================================
export const lightPalette = {
  mode: 'light' as const,
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#2563EB',
    600: '#1D4ED8',
    700: '#1E40AF',
    800: '#1E3A8A',
    900: '#172554',
    light: '#60A5FA',
    main: '#2563EB',
    dark: '#1D4ED8',
    contrastText: '#FFFFFF',
  },
  secondary: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
    light: '#FB923C',
    main: '#F97316',
    dark: '#EA580C',
    contrastText: '#FFFFFF',
  },
  tertiary: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
    light: '#34D399',
    main: '#10B981',
    dark: '#059669',
    contrastText: '#FFFFFF',
  },
  error: {
    light: '#EF4444',
    main: '#DC2626',
    dark: '#991B1B',
    contrastText: '#FFFFFF',
  },
  warning: {
    light: '#FBBF24',
    main: '#D97706',
    dark: '#92400E',
    contrastText: '#FFFFFF',
  },
  success: {
    light: '#34D399',
    main: '#10B981',
    dark: '#047857',
    contrastText: '#FFFFFF',
  },
  grey: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    A100: '#F1F5F9',
    A200: '#E2E8F0',
    A400: '#94A3B8',
    A700: '#334155',
  },
  background: {
    default: '#F8FAFC',
    surface: '#FFFFFF',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    inverse: '#FFFFFF',
    disabled: 'rgba(15, 23, 42, 0.38)',
  },
  border: {
    default: '#E2E8F0',
  },
  common: {
    black: '#000000',
    white: '#FFFFFF',
  },
  info: {
    light: '#38BDF8',
    main: '#0284C7',
    dark: '#0369A1',
    contrastText: '#FFFFFF',
  },
  contrastThreshold: 3,
  tonalOffset: 0.2,
  divider: 'rgba(15, 23, 42, 0.08)',
  action: {
    active: 'rgba(15, 23, 42, 0.54)',
    hover: 'rgba(15, 23, 42, 0.04)',
    hoverOpacity: 0.04,
    selected: 'rgba(15, 23, 42, 0.08)',
    selectedOpacity: 0.08,
    disabled: 'rgba(15, 23, 42, 0.26)',
    disabledBackground: 'rgba(15, 23, 42, 0.12)',
    disabledOpacity: 0.38,
    focus: 'rgba(15, 23, 42, 0.12)',
    focusOpacity: 0.12,
    activatedOpacity: 0.12,
  },
};

// ==========================================
// DARK PALETTE
// ==========================================
export const darkPalette = {
  mode: 'dark' as const,
  primary: {
    50: '#172554',
    100: '#1E3A8A',
    200: '#1E40AF',
    300: '#1D4ED8',
    400: '#2563EB',
    500: '#3B82F6',
    600: '#60A5FA',
    700: '#93C5FD',
    800: '#BFDBFE',
    900: '#EFF6FF',
    light: '#60A5FA',
    main: '#3B82F6',
    dark: '#1D4ED8',
    contrastText: '#FFFFFF',
  },
  secondary: {
    50: '#7C2D12',
    100: '#9A3412',
    200: '#C2410C',
    300: '#EA580C',
    400: '#F97316',
    500: '#FB923C',
    600: '#FDBA74',
    700: '#FED7AA',
    800: '#FFEDD5',
    900: '#FFF7ED',
    light: '#FDBA74',
    main: '#FB923C',
    dark: '#EA580C',
    contrastText: '#000000',
  },
  tertiary: {
    50: '#064E3B',
    100: '#065F46',
    200: '#047857',
    300: '#059669',
    400: '#10B981',
    500: '#34D399',
    600: '#6EE7B7',
    700: '#A7F3D0',
    800: '#D1FAE5',
    900: '#ECFDF5',
    light: '#6EE7B7',
    main: '#34D399',
    dark: '#059669',
    contrastText: '#000000',
  },
  error: {
    light: '#F87171',
    main: '#EF4444',
    dark: '#B91C1C',
    contrastText: '#FFFFFF',
  },
  warning: {
    light: '#FCD34D',
    main: '#F59E0B',
    dark: '#B45309',
    contrastText: '#000000',
  },
  success: {
    light: '#6EE7B7',
    main: '#10B981',
    dark: '#047857',
    contrastText: '#FFFFFF',
  },
  grey: {
    50: '#0F172A',
    100: '#1E293B',
    200: '#334155',
    300: '#475569',
    400: '#64748B',
    500: '#94A3B8',
    600: '#CBD5E1',
    700: '#E2E8F0',
    800: '#F1F5F9',
    900: '#F8FAFC',
    A100: '#1E293B',
    A200: '#334155',
    A400: '#64748B',
    A700: '#CBD5E1',
  },
  background: {
    default: '#0B0F19',
    surface: '#111827',
    paper: '#151D2F',
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#94A3B8',
    inverse: '#0F172A',
    disabled: 'rgba(248, 250, 252, 0.38)',
  },
  border: {
    default: '#1E293B',
  },
  common: {
    black: '#000000',
    white: '#FFFFFF',
  },
  info: {
    light: '#7DD3FC',
    main: '#38BDF8',
    dark: '#0284C7',
    contrastText: '#000000',
  },
  contrastThreshold: 3,
  tonalOffset: 0.2,
  divider: 'rgba(248, 250, 252, 0.12)',
  action: {
    active: 'rgba(248, 250, 252, 0.70)',
    hover: 'rgba(248, 250, 252, 0.08)',
    hoverOpacity: 0.08,
    selected: 'rgba(248, 250, 252, 0.16)',
    selectedOpacity: 0.16,
    disabled: 'rgba(248, 250, 252, 0.30)',
    disabledBackground: 'rgba(248, 250, 252, 0.12)',
    disabledOpacity: 0.38,
    focus: 'rgba(248, 250, 252, 0.16)',
    focusOpacity: 0.16,
    activatedOpacity: 0.16,
  },
};

export const createAppTheme = (mode: 'light' | 'dark') => {
  const palette = mode === 'light' ? lightPalette : darkPalette;

  return createTheme({
    palette,
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 800 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '8px 18px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: 'none',
            border: `1px solid ${palette.border.default}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });
};
