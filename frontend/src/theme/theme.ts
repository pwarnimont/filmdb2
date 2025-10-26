import {createTheme} from '@mui/material/styles';
import '@mui/x-data-grid/themeAugmentation';

const baseTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1d3557',
      contrastText: '#f1faee'
    },
    secondary: {
      main: '#e63946'
    },
    background: {
      default: '#edf2fb',
      paper: '#ffffff'
    },
    text: {
      primary: '#0f1c2e',
      secondary: '#4b5e7a'
    }
  },
  shape: {
    borderRadius: 12
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
          borderRadius: 999
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 16
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
          borderRadius: 12
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          boxShadow: '0 18px 36px rgba(18, 46, 76, 0.08)'
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: '0 24px 48px rgba(13, 41, 74, 0.16)'
        }
      }
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: 'none'
        }
      }
    }
  }
});

export default baseTheme;
