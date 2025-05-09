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
  { text: 'Payments', icon: <PaymentsIcon />, path: '/admin/payments' },
  { text: 'Ratings', icon: <RatingsIcon />, path: '/admin/ratings' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' },
];

const DashBoard = () => {
  const { getAuthState } = useAuth();
  const [open, setOpen] = useState(true);
  const [selectedItem, setSelectedItem] = useState('Dashboard');

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const renderContent = () => {
    switch(selectedItem) {
      case 'Dashboard':
        return <DashboardStats />;
      case 'Activity':
        return <ActivityList />;
      case 'Users':
        return <Typography>Users content goes here</Typography>;
      case 'Vehicles':
        return <Typography>Vehicles content goes here</Typography>;
      case 'Payments':
        return <Typography>Payments content goes here</Typography>;
      case 'Ratings':
        return <Typography>Ratings content goes here</Typography>;
      case 'Settings':
        return <Typography>Settings content goes here</Typography>;
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
          <Typography variant="h6" noWrap component="div">
            Admin Dashboard
          </Typography>
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
        <Typography variant="h4" gutterBottom>
          {selectedItem}
        </Typography>
        {renderContent()}
      </Main>
    </Box>
  );
};

export default DashBoard;
