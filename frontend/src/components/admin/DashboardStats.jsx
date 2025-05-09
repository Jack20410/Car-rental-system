import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Grid,
} from '@mui/material';
import api from '../../utils/api';

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

const DashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/admin/activities/stats');
      const data = response.data;
      
      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch statistics');
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Set default empty stats to prevent UI from crashing
      setStats([
        { _id: 'customer', totalActivities: 0, activities: [] },
        { _id: 'car_provider', totalActivities: 0, activities: [] }
      ]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="warning" sx={{ my: 2 }}>
        {error}. The API endpoint may not be available yet.
        <Typography variant="body2" mt={1}>
          Make sure the admin-service is running and the admin routes are properly configured in the API gateway.
        </Typography>
      </Alert>
    );
  }

  // If stats array is empty or no activities
  if (!stats || stats.length === 0 || stats.every(stat => stat.totalActivities === 0)) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        No activity data available yet. Activities will appear here as users interact with the system.
      </Alert>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Activity Statistics
        </Typography>
      </Grid>

      {stats.map((roleStats) => (
        <Grid item xs={12} md={6} key={roleStats._id}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              {roleStats._id === 'customer' ? 'Customer' : 'Car Provider'} Activities
            </Typography>
            <Typography variant="h4" color="primary" gutterBottom>
              {roleStats.totalActivities}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Total Activities
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Activity Breakdown:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {roleStats.activities.map((activity) => (
                  <Chip
                    key={activity.type}
                    label={`${activity.type.replace(/_/g, ' ')}: ${activity.count}`}
                    color={activityTypeColors[activity.type] || 'default'}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default DashboardStats; 