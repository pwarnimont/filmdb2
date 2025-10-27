import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {CssBaseline, ThemeProvider} from '@mui/material';
import type {PaletteMode} from '@mui/material';
import {useMemo, useState, type ReactNode} from 'react';

import ThemeModeContext from '../contexts/ThemeModeContext';
import {createAppTheme} from '../theme/theme';
import {AuthProvider} from './AuthProvider';
import {SnackbarProvider} from './SnackbarProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

export function AppProviders({children}: {children: ReactNode}) {
  const [mode, setMode] = useState<PaletteMode>('light');
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const themeModeValue = useMemo(
    () => ({
      mode,
      toggle: () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'))
    }),
    [mode]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeModeContext.Provider value={themeModeValue}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <SnackbarProvider>
            <AuthProvider>{children}</AuthProvider>
          </SnackbarProvider>
        </ThemeProvider>
      </ThemeModeContext.Provider>
    </QueryClientProvider>
  );
}
