import {createTheme, type ThemeOptions} from '@mui/material/styles';
import type {PaletteMode} from '@mui/material';
import '@mui/x-data-grid/themeAugmentation';

const primary = {
  main: '#1f5130',
  contrastText: '#f4f9f4'
};

const secondary = {
  main: '#4caf6f'
};

const getPalette = (mode: PaletteMode): ThemeOptions['palette'] =>
  mode === 'light'
    ? {
        mode,
        primary,
        secondary,
        background: {
          default: '#f2f6f2',
          paper: '#ffffff'
        },
        text: {
          primary: '#102618',
          secondary: '#415347'
        }
      }
    : {
        mode,
        primary: {
          ...primary,
          main: '#81c784'
        },
        secondary,
        background: {
          default: '#0f1712',
          paper: '#1b2a20'
        },
        text: {
          primary: '#f5f9f6',
          secondary: '#c2d5c8'
        }
      };

const baseOptions: Omit<ThemeOptions, 'palette'> = {
  shape: {
    borderRadius: 2
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600
    },
    button: {
      fontWeight: 600,
      textTransform: 'none'
    }
  },
  components: {
    MuiAppBar: {
      defaultProps: {
        elevation: 0
      },
      styleOverrides: {
        root: {
          borderRadius: 0
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 3
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 3
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined'
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 2
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          boxShadow: '0 18px 36px rgba(24, 66, 44, 0.08)'
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 5,
          boxShadow: '0 24px 48px rgba(20, 58, 38, 0.16)'
        }
      }
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          borderRadius: 3,
          border: 'none'
        }
      }
    }
  }
};

export const createAppTheme = (mode: PaletteMode = 'light') =>
  createTheme({
    palette: getPalette(mode),
    ...baseOptions
  });

export default createAppTheme('light');
