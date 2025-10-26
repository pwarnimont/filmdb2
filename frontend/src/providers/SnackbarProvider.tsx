import {createContext, useCallback, useContext, useMemo, useState, type ReactNode} from 'react';
import {Snackbar, Alert, type AlertColor} from '@mui/material';

interface SnackbarContextValue {
  showMessage: (message: string, severity?: AlertColor) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | undefined>(undefined);

export function useSnackbar(): SnackbarContextValue {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within SnackbarProvider');
  }
  return context;
}

export function SnackbarProvider({children}: {children: ReactNode}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertColor>('info');

  const showMessage = useCallback((text: string, level: AlertColor = 'info') => {
    setMessage(text);
    setSeverity(level);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const value = useMemo(() => ({showMessage}), [showMessage]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar open={open} autoHideDuration={4000} onClose={handleClose} anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}>
        <Alert onClose={handleClose} severity={severity} sx={{width: '100%'}}>
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}
