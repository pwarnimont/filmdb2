import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery
} from '@mui/material';
import {alpha, useTheme} from '@mui/material/styles';
import {useContext, useEffect, useState} from 'react';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import MovieFilterIcon from '@mui/icons-material/MovieFilterOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshopOutlined';
import MenuIcon from '@mui/icons-material/MenuOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PhotoCameraIcon from '@mui/icons-material/PhotoCameraOutlined';
import {Outlet, useLocation, useNavigate} from 'react-router-dom';

import ThemeModeContext from '../contexts/ThemeModeContext';
import {useAuth} from '../providers/AuthProvider';
export function AppLayout() {
  const {user, logout} = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const isMobile = !isDesktop;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
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
    if (!isDesktop) {
      setMobileOpen(false);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    await logout();
    if (!isDesktop) {
      setMobileOpen(false);
    }
    navigate('/login');
  };

  useEffect(() => {
    if (!isDesktop) {
      setIsNavCollapsed(false);
    }
  }, [isDesktop]);

  const toggleNavCollapse = () => {
    setIsNavCollapsed((prev) => !prev);
  };

  if (!user) {
    return <Outlet />;
  }

  const isActive = (path: string) => location.pathname.startsWith(path);
  const drawerWidth = isNavCollapsed ? 90 : 272;
  const drawerPaperStyles = {
    width: drawerWidth,
    boxSizing: 'border-box',
    borderRight: `1px solid ${alpha(theme.palette.common.black, isDark ? 0.4 : 0.08)}`,
    backgroundColor: alpha(theme.palette.background.paper, isDark ? 0.98 : 0.96),
    display: 'flex',
    flexDirection: 'column',
    alignItems: isNavCollapsed ? 'center' : 'stretch',
    py: 3,
    px: isNavCollapsed ? 1.25 : 2.5,
    gap: 2
  };

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
      label: 'Cameras',
      path: '/cameras',
      icon: <PhotoCameraIcon />
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

  const textVisibilityStyles = {
    opacity: isNavCollapsed ? 0 : 1,
    maxWidth: isNavCollapsed ? 0 : '100%',
    overflow: 'hidden',
    transition: 'opacity 160ms ease',
    whiteSpace: 'nowrap'
  };

  const drawerContent = (
    <Stack spacing={2} sx={{height: '100%'}}>
      <Stack
        spacing={1}
        sx={{
          px: isNavCollapsed ? 0 : 1,
          width: '100%',
          alignItems: isNavCollapsed ? 'center' : 'stretch'
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={isNavCollapsed ? 0 : 1.5}
          onClick={handleNavigate('/film-rolls')}
          sx={{
            flexGrow: 1,
            justifyContent: isNavCollapsed ? 'center' : 'flex-start',
            width: '100%',
            cursor: 'pointer'
          }}
        >
          <Box
            component="img"
            src="/icon.png"
            alt="Film Manager logo"
            sx={{width: 40, height: 40, borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.18)'}}
          />
          <Typography variant="h6" sx={{fontWeight: 700, letterSpacing: '0.04em', ...textVisibilityStyles}}>
            Film Manager
          </Typography>
        </Stack>
        {!isMobile && (
          <Tooltip title={isNavCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <IconButton
              onClick={toggleNavCollapse}
              size="small"
              sx={{
                ml: isNavCollapsed ? 0 : 1,
                alignSelf: isNavCollapsed ? 'center' : 'flex-start',
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`
              }}
            >
              {isNavCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Tooltip>
        )}
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
                justifyContent: isNavCollapsed ? 'center' : 'flex-start',
                '&:hover': {
                  backgroundColor: activeHover(active)
                }
              }}
            >
              <ListItemIcon
                sx={{
                  color: active ? theme.palette.secondary.main : 'inherit',
                  minWidth: isNavCollapsed ? 0 : 36,
                  mr: isNavCollapsed ? 0 : 1.5,
                  justifyContent: 'center'
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} sx={textVisibilityStyles} />
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={{flexGrow: 1}} />
      <Divider sx={{borderColor: alpha(theme.palette.common.black, isDark ? 0.4 : 0.12)}} />
      <Stack spacing={1.25} sx={{pt: 2, px: isNavCollapsed ? 0 : 1, width: '100%', alignItems: isNavCollapsed ? 'center' : 'stretch'}}>
        <Stack spacing={0.25} sx={{alignItems: 'center', textAlign: 'center', width: '100%'}}>
          <Typography variant="body2" fontWeight={600} sx={textVisibilityStyles}>
            {user.firstName} {user.lastName}
          </Typography>
          <Typography
            variant="caption"
            sx={{color: alpha(theme.palette.text.primary, 0.7), ...textVisibilityStyles}}
          >
            {user.email}
          </Typography>
        </Stack>
        <List sx={{p: 0, width: '100%'}}>
          <ListItemButton
            onClick={toggle}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main',
              justifyContent: isNavCollapsed ? 'center' : 'flex-start'
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: isNavCollapsed ? 0 : 36,
                mr: isNavCollapsed ? 0 : 1,
                color: 'inherit',
                justifyContent: 'center'
              }}
            >
              {isDark ? <LightModeIcon /> : <DarkModeIcon />}
            </ListItemIcon>
            <ListItemText primary={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`} sx={textVisibilityStyles} />
          </ListItemButton>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              color: theme.palette.error.main,
              justifyContent: isNavCollapsed ? 'center' : 'flex-start',
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.08)
              }
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: isNavCollapsed ? 0 : 36,
                mr: isNavCollapsed ? 0 : 1,
                color: 'inherit',
                justifyContent: 'center'
              }}
            >
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" sx={textVisibilityStyles} />
          </ListItemButton>
        </List>
      </Stack>
    </Stack>
  );

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
      {isMobile && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            display: {xs: 'flex', md: 'none'},
            backgroundColor: alpha(theme.palette.background.paper, isDark ? 0.92 : 0.9),
            borderBottom: `1px solid ${alpha(theme.palette.common.black, isDark ? 0.4 : 0.08)}`,
            backdropFilter: 'blur(14px)'
          }}
        >
          <Toolbar sx={{display: 'flex', justifyContent: 'space-between', gap: 1}}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{mr: 1}}>
                <MenuIcon />
              </IconButton>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{cursor: 'pointer'}}
                onClick={handleNavigate('/film-rolls')}
              >
                <Box
                  component="img"
                  src="/icon.png"
                  alt="Film Manager logo"
                  sx={{width: 36, height: 36, borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.18)'}}
                />
                <Typography variant="h6" sx={{fontWeight: 700, letterSpacing: '0.04em'}}>
                  Film Manager
                </Typography>
              </Stack>
            </Stack>
            <IconButton
              onClick={toggle}
              color="inherit"
              sx={{color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main'}}
            >
              {isDark ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Toolbar>
        </AppBar>
      )}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{keepMounted: true}}
        sx={{
          display: {xs: 'block', md: 'none'},
          '& .MuiDrawer-paper': drawerPaperStyles
        }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: {xs: 'none', md: 'block'},
          flexShrink: 0,
          '& .MuiDrawer-paper': drawerPaperStyles
        }}
        open
      >
        {drawerContent}
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          py: {xs: 2.5, sm: 5},
          px: {xs: 3, sm: 6},
          boxSizing: 'border-box',
          width: '100%'
        }}
      >
        {isMobile && <Toolbar sx={{mb: 2, display: {xs: 'flex', md: 'none'}}} />}
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
