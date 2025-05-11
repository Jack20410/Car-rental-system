import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Timeline as ActivityIcon,
  People as UsersIcon,
  DirectionsCar as VehiclesIcon,
  Payment as PaymentsIcon,
  Star as RatingsIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import ActivityList from '../../components/admin/ActivityList';
import DashboardStats from '../../components/admin/DashboardStats';
import UserManagement from '../../components/admin/UserManagement';
import VehicleManagement from '../../components/admin/VehicleManagement';
import RatingManagement from '../../components/admin/RatingManagement';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
);

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
  { text: 'Activity', icon: <ActivityIcon />, path: '/admin/activity' },
  { text: 'Users', icon: <UsersIcon />, path: '/admin/users' },
  { text: 'Vehicles', icon: <VehiclesIcon />, path: '/admin/vehicles' },
  { text: 'Ratings', icon: <RatingsIcon />, path: '/admin/ratings' },
];

const DashBoard = () => {
  const { getAuthState, logout } = useAuth();
  const [open, setOpen] = useState(true);
  const [selectedItem, setSelectedItem] = useState('Dashboard');
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderContent = () => {
    switch(selectedItem) {
      case 'Dashboard':
        return <DashboardStats />;
      case 'Activity':
        return <ActivityList />;
      case 'Users':
        return <UserManagement />;
      case 'Vehicles':
        return <VehicleManagement />;
      case 'Ratings':
        return <RatingManagement />;
      default:
        return <DashboardStats />;
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Log Out
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader />
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={selectedItem === item.text}
                onClick={() => setSelectedItem(item.text)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Main open={open}>
        <DrawerHeader />
        {renderContent()}
      </Main>
    </Box>
  );
};

export default DashBoard;
