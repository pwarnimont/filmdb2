import {AppBar, Box, Button, Container, Stack, Toolbar, Typography} from '@mui/material';
import {Outlet, useLocation, useNavigate} from 'react-router-dom';

import {useAuth} from '../providers/AuthProvider';

export function AppLayout() {
  const {user, logout} = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => () => {
    navigate(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) {
    return <Outlet />;
  }

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #eff4fb 0%, #dde7f6 35%, #f7f8fb 100%)'
      }}
    >
      <AppBar
        position="static"
        color="primary"
        elevation={0}
        sx={{background: 'linear-gradient(135deg, #1d3557 0%, #3a6ea5 100%)'}}
      >
        <Toolbar sx={{py: 1.5}}>
          <Typography variant="h6" sx={{flexGrow: 1, cursor: 'pointer'}} onClick={handleNavigate('/film-rolls')}>
            FilmDB
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button color={isActive('/film-rolls') ? 'secondary' : 'inherit'} onClick={handleNavigate('/film-rolls')}>
              Film Rolls
            </Button>
            {user.role === 'ADMIN' && (
              <Button color={isActive('/admin') ? 'secondary' : 'inherit'} onClick={handleNavigate('/admin/settings')}>
                Admin Settings
              </Button>
            )}
            <Stack spacing={0.25} sx={{mx: 1, minWidth: 120, textAlign: 'right'}}>
              <Typography variant="body2" fontWeight={600} color="inherit">
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="caption" sx={{color: 'rgba(255,255,255,0.72)'}}>
                {user.email}
              </Typography>
            </Stack>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Container
        maxWidth={false}
        sx={{
          py: {xs: 3, sm: 5},
          px: {xs: 2, sm: 4, md: 6},
          flexGrow: 1,
          width: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderRadius: {xs: 2, md: 3},
            boxShadow: '0 18px 36px rgba(13, 41, 74, 0.12)',
            px: {xs: 2.5, sm: 4, md: 6},
            py: {xs: 3, sm: 4},
            backdropFilter: 'blur(4px)'
          }}
        >
          <Outlet />
        </Box>
      </Container>
    </Box>
  );
}
