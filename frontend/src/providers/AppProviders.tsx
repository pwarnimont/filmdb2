import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {CssBaseline, ThemeProvider} from '@mui/material';
import type {ReactNode} from 'react';

import theme from '../theme/theme';
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
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider>
          <AuthProvider>{children}</AuthProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
