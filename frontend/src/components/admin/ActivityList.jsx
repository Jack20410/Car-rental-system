import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Pagination,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Timeline as ActivityIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  ShoppingCart as PurchaseIcon,
  DirectionsCar as VehiclesIcon,
  Payment as PaymentsIcon,
  Star as RatingsIcon,
  Build as UpdateIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import api from '../../utils/api';
import ActivityDetail from './ActivityDetail';

const activityTypeColors = {
  LOGIN: 'primary',
  LOGOUT: 'secondary',
  CREATE_RENTAL_ORDER: 'success',
  UPDATE_RENTAL_ORDER: 'info',
  CANCEL_RENTAL_ORDER: 'error',
  UPDATE_CAR_STATUS: 'warning',
  ADD_CAR: 'success',
  UPDATE_CAR: 'info',
  DELETE_CAR: 'error',
  MAKE_PAYMENT: 'success',
  ADD_RATING: 'info',
  ADD_REVIEW: 'info',
};

const activityTypeGroups = {
  authentication: ['LOGIN', 'LOGOUT'],
  rental: ['CREATE_RENTAL_ORDER', 'UPDATE_RENTAL_ORDER', 'CANCEL_RENTAL_ORDER'],
  vehicle: ['UPDATE_CAR_STATUS', 'ADD_CAR', 'UPDATE_CAR', 'DELETE_CAR'],
  payment: ['MAKE_PAYMENT'],
  feedback: ['ADD_RATING', 'ADD_REVIEW'],
};

const ActivityList = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activityFilter, setActivityFilter] = useState('all');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [activityTab, setActivityTab] = useState('all');
  const [selectedActivity, setSelectedActivity] = useState(null);

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/admin/activities?page=${page}&limit=10`;
      if (activityFilter !== 'all') url += `&activityType=${activityFilter}`;
      if (userRoleFilter !== 'all') url += `&userRole=${userRoleFilter}`;
      
      console.log('Fetching activities from:', url);
      const response = await api.get(url);
      console.log('Activities API response:', response);
      
      const data = response.data;
      
      if (data && data.success) {
        // Ensure data.data is an array
        if (Array.isArray(data.data)) {
          console.log('Setting activities array:', data.data);
          setActivities(data.data);
        } else {
          console.warn('API returned non-array data:', data.data);
          setActivities([]);
        }
        
        // Set pagination
        if (data.pagination && typeof data.pagination.pages === 'number') {
          setTotalPages(data.pagination.pages);
        } else {
          setTotalPages(1);
        }
      } else {
        throw new Error((data && data.message) || 'Failed to fetch activities');
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err.message || 'An error occurred while fetching activities');
      setActivities([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [page, activityFilter, userRoleFilter]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleActivityTabChange = (event, newValue) => {
    setActivityTab(newValue);
    if (newValue === 'all') {
      setActivityFilter('all');
    } else {
      // When a group tab is selected, we don't immediately set a specific filter
      setActivityFilter('all');
    }
    setPage(1);
  };

  const getFilteredActivities = () => {
    // Ensure activities is an array
    if (!Array.isArray(activities)) {
      return [];
    }
    
    // Filter out invalid activities
    const validActivities = activities.filter(activity => 
      activity && typeof activity === 'object'
    );
    
    // If both activity filter and tab are 'all', return all valid activities
    if (activityTab === 'all' && activityFilter === 'all') {
      return validActivities;
    }
    
    // If a specific tab is selected but filter is 'all', return activities for that tab group
    if (activityTab !== 'all' && activityFilter === 'all') {
      const activityTypesInGroup = activityTypeGroups[activityTab] || [];
      return validActivities.filter(activity => 
        activity.activityType && activityTypesInGroup.includes(activity.activityType)
      );
    }
    
    // If a specific filter is selected, use that filter regardless of tab
    return validActivities.filter(activity => 
      activity.activityType === activityFilter
    );
  };

  const handleActivityClick = (activity) => {
    setSelectedActivity(activity);
  };

  const handleCloseDetail = () => {
    setSelectedActivity(null);
  };

  if (loading && activities.length === 0) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && activities.length === 0) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  const filteredActivities = getFilteredActivities();

  return (
    <>
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activityTab}
          onChange={handleActivityTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="activity categories"
        >
          <Tab label="All Activities" value="all" icon={<ActivityIcon />} iconPosition="start" />
          <Tab label="Authentication" value="authentication" icon={<LoginIcon />} iconPosition="start" />
          <Tab label="Rentals" value="rental" icon={<PurchaseIcon />} iconPosition="start" />
          <Tab label="Vehicles" value="vehicle" icon={<VehiclesIcon />} iconPosition="start" />
          <Tab label="Payments" value="payment" icon={<PaymentsIcon />} iconPosition="start" />
          <Tab label="Feedback" value="feedback" icon={<RatingsIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Activity Type</InputLabel>
          <Select
            value={activityFilter}
            label="Activity Type"
            onChange={(e) => setActivityFilter(e.target.value)}
          >
            <MenuItem value="all">All Activities</MenuItem>
            {activityTab === 'all' 
              ? Object.keys(activityTypeColors).map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </MenuItem>
                ))
              : activityTypeGroups[activityTab].map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </MenuItem>
                ))
            }
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>User Role</InputLabel>
          <Select
            value={userRoleFilter}
            label="User Role"
            onChange={(e) => setUserRoleFilter(e.target.value)}
          >
            <MenuItem value="all">All Roles</MenuItem>
            <MenuItem value="customer">Customer</MenuItem>
            <MenuItem value="car_provider">Car Provider</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {filteredActivities.length === 0 ? (
        <Alert severity="info" sx={{ my: 2 }}>
          No activities found with the selected filters.
        </Alert>
      ) : (
        <Box sx={{ mt: 2 }}>
          {filteredActivities.map((activity, index) => (
            <Paper
              key={index}
              sx={{
                p: 2,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: 3,
                  bgcolor: 'rgba(0, 0, 0, 0.02)'
                }
              }}
              onClick={() => handleActivityClick(activity)}
            >
              {activity.activityType && activity.activityType.includes('LOGIN') ? (
                <LoginIcon color={activityTypeColors[activity.activityType] || 'primary'} />
              ) : activity.activityType && activity.activityType.includes('LOGOUT') ? (
                <LogoutIcon color={activityTypeColors[activity.activityType] || 'secondary'} />
              ) : activity.activityType && activity.activityType.includes('ADD') ? (
                <PurchaseIcon color={activityTypeColors[activity.activityType] || 'success'} />
              ) : activity.activityType && activity.activityType.includes('UPDATE') ? (
                <UpdateIcon color={activityTypeColors[activity.activityType] || 'info'} />
              ) : activity.activityType && (activity.activityType.includes('DELETE') || activity.activityType.includes('CANCEL')) ? (
                <DeleteIcon color={activityTypeColors[activity.activityType] || 'error'} />
              ) : (
                <ActivityIcon color={activity.activityType ? activityTypeColors[activity.activityType] || 'primary' : 'primary'} />
              )}
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="body1">
                    {String(activity.details || '')}
                  </Typography>
                  <Chip
                    label={activity.activityType ? activity.activityType.replace(/_/g, ' ') : 'Unknown'}
                    size="small"
                    color={activity.activityType ? activityTypeColors[activity.activityType] || 'default' : 'default'}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Unknown time'}
                  </Typography>
                  <Chip
                    label={activity.userRole}
                    size="small"
                    variant="outlined"
                  />
                  <Typography variant="caption" color="text.secondary">
                    User ID: {String(activity.userId || '')}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>

      {selectedActivity && (
        <ActivityDetail 
          activity={selectedActivity} 
          open={Boolean(selectedActivity)} 
          onClose={handleCloseDetail} 
        />
      )}
    </>
  );
};

export default ActivityList; 