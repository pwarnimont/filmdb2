import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography
} from '@mui/material';
import {alpha, useTheme} from '@mui/material/styles';
import {useContext} from 'react';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import MovieFilterIcon from '@mui/icons-material/MovieFilterOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshopOutlined';
import {Outlet, useLocation, useNavigate} from 'react-router-dom';

import ThemeModeContext from '../contexts/ThemeModeContext';
import {useAuth} from '../providers/AuthProvider';
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
  const drawerWidth = 272;

  const navItems: Array<{
    label: string;
    path: string;
    icon: JSX.Element;
  }> = [
    {
      label: 'Film Rolls',
      path: '/film-rolls',
      icon: <MovieFilterIcon />
    },
    {
      label: 'Prints',
      path: '/prints',
      icon: <LocalPrintshopIcon />
    }
  ];

  if (user.role === 'ADMIN') {
    navItems.push({
      label: 'Admin Settings',
      path: '/admin/settings',
      icon: <AdminPanelSettingsIcon />
    });
  }

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        background:
          theme.palette.mode === 'light'
            ? 'linear-gradient(180deg, #f0f7f2 0%, #e4eee6 35%, #f9fbf8 100%)'
            : theme.palette.background.default
      }}
    >
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: `1px solid ${alpha(theme.palette.common.black, isDark ? 0.4 : 0.08)}`,
            backgroundColor: alpha(theme.palette.background.paper, isDark ? 0.98 : 0.96),
            display: 'flex',
            flexDirection: 'column',
            py: 3,
            px: 2.5,
            gap: 2
          }
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{cursor: 'pointer', px: 1}}
          onClick={handleNavigate('/film-rolls')}
        >
          <Box
            component="img"
            src="/icon.png"
            alt="Film Manager logo"
            sx={{width: 40, height: 40, borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.18)'}}
          />
          <Typography variant="h6" sx={{fontWeight: 700, letterSpacing: '0.04em'}}>
            Film Manager
          </Typography>
        </Stack>
        <List sx={{px: 0}}>
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <ListItemButton
                key={item.path}
                selected={active}
                onClick={handleNavigate(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  color: active ? theme.palette.secondary.main : 'text.primary',
                  backgroundColor: activeBackground(active),
                  '&:hover': {
                    backgroundColor: activeHover(active)
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    color: active ? theme.palette.secondary.main : 'inherit',
                    minWidth: 36
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
        </List>
        <Box sx={{flexGrow: 1}} />
        <Divider sx={{borderColor: alpha(theme.palette.common.black, isDark ? 0.4 : 0.12)}} />
        <Stack spacing={1.25} sx={{pt: 2, px: 1}}>
          <Stack spacing={0.25} sx={{alignItems: 'center', textAlign: 'center'}}>
            <Typography variant="body2" fontWeight={600}>
              {user.firstName} {user.lastName}
            </Typography>
            <Typography variant="caption" sx={{color: alpha(theme.palette.text.primary, 0.7)}}>
              {user.email}
            </Typography>
          </Stack>
          <List sx={{p: 0}}>
            <ListItemButton
              onClick={toggle}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main'
              }}
            >
              <ListItemIcon sx={{minWidth: 36, color: 'inherit'}}>
                {isDark ? <LightModeIcon /> : <DarkModeIcon />}
              </ListItemIcon>
              <ListItemText primary={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`} />
            </ListItemButton>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: 2,
                color: theme.palette.error.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.main, 0.08)
                }
              }}
            >
              <ListItemIcon sx={{minWidth: 36, color: 'inherit'}}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </List>
        </Stack>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          py: {xs: 3, sm: 5},
          px: {xs: 3, sm: 6},
          boxSizing: 'border-box'
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            width: '100%',
            maxWidth: 1440,
            mx: 'auto',
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
      </Box>
    </Box>
  );
}
