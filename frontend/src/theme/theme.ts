import {createTheme} from '@mui/material/styles';
import {teal, grey} from '@mui/material/colors';
import '@mui/x-data-grid/themeAugmentation';

const baseTheme = createTheme({
  palette: {
    mode: 'light',
    primary: teal,
    secondary: grey
  },
  shape: {
    borderRadius: 0
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0
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
          borderRadius: 0
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 0
        }
      }
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          borderRadius: 0
        }
      }
    }
  }
});

export default baseTheme;
