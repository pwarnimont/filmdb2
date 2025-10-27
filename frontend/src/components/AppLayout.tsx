import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography
} from '@mui/material';
import {alpha, useTheme} from '@mui/material/styles';
import {useContext} from 'react';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import {Outlet, useLocation, useNavigate} from 'react-router-dom';

import ThemeModeContext from '../contexts/ThemeModeContext';
import {useAuth} from '../providers/AuthProvider';
import logoUrl from '../assets/film-manager-logo.svg';

export function AppLayout() {
  const {user, logout} = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const {mode, toggle} = useContext(ThemeModeContext);

  const isDark = mode === 'dark';
  const activeBackground = (active: boolean) =>
    active ? alpha(theme.palette.secondary.main, isDark ? 0.3 : 0.18) : 'transparent';
  const activeHover = (active: boolean) =>
    active
      ? alpha(theme.palette.secondary.main, isDark ? 0.4 : 0.26)
      : alpha(theme.palette.common.white, isDark ? 0.1 : 0.08);

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
        background:
          theme.palette.mode === 'light'
            ? 'linear-gradient(180deg, #f0f7f2 0%, #e4eee6 35%, #f9fbf8 100%)'
            : theme.palette.background.default
      }}
    >
      <AppBar
        position="static"
        color="primary"
        elevation={0}
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
        }}
      >
        <Toolbar sx={{py: 1.5}}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{flexGrow: 1, cursor: 'pointer'}}
            onClick={handleNavigate('/film-rolls')}
          >
            <Box
              component="img"
              src={logoUrl}
              alt="Film Manager logo"
              sx={{width: 36, height: 36, borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.18)'}}
            />
            <Typography variant="h6" sx={{fontWeight: 700, letterSpacing: '0.04em'}}>
              Film Manager
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              color="inherit"
              sx={{
                color: isActive('/film-rolls') ? theme.palette.secondary.light : 'inherit',
                fontWeight: isActive('/film-rolls') ? 600 : 500,
                backgroundColor: activeBackground(isActive('/film-rolls')),
                '&:hover': {
                  backgroundColor: activeHover(isActive('/film-rolls'))
                }
              }}
              onClick={handleNavigate('/film-rolls')}
            >
              Film Rolls
            </Button>
            <Button
              color="inherit"
              sx={{
                color: isActive('/prints') ? theme.palette.secondary.light : 'inherit',
                fontWeight: isActive('/prints') ? 600 : 500,
                backgroundColor: activeBackground(isActive('/prints')),
                '&:hover': {
                  backgroundColor: activeHover(isActive('/prints'))
                }
              }}
              onClick={handleNavigate('/prints')}
            >
              Prints
            </Button>
            {user.role === 'ADMIN' && (
              <Button
                color="inherit"
                sx={{
                  color: isActive('/admin') ? theme.palette.secondary.light : 'inherit',
                  fontWeight: isActive('/admin') ? 600 : 500,
                  backgroundColor: activeBackground(isActive('/admin')),
                  '&:hover': {
                    backgroundColor: activeHover(isActive('/admin'))
                  }
                }}
                onClick={handleNavigate('/admin/settings')}
              >
                Admin Settings
              </Button>
            )}
            <Tooltip title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
              <IconButton color="inherit" onClick={toggle} sx={{ml: 0.5}}>
                {isDark ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            <Stack spacing={0.25} sx={{mx: 1, minWidth: 120, textAlign: 'right'}}>
              <Typography variant="body2" fontWeight={600} color="inherit">
                {user.firstName} {user.lastName}
              </Typography>
              <Typography
                variant="caption"
                sx={{color: alpha(theme.palette.common.white, 0.72)}}
              >
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
          backgroundColor: alpha(theme.palette.background.paper, isDark ? 0.92 : 0.9),
          borderRadius: {xs: 2, md: 3},
          boxShadow:
            theme.palette.mode === 'light'
              ? '0 18px 36px rgba(23, 66, 41, 0.12)'
              : '0 18px 36px rgba(5, 15, 10, 0.6)',
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
