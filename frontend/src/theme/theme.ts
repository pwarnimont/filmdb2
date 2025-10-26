import {createTheme} from '@mui/material/styles';
import '@mui/x-data-grid/themeAugmentation';

const baseTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1f5130',
      contrastText: '#f4f9f4'
    },
    secondary: {
      main: '#4caf6f'
    },
    background: {
      default: '#f2f6f2',
      paper: '#ffffff'
    },
    text: {
      primary: '#102618',
      secondary: '#415347'
    }
  },
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
});

export default baseTheme;
