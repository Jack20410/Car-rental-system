import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Grid,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Login as LoginIcon,
  Logout as LogoutIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  EventNote as EventIcon,
  AccessTime as TimeIcon,
  Language as IpIcon,
  ImportantDevices as DeviceIcon,
  Star as StarIcon
} from '@mui/icons-material';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/formatCurrency';

// Activity type configuration with colors and icons
const activityTypeConfig = {
  LOGIN: { color: 'primary', icon: <LoginIcon fontSize="small" /> },
  LOGOUT: { color: 'secondary', icon: <LogoutIcon fontSize="small" /> },
  CREATE_RENTAL_ORDER: { color: 'success', icon: <EventIcon fontSize="small" /> },
  UPDATE_RENTAL_ORDER: { color: 'info', icon: <EventIcon fontSize="small" /> },
  CANCEL_RENTAL_ORDER: { color: 'error', icon: <EventIcon fontSize="small" /> },
  UPDATE_CAR_STATUS: { color: 'warning', icon: <CarIcon fontSize="small" /> },
  ADD_CAR: { color: 'success', icon: <CarIcon fontSize="small" /> },
  UPDATE_CAR: { color: 'info', icon: <CarIcon fontSize="small" /> },
  DELETE_CAR: { color: 'error', icon: <CarIcon fontSize="small" /> },
  MAKE_PAYMENT: { color: 'success', icon: <PaymentIcon fontSize="small" /> },
  ADD_RATING: { color: 'info', icon: <StarIcon fontSize="small" /> },
  ADD_REVIEW: { color: 'info', icon: <StarIcon fontSize="small" /> },
};

