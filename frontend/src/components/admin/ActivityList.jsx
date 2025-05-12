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
  Avatar,
  Divider,
  Badge,
  Grid,
  Card,
  CardContent,
  Stack,
  alpha,
  useTheme,
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
  AccessTime as TimeIcon,
  Person as PersonIcon,
  EventNote as EventIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import api from '../../utils/api';
import ActivityDetail from './ActivityDetail';

// Activity type configuration with colors and icons
const activityTypeConfig = {
  LOGIN: { color: 'primary', icon: <LoginIcon fontSize="small" /> },
  LOGOUT: { color: 'secondary', icon: <LogoutIcon fontSize="small" /> },
  CREATE_RENTAL_ORDER: { color: 'success', icon: <EventIcon fontSize="small" /> },
  UPDATE_RENTAL_ORDER: { color: 'info', icon: <EventIcon fontSize="small" /> },
  CANCEL_RENTAL_ORDER: { color: 'error', icon: <EventIcon fontSize="small" /> },
  UPDATE_CAR_STATUS: { color: 'warning', icon: <VehiclesIcon fontSize="small" /> },
  ADD_CAR: { color: 'success', icon: <VehiclesIcon fontSize="small" /> },
  UPDATE_CAR: { color: 'info', icon: <VehiclesIcon fontSize="small" /> },
  DELETE_CAR: { color: 'error', icon: <VehiclesIcon fontSize="small" /> },
  MAKE_PAYMENT: { color: 'success', icon: <PaymentsIcon fontSize="small" /> },
  ADD_RATING: { color: 'info', icon: <RatingsIcon fontSize="small" /> },
  ADD_REVIEW: { color: 'info', icon: <RatingsIcon fontSize="small" /> },
};

const activityTypeGroups = {
  authentication: ['LOGIN', 'LOGOUT'],
  rental: ['CREATE_RENTAL_ORDER', 'UPDATE_RENTAL_ORDER', 'CANCEL_RENTAL_ORDER'],
  vehicle: ['UPDATE_CAR_STATUS', 'ADD_CAR', 'UPDATE_CAR', 'DELETE_CAR'],
  payment: ['MAKE_PAYMENT'],
  feedback: ['ADD_RATING', 'ADD_REVIEW'],
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Unknown time';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    // Format to readable date and time
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (error) {
    return 'Invalid date';
  }
};

// Activity card component for individual activity items
const ActivityCard = ({ activity, onClick }) => {
  const config = activityTypeConfig[activity.activityType] || { color: 'default', icon: <ActivityIcon /> };
  
  // Extract user role for styling
  const userRole = activity.userRole || 'unknown';
  
  // Format timestamp
  const timestamp = formatTimestamp(activity.timestamp || activity.createdAt);
  
  return (
    <Card 
      elevation={1}
      sx={{
        mb: 2,
        cursor: 'pointer',
        transition: 'all 0.2s',
        borderLeft: 3,
        borderColor: `${config.color}.main`,
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
        }
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Avatar 
              sx={{ 
                bgcolor: `${config.color}.light`, 
                color: `${config.color}.main`,
                width: 40,
                height: 40,
              }}
            >
              {React.cloneElement(config.icon, { fontSize: 'small' })}
            </Avatar>
          </Grid>
          
          <Grid item xs>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {activity.activityType 
                    ? activity.activityType.replace(/_/g, ' ') 
                    : 'Unknown Activity'}
                </Typography>
                <Chip
                  label={activity.activityType ? activity.activityType.replace(/_/g, ' ') : 'Unknown'}
                  size="small"
                  color={config.color}
                  sx={{ fontWeight: 500 }}
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activity.details && typeof activity.details === 'object'
                  ? (() => {
                      const entries = Object.entries(activity.details).slice(0, 2);
                      return '{ ' + entries.map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v).substring(0, 30) : String(v).substring(0, 30)}`).join(', ') + (Object.keys(activity.details).length > 2 ? ', ...' : '') + ' }';
                    })()
                  : String(activity.details || '')}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TimeIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  {timestamp}
                </Typography>
              </Box>
              
              <Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto' }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                <Chip
                  label={userRole}
                  size="small"
                  variant="outlined"
                  color={userRole === 'admin' ? 'error' : userRole === 'car_provider' ? 'info' : 'primary'}
                />
              </Box>
              
              <Typography variant="caption" color="text.secondary">
                ID: {String(activity.userId || '').substring(0, 8)}...
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

const ActivityList = () => {
  const theme = useTheme();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activityFilter, setActivityFilter] = useState('all');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [activityTab, setActivityTab] = useState('all');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [totalActivitiesCount, setTotalActivitiesCount] = useState(0);
  const [activityTypeCounts, setActivityTypeCounts] = useState({
    authentication: 0,
    rental: 0,
    vehicle: 0,
    payment: 0,
    feedback: 0
  });

  const fetchActivityCounts = async () => {
    try {
      // Get total count for all activities
      const allResponse = await api.get(`/api/admin/activities?page=1&limit=1`);
      const totalCount = allResponse.data.pagination?.total || 0;
      setTotalActivitiesCount(totalCount);
      
      // Get counts for each category by querying each activity type
      const categoryCounts = {
        authentication: 0,
        rental: 0,
        vehicle: 0,
        payment: 0,
        feedback: 0
      };
      
      // Create an array of promises for all activity type count queries
      const countPromises = [];
      
      // For each category and its activity types
      Object.entries(activityTypeGroups).forEach(([category, activityTypes]) => {
        // For each activity type in this category
        activityTypes.forEach(activityType => {
          // Create a promise for this activity type query
          const promise = api.get(`/api/admin/activities?page=1&limit=1&activityType=${activityType}`)
            .then(response => {
              const typeCount = response.data.pagination?.total || 0;
              // Add this count to the category total
              categoryCounts[category] += typeCount;
            })
            .catch(err => {
              console.error(`Error fetching count for ${activityType}:`, err);
            });
          
          countPromises.push(promise);
        });
      });
      
      // Wait for all count queries to complete
      await Promise.all(countPromises);
      
      // Update state with the counts
      setActivityTypeCounts(categoryCounts);
    } catch (err) {
      console.error('Error fetching activity counts:', err);
    }
  };

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
        if (data.pagination) {
          if (typeof data.pagination.pages === 'number') {
            setTotalPages(data.pagination.pages);
          } else {
            setTotalPages(1);
          }
          
          // Set total count
          if (typeof data.pagination.total === 'number') {
            setTotalActivitiesCount(data.pagination.total);
          }
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
    // Fetch activity counts when component mounts
    fetchActivityCounts();
  }, []);

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

  // Get count of activities per tab for badges
  const getCategoryCount = (category) => {
    if (category === 'all') {
      return totalActivitiesCount;
    }
    
    return activityTypeCounts[category] || 0;
  };

  const filteredActivities = getFilteredActivities();

  return (
    <>
      {/* Main Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Activity Log
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor and review all system activities in real-time
        </Typography>
      </Box>
      
      {/* Activity Tabs */}
      <Paper 
        elevation={2} 
        sx={{ 
          mb: 3, 
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <Tabs
          value={activityTab}
          onChange={handleActivityTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="activity categories"
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              fontWeight: 500,
            },
            '& .Mui-selected': {
              fontWeight: 600,
            },
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Tab 
            label="All Activities" 
            value="all" 
            icon={
              <Badge badgeContent={getCategoryCount('all')} color="primary" max={999}>
                <ActivityIcon />
              </Badge>
            } 
            iconPosition="start" 
          />
          <Tab 
            label="Authentication" 
            value="authentication" 
            icon={
              <Badge badgeContent={getCategoryCount('authentication')} color="primary" max={999}>
                <LoginIcon />
              </Badge>
            } 
            iconPosition="start" 
          />
          <Tab 
            label="Rentals" 
            value="rental" 
            icon={
              <Badge badgeContent={getCategoryCount('rental')} color="primary" max={999}>
                <PurchaseIcon />
              </Badge>
            } 
            iconPosition="start" 
          />
          {/* <Tab 
            label="Vehicles" 
            value="vehicle" 
            icon={
              <Badge badgeContent={getCategoryCount('vehicle')} color="primary" max={999}>
                <VehiclesIcon />
              </Badge>
            } 
            iconPosition="start" 
          /> */}
          <Tab 
            label="Payments" 
            value="payment" 
            icon={
              <Badge badgeContent={getCategoryCount('payment')} color="primary" max={999}>
                <PaymentsIcon />
              </Badge>
            } 
            iconPosition="start" 
          />
          <Tab 
            label="Feedback" 
            value="feedback" 
            icon={
              <Badge badgeContent={getCategoryCount('feedback')} color="primary" max={999}>
                <RatingsIcon />
              </Badge>
            } 
            iconPosition="start" 
          />
        </Tabs>
      </Paper>

      {/* Filters */}
      <Paper 
        elevation={2} 
        sx={{ 
          mb: 3, 
          p: 2, 
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box display="flex" alignItems="center">
          <FilterIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="subtitle1" fontWeight="medium">Filters</Typography>
        </Box>
        
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Activity Type</InputLabel>
          <Select
            value={activityFilter}
            label="Activity Type"
            onChange={(e) => setActivityFilter(e.target.value)}
          >
            <MenuItem value="all">All Activities</MenuItem>
            {activityTab === 'all' 
              ? Object.keys(activityTypeConfig).map((type) => (
                  <MenuItem key={type} value={type}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {React.cloneElement(activityTypeConfig[type].icon, { 
                        fontSize: 'small',
                        color: activityTypeConfig[type].color
                      })}
                      {type.replace(/_/g, ' ')}
                    </Box>
                  </MenuItem>
                ))
              : activityTypeGroups[activityTab].map((type) => (
                  <MenuItem key={type} value={type}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {React.cloneElement(activityTypeConfig[type].icon, { 
                        fontSize: 'small',
                        color: activityTypeConfig[type].color
                      })}
                      {type.replace(/_/g, ' ')}
                    </Box>
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
            <MenuItem value="customer">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon fontSize="small" color="primary" />
                Customer
              </Box>
            </MenuItem>
            <MenuItem value="car_provider">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VehiclesIcon fontSize="small" color="info" />
                Car Provider
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
      </Paper>
      
      {/* Loading and Error States */}
      {loading && activities.length === 0 ? (
        <Box display="flex" justifyContent="center" my={4} p={4}>
          <CircularProgress />
        </Box>
      ) : error && activities.length === 0 ? (
        <Alert 
          severity="error" 
          sx={{ 
            my: 2, 
            borderRadius: 2,
            boxShadow: 1
          }}
        >
          {error}
        </Alert>
      ) : filteredActivities.length === 0 ? (
        <Paper 
          elevation={1} 
          sx={{ 
            p: 4, 
            my: 2, 
            borderRadius: 2, 
            textAlign: 'center',
            bgcolor: alpha(theme.palette.info.light, 0.1)
          }}
        >
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No activities found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try changing your filters or check back later
          </Typography>
        </Paper>
      ) : (
        // Activity List
        <Box sx={{ mt: 2 }}>
          {filteredActivities.map((activity, index) => (
            <ActivityCard 
              key={index} 
              activity={activity} 
              onClick={() => handleActivityClick(activity)} 
            />
          ))}
        </Box>
      )}
      
      {/* Pagination */}
      {filteredActivities.length > 0 && (
        <Box 
          sx={{ 
            mt: 3, 
            mb: 4,
            display: 'flex', 
            justifyContent: 'center',
            '& .MuiPaginationItem-root': {
              fontWeight: 500
            }
          }}
        >
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
            shape="rounded"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Activity Detail Modal */}
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