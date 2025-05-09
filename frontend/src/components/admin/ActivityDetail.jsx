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
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
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

const ActivityDetail = ({ activity, open, onClose }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [userLoading, setUserLoading] = useState(false);

  useEffect(() => {
    if (activity && activity.userId) {
      fetchUserDetails(activity.userId);
    }
  }, [activity]);

  const fetchUserDetails = async (userId) => {
    setUserLoading(true);
    try {
      const response = await api.get(`/api/users/${userId}`);
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

  if (!activity) return null;

  // Safely create date object
  const getValidDate = (timestamp) => {
    if (!timestamp) return new Date();
    try {
      const date = new Date(timestamp);
      // Check if date is valid
      return isNaN(date.getTime()) ? new Date() : date;
    } catch (e) {
      return new Date();
    }
  };

  const activityDate = getValidDate(activity.timestamp);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Activity Details
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, mb: 2, backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
              <Typography variant="h6" gutterBottom>
                {String(activity.activityType || '').replace(/_/g, ' ')}
                <Chip
                  label={activity.activityType}
                  size="small"
                  color={activityTypeColors[activity.activityType] || 'default'}
                  sx={{ ml: 1 }}
                />
              </Typography>
              <Typography variant="body1">{String(activity.details || '')}</Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Timestamp Information</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Date:</Typography>
                  <Typography>{activityDate.toLocaleDateString()}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Time:</Typography>
                  <Typography>{activityDate.toLocaleTimeString()}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">IP Address:</Typography>
                  <Typography>{activity.ipAddress || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">User Agent:</Typography>
                  <Typography noWrap sx={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activity.userAgent || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>User Information</Typography>
              {userLoading ? (
                <Box display="flex" justifyContent="center" my={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : userDetails ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Name:</Typography>
                    <Typography>
                      {userDetails.firstName && userDetails.lastName 
                        ? `${userDetails.firstName} ${userDetails.lastName}`
                        : 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Email:</Typography>
                    <Typography>{userDetails.email || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Role:</Typography>
                    <Chip 
                      label={activity.userRole || 'N/A'} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">User ID:</Typography>
                    <Typography>{String(activity.userId || '')}</Typography>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    User ID: {String(activity.userId || '')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Role: {String(activity.userRole || '')}
                  </Typography>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Detailed user information unavailable
                  </Alert>
                </Box>
              )}
            </Paper>
          </Grid>
          
          {activity.metadata && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Additional Metadata</Typography>
                <pre style={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.03)', 
                  padding: '8px', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  {JSON.stringify(activity.metadata, null, 2)}
                </pre>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActivityDetail; 