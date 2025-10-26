import {Box, CircularProgress} from '@mui/material';
import {Navigate, Outlet, useLocation} from 'react-router-dom';

import {useAuth} from '../providers/AuthProvider';

export function ProtectedRoute() {
  const {user, loading} = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh'}}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{from: location}} />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const {user, loading} = useAuth();

  if (loading) {
    return (
      <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh'}}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (user) {
    return <Navigate to="/film-rolls" replace />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  const {user, loading} = useAuth();

  if (loading) {
    return (
      <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh'}}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/film-rolls" replace />;
  }

  return <Outlet />;
}
