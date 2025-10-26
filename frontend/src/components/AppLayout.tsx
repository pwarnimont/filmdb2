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
    <Box sx={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
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
            <Typography variant="body2" sx={{mx: 1}}>
              {user.email}
            </Typography>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Container
        maxWidth={false}
        sx={{
          py: {xs: 3, sm: 4},
          px: {xs: 2, sm: 3, md: 5},
          flexGrow: 1,
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <Outlet />
      </Container>
    </Box>
  );
}