// Base Timestamp component for all activity types
const TimestampInfo = ({ activity }) => {
  // Always use createdAt as primary timestamp source
  const timestamp = activity.createdAt || activity.timestamp || null;

  return (
    <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: 2 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <TimeIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6">Timestamp Information</Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px' }}>Date:</Typography>
          <Typography variant="body1" fontWeight="medium">{extractDate(timestamp)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px' }}>Time:</Typography>
          <Typography variant="body1" fontWeight="medium">{extractTime(timestamp)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px' }}>IP Address:</Typography>
          <Box display="flex" alignItems="center">
            <IpIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
            <Typography variant="body1">{activity.ipAddress || 'N/A'}</Typography>
          </Box>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" mb={0.5}>User Agent:</Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              maxWidth: '100%', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              bgcolor: 'action.hover',
              p: 1,
              borderRadius: 1,
              fontSize: '0.75rem'
            }}
          >
            {activity.userAgent || 'N/A'}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

// Specialized component for LOGIN activities
const LoginActivitySummary = ({ activity, userDetails, userLoading }) => {
  // Use createdAt consistently
  const timestamp = activity.createdAt || activity.timestamp || null;
  
  return (
    <Paper sx={{ p: 3, mb: 2, borderRadius: 2, boxShadow: 2, bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
      <Box display="flex" alignItems="center" mb={2}>
        <LoginIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6">Login Activity</Typography>
        <Chip
          label="LOGIN"
          size="small"
          icon={<LoginIcon fontSize="small" />}
          color="primary"
          variant="outlined"
          sx={{ ml: 2 }}
        />
      </Box>
      <Divider sx={{ mb: 2 }} />
      
      {/* User information */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
          {userDetails?.fullName?.charAt(0) || <PersonIcon />}
        </Avatar>
        <Box>
          <Typography variant="subtitle1">
            {userLoading
              ? 'Loading...'
              : userDetails && userDetails.fullName
                ? userDetails.fullName
                : 'N/A'}
          </Typography>
          {userDetails?.email && (
            <Typography variant="body2" color="text.secondary">
              {userDetails.email}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Login details */}
      <Paper 
        variant="outlined" 
        sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center">
              <TimeIcon fontSize="small" color="action" sx={{ mr: 1 }} />
              <Typography variant="body2">
                Login Time: {timestamp || 'N/A'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center">
              <IpIcon fontSize="small" color="action" sx={{ mr: 1 }} />
              <Typography variant="body2">
                IP Address: {activity.ipAddress || 'N/A'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Paper>
  );
};

// Specialized component for LOGOUT activities
const LogoutActivitySummary = ({ activity, userDetails, userLoading }) => {
  // Use createdAt consistently
  const timestamp = activity.createdAt || activity.timestamp || null;
  
  return (
    <Paper sx={{ p: 3, mb: 2, borderRadius: 2, boxShadow: 2, bgcolor: 'rgba(156, 39, 176, 0.05)' }}>
      <Box display="flex" alignItems="center" mb={2}>
        <LogoutIcon color="secondary" sx={{ mr: 1 }} />
        <Typography variant="h6">Logout Activity</Typography>
        <Chip
          label="LOGOUT"
          size="small"
          icon={<LogoutIcon fontSize="small" />}
          color="secondary"
          variant="outlined"
          sx={{ ml: 2 }}
        />
      </Box>
      <Divider sx={{ mb: 2 }} />
      
      {/* User information */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
          {userDetails?.fullName?.charAt(0) || <PersonIcon />}
        </Avatar>
        <Box>
          <Typography variant="subtitle1">
            {userLoading
              ? 'Loading...'
              : userDetails && userDetails.fullName
                ? userDetails.fullName
                : 'N/A'}
          </Typography>
          {userDetails?.email && (
            <Typography variant="body2" color="text.secondary">
              {userDetails.email}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Logout details */}
      <Paper 
        variant="outlined" 
        sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center">
              <TimeIcon fontSize="small" color="action" sx={{ mr: 1 }} />
              <Typography variant="body2">
                Logout Time: {timestamp || 'N/A'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center">
              <IpIcon fontSize="small" color="action" sx={{ mr: 1 }} />
              <Typography variant="body2">
                IP Address: {activity.ipAddress || 'N/A'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Paper>
  );
};

// Specialized component for UPDATE_RENTAL_ORDER activities
const RentalOrderTimestampInfo = ({ activity }) => {
  // Always use createdAt as primary timestamp source
  const timestamp = activity.createdAt || activity.timestamp || null;
  
  return (
    <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: 2 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <TimeIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6">Timestamp Information</Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px' }}>Date:</Typography>
          <Typography variant="body1" fontWeight="medium">{extractDate(timestamp)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px' }}>Time:</Typography>
          <Typography variant="body1" fontWeight="medium">{extractTime(timestamp)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px' }}>IP Address:</Typography>
          <Box display="flex" alignItems="center">
            <IpIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
            <Typography variant="body1">{activity.ipAddress || 'N/A'}</Typography>
          </Box>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" mb={0.5}>User Agent:</Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              maxWidth: '100%', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              bgcolor: 'action.hover',
              p: 1,
              borderRadius: 1,
              fontSize: '0.75rem'
            }}
          >
            {activity.userAgent || 'N/A'}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

// Extract date part from ISO string without conversion
const extractDate = (isoString) => {
  if (!isoString) return 'N/A';
  // Extract YYYY-MM-DD from the ISO string
  const datePart = String(isoString).split('T')[0] || String(isoString).split(' ')[0];
  return datePart || 'N/A';
};

// Extract time part from ISO string without conversion
const extractTime = (isoString) => {
  if (!isoString) return 'N/A';
  // Extract HH:MM:SS from the ISO string
  let timePart = String(isoString).split('T')[1] || String(isoString).split(' ')[1];
  // Remove milliseconds and timezone if present
  if (timePart) {
    timePart = timePart.split('.')[0];
  }
  return timePart || 'N/A';
};

// Simply return the raw timestamp without any processing
const getRawTimestamp = (timestamp) => {
  return timestamp || 'N/A';
};

// User information component
const UserInfo = ({ userDetails, userLoading, activity }) => {
  return (
    <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: 2 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <PersonIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6">User Information</Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />
      
      {userLoading ? (
        <Box display="flex" justifyContent="center" my={3}>
          <CircularProgress size={30} />
        </Box>
      ) : userDetails ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              sx={{ 
                width: 60, 
                height: 60, 
                mr: 2, 
                bgcolor: activity.userRole === 'ADMIN' ? 'error.main' : 'primary.main' 
              }}
            >
              {userDetails.fullName?.charAt(0) || <PersonIcon />}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                {userDetails.fullName || 'N/A'}
              </Typography>
              {userDetails.email && (
                <Typography variant="body2" color="text.secondary">
                  {userDetails.email}
                </Typography>
              )}
              <Box sx={{ mt: 1 }}>
                <Chip 
                  label={activity.userRole || 'N/A'} 
                  size="small" 
                  color={activity.userRole === 'ADMIN' ? 'error' : 'primary'}
                  sx={{ fontWeight: 500 }}
                />
              </Box>
            </Box>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px' }}>User ID:</Typography>
            <Typography variant="body2" fontFamily="monospace" bgcolor="action.hover" px={1} py={0.5} borderRadius={1}>
              {String(activity.userId || '')}
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box>
          <Typography variant="body1" color="text.secondary" mb={1}>
            User information unavailable
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px' }}>User ID:</Typography>
              <Typography variant="body2" fontFamily="monospace" bgcolor="action.hover" px={1} py={0.5} borderRadius={1}>
                {String(activity.userId || '')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px' }}>Role:</Typography>
              <Chip 
                label={activity.userRole || 'N/A'} 
                size="small" 
                color={activity.userRole === 'ADMIN' ? 'error' : 'primary'}
                variant="outlined"
              />
            </Box>
          </Box>
          <Alert severity="info" sx={{ mt: 3 }}>
            Detailed user information unavailable
          </Alert>
        </Box>
      )}
    </Paper>
  );
};

// Activity summary component for rental updates
const RentalActivitySummary = ({ activity, vehicleDetails, vehicleLoading, customerDetails, customerLoading }) => {
  const config = activityTypeConfig[activity.activityType] || { color: 'default', icon: <EventIcon /> };
  
  return (
    <Paper sx={{ 
      p: 3, 
      mb: 2, 
      borderRadius: 2, 
      boxShadow: 2, 
      bgcolor: `${config.color}.light`, 
      borderLeft: 3, 
      borderColor: `${config.color}.main`
    }}>
      <Box display="flex" alignItems="center" mb={2}>
        {React.cloneElement(config.icon, { color: config.color })} 
        <Typography variant="h6" sx={{ ml: 1 }}>
          {String(activity.activityType || '').replace(/_/g, ' ')}
        </Typography>
        <Chip
          label={activity.activityType}
          size="small"
          icon={config.icon}
          color={config.color}
          sx={{ ml: 2 }}
        />
      </Box>
      <Divider sx={{ mb: 2 }} />
      
      {/* Customer and Vehicle info */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              src={`http://localhost:3001${customerDetails?.avatar}`} 
              sx={{ 
                mr: 2, 
                bgcolor: 'primary.main', 
                width: 36, 
                height: 36 
              }}
            >
              {customerDetails?.fullName?.charAt(0) || <PersonIcon fontSize="small" />}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Customer</Typography>
              {customerLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2">Loading...</Typography>
                </Box>
              ) : (
                <>
                  <Typography variant="body1" fontWeight="medium">
                    {customerDetails?.fullName || 'N/A'}
                  </Typography>
                  {customerDetails?.email && (
                    <Typography variant="caption" color="text.secondary">
                      {customerDetails.email}
                    </Typography>
                  )}
                </>
              )}
            </Box>
          </Box>
        </Grid>
        
        {activity.details && activity.details.vehicleId && (
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ mr: 2, bgcolor: 'info.main', width: 36, height: 36 }}>
                <CarIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Vehicle</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {vehicleLoading
                    ? 'Loading...'
                    : vehicleDetails && vehicleDetails.name
                      ? `${vehicleDetails.name}${vehicleDetails.brand ? ' (' + vehicleDetails.brand + ')' : ''}`
                      : 'N/A'}
                </Typography>
                {!vehicleLoading && vehicleDetails && vehicleDetails.car_providerId && vehicleDetails.car_providerId.fullName && (
                  <Typography variant="body2" color="text.secondary">
                    Provider: {vehicleDetails.car_providerId.fullName}
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Format rental details */}
      {activity.details && (
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2, 
            borderRadius: 1, 
            bgcolor: 'background.paper', 
            borderColor: `${config.color}.main`,
          }}
        >
          <Typography variant="subtitle2" gutterBottom color={`${config.color}.main`}>
            Rental Details
          </Typography>
          
          <Grid container spacing={2}>
            {activity.details.startDate && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Start Date:</Typography>
                <Typography variant="body1">{activity.details.startDate}</Typography>
              </Grid>
            )}
            
            {activity.details.endDate && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">End Date:</Typography>
                <Typography variant="body1">{activity.details.endDate}</Typography>
              </Grid>
            )}
            
            {activity.details.totalPrice && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Total Price:</Typography>
                <Typography variant="body1" fontWeight="bold" color={`${config.color}.main`}>
                  {formatCurrency(activity.details.totalPrice)}
                </Typography>
              </Grid>
            )}
            
            {activity.details.rentalType && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Rental Type:</Typography>
                <Chip 
                  label={activity.details.rentalType.charAt(0).toUpperCase() + activity.details.rentalType.slice(1)} 
                  size="small"
                  color={config.color}
                  variant="outlined"
                />
              </Grid>
            )}
            
            {activity.details.oldStatus && activity.details.newStatus && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Status Change:</Typography>
                <Box display="flex" alignItems="center" mt={0.5}>
                  <Chip 
                    label={activity.details.oldStatus} 
                    size="small" 
                    color="default"
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2" sx={{ mx: 1 }}>→</Typography>
                  <Chip 
                    label={activity.details.newStatus} 
                    size="small"
                    color={config.color}
                  />
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}
    </Paper>
  );
};

// Generic activity summary for other activity types
const GenericActivitySummary = ({ activity, userDetails, userLoading, vehicleDetails, vehicleLoading }) => {
  // Function to format value based on type
  const formatValue = (key, value) => {
    if (key.toLowerCase().includes('price') || key.toLowerCase().includes('amount') || key.toLowerCase().includes('payment')) {
      return formatCurrency(value);
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    // Return timestamp values as-is
    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
      return value;
    }
    
    return value;
  };

  const config = activityTypeConfig[activity.activityType] || { color: 'default', icon: <EventIcon /> };

  return (
    <Paper sx={{ 
      p: 3, 
      mb: 2, 
      borderRadius: 2, 
      boxShadow: 2,
      borderLeft: 3,
      borderColor: `${config.color}.main`,
    }}>
      <Box display="flex" alignItems="center" mb={2}>
        {React.cloneElement(config.icon, { color: config.color })}
        <Typography variant="h6" sx={{ ml: 1 }}>
          {String(activity.activityType || '').replace(/_/g, ' ')}
        </Typography>
        <Chip
          label={activity.activityType}
          size="small"
          icon={config.icon}
          color={config.color}
          sx={{ ml: 2 }}
        />
      </Box>
      <Divider sx={{ mb: 2 }} />
      
      <Grid container spacing={2}>
        {/* User information */}
        {activity.userId && (
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 36, height: 36 }}>
                {userDetails?.fullName?.charAt(0) || <PersonIcon fontSize="small" />}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">User</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {userLoading
                    ? 'Loading...'
                    : userDetails && userDetails.fullName
                      ? userDetails.fullName
                      : 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Grid>
        )}

        {/* Vehicle information */}
        {activity.details && activity.details.vehicleId && (
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ mr: 2, bgcolor: 'info.main', width: 36, height: 36 }}>
                <CarIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Vehicle</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {vehicleLoading
                    ? 'Loading...'
                    : vehicleDetails && vehicleDetails.name
                      ? `${vehicleDetails.name}${vehicleDetails.brand ? ' (' + vehicleDetails.brand + ')' : ''}`
                      : 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Generic details display */}
      {activity.details && Object.keys(activity.details).length > 0 && (
        <Paper 
          variant="outlined" 
          sx={{ mt: 2, p: 2, borderRadius: 1, bgcolor: 'background.paper' }}
        >
          <Typography variant="subtitle2" gutterBottom color={`${config.color}.main`}>
            Activity Details
          </Typography>
          
          <Grid container spacing={2}>
            {Object.entries(activity.details)
              .filter(([key]) => !['userId', 'vehicleId'].includes(key))
              .map(([key, value]) => {
                // Skip complex objects
                if (typeof value === 'object' && value !== null) return null;
                
                // Format the key for display
                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                
                // Get the formatted value
                const formattedValue = formatValue(key, value);
                
                return (
                  <Grid item xs={12} sm={6} key={key}>
                    <Typography variant="body2" color="text.secondary">{formattedKey}:</Typography>
                    <Typography variant="body1">{formattedValue}</Typography>
                  </Grid>
                );
              })}
          </Grid>
        </Paper>
      )}
    </Paper>
  );
};

const ActivityDetail = ({ activity, open, onClose }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [rentalDetails, setRentalDetails] = useState(null);
  const [rentalLoading, setRentalLoading] = useState(false);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [customerLoading, setCustomerLoading] = useState(false);

  useEffect(() => {
    // Log the activity structure to debug
    console.log('Activity:', activity);
    console.log('Activity details:', activity?.details);
    
    // Check for userId at both top level and in details
    const userId = activity?.userId || (activity?.details?.userId);
    if (userId) {
      console.log('Fetching user with ID:', userId);
      fetchUserDetails(userId);
    }
    
    // Check for vehicleId in details
    if (activity?.details?.vehicleId) {
      console.log('Fetching vehicle with ID:', activity.details.vehicleId);
      fetchVehicleDetails(activity.details.vehicleId);
    }

    // For UPDATE_RENTAL_ORDER, fetch rental details to get customer info
    if (activity?.activityType === 'UPDATE_RENTAL_ORDER' && activity?.details?.rentalId) {
      console.log('Fetching rental with ID:', activity.details.rentalId);
      fetchRentalDetails(activity.details.rentalId);
    }
  }, [activity]);

  const fetchUserDetails = async (userId) => {
    setUserLoading(true);
    try {
      console.log(`Fetching user with URL: /users/${userId}`);
      const response = await api.get(`/users/${userId}`);
      console.log('User API response:', response.data);
      if (response.data.success) {
        setUserDetails(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      setUserDetails(null);
    } finally {
      setUserLoading(false);
    }
  };

  const fetchVehicleDetails = async (vehicleId) => {
    setVehicleLoading(true);
    try {
      console.log(`Fetching vehicle with URL: /vehicles/${vehicleId}`);
      const response = await api.get(`/vehicles/${vehicleId}`);
      console.log('Vehicle API response:', response.data);
      if (response.data && response.data.data) {
        setVehicleDetails(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching vehicle details:', err);
      setVehicleDetails(null);
    } finally {
      setVehicleLoading(false);
    }
  };

  const fetchRentalDetails = async (rentalId) => {
    setRentalLoading(true);
    try {
      console.log(`Fetching rental with URL: /rentals/${rentalId}`);
      const response = await api.get(`/rentals/${rentalId}`);
      console.log('Rental API response:', response.data);
      
      if (response.data && response.data.data) {
        setRentalDetails(response.data.data);
        
        // If rental contains customer info, fetch customer details
        if (response.data.data.userId) {
          console.log('Found userId in rental:', response.data.data.userId);
          await fetchCustomerDetails(response.data.data.userId);
        } else if (response.data.data.customerId) {  // Fallback to customerId if userId is not present
          console.log('Found customerId in rental:', response.data.data.customerId);
          await fetchCustomerDetails(response.data.data.customerId);
        }
      }
    } catch (err) {
      console.error('Error fetching rental details:', err);
      setRentalDetails(null);
    } finally {
      setRentalLoading(false);
    }
  };

  const fetchCustomerDetails = async (customerId) => {
    setCustomerLoading(true);
    try {
      console.log(`Fetching customer with URL: /users/${customerId}`);
      const response = await api.get(`/users/${customerId}`);
      console.log('Customer API response:', response.data);
      
      if (response.data && response.data.success) {
        const customerData = response.data.data;
        console.log('Setting customer details:', customerData);
        setCustomerDetails({
          fullName: customerData.name || customerData.fullName || 'N/A',
          email: customerData.email || 'N/A',
          role: customerData.role || 'customer',
          avatar: customerData.avatar || null
        });
      }
    } catch (err) {
      console.error('Error fetching customer details:', err);
      setCustomerDetails(null);
    } finally {
      setCustomerLoading(false);
    }
  };

  if (!activity) return null;

  // Render different components based on activity type
  const renderActivitySummary = () => {
    switch(activity.activityType) {
      case 'LOGIN':
        return (
          <LoginActivitySummary 
            activity={activity}
            userDetails={userDetails}
            userLoading={userLoading}
          />
        );
      case 'LOGOUT':
        return (
          <LogoutActivitySummary 
            activity={activity}
            userDetails={userDetails}
            userLoading={userLoading}
          />
        );
      case 'UPDATE_RENTAL_ORDER':
        return (
          <RentalActivitySummary 
            activity={activity}
            vehicleDetails={vehicleDetails}
            vehicleLoading={vehicleLoading}
            customerDetails={customerDetails}
            customerLoading={customerLoading}
          />
        );
      default:
        return (
          <GenericActivitySummary 
            activity={activity}
            userDetails={userDetails}
            userLoading={userLoading}
            vehicleDetails={vehicleDetails}
            vehicleLoading={vehicleLoading}
          />
        );
    }
  };

  // Render different timestamp components based on activity type
  const renderTimestampInfo = () => {
    if (activity.activityType === 'UPDATE_RENTAL_ORDER') {
      return <RentalOrderTimestampInfo activity={activity} />;
    }
    
    return <TimestampInfo activity={activity} />;
  };

  const config = activityTypeConfig[activity.activityType] || { color: 'default', icon: <EventIcon /> };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: `${config.color}.light`, 
        display: 'flex', 
        alignItems: 'center',
        p: 2
      }}>
        {React.cloneElement(config.icon, { color: config.color })}
        <Typography variant="h6" sx={{ ml: 1, fontWeight: 500 }}>
          Activity Details
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'text.secondary'
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {renderActivitySummary()}
          </Grid>

          <Grid item xs={12} sm={6}>
            {renderTimestampInfo()}
          </Grid>

          <Grid item xs={12} sm={6}>
            <UserInfo 
              userDetails={userDetails} 
              userLoading={userLoading} 
              activity={activity} 
            />
          </Grid>
          
          {activity.metadata && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <EventIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Additional Metadata</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <pre style={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.03)', 
                  padding: '12px', 
                  borderRadius: '8px',
                  overflow: 'auto',
                  maxHeight: '200px',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem'
                }}>
                  {JSON.stringify(activity.metadata, null, 2)}
                </pre>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: 'background.default' }}>
        <Button 
          onClick={onClose} 
          variant="contained" 
          color={config.color}
          startIcon={<CloseIcon />}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActivityDetail; 