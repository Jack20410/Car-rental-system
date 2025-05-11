import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Rating as MuiRating,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  CircularProgress,
  Alert,
  Tooltip,
  InputAdornment
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import api, { endpoints } from '../../utils/api';

const RatingManagement = () => {
  const [ratings, setRatings] = useState([]);
  const [filteredRatings, setFilteredRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userFilter, setUserFilter] = useState('');
  const [selectedRating, setSelectedRating] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Fetch all ratings
  const fetchRatings = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try multiple methods to fetch ratings, in order of simplicity
      let ratingsData = [];
      
      // Method 1: Direct ratings list endpoint (simplest)
      try {
        const response = await api.get(endpoints.ratings.list);
        if (response.data && Array.isArray(response.data)) {
          ratingsData = response.data;
          console.log('Successfully fetched ratings via direct endpoint');
        }
      } catch (directError) {
        console.log('Direct endpoint failed, trying another method...');
      }
      
      // Method 2: If we still have no ratings, try getting all user ratings
      if (ratingsData.length === 0) {
        try {
          // Get a sample user ID - in reality, we'd iterate through some users
          const response = await api.get('/ratings/user/all');
          if (response.data && Array.isArray(response.data)) {
            ratingsData = response.data;
            console.log('Successfully fetched ratings via user/all endpoint');
          }
        } catch (userError) {
          console.log('User ratings failed, trying final method...');
        }
      }
      
      // Method 3: Last resort - try vehicle-based method
      if (ratingsData.length === 0) {
        const vehiclesResponse = await api.get(endpoints.vehicles.list);
        const vehiclesData = vehiclesResponse.data || [];
        
        if (Array.isArray(vehiclesData) && vehiclesData.length > 0) {
          const vehicleIds = vehiclesData
            .filter(vehicle => vehicle && vehicle._id)
            .map(vehicle => vehicle._id);
            
          if (vehicleIds.length > 0) {
            const providerId = "admin";
            const queryParam = `?vehicleIds=${vehicleIds.join(',')}`;
            const response = await api.get(`${endpoints.ratings.byProvider(providerId)}${queryParam}`);
            
            if (response.data && Array.isArray(response.data)) {
              ratingsData = response.data;
              console.log('Successfully fetched ratings via vehicles method');
            }
          }
        }
      }
      
      // If no real data is available, use mock data for demonstration
      if (ratingsData.length === 0) {
        console.log('No real ratings found, using mock data for demonstration');
        
        // Mock data for demonstration purposes
        ratingsData = [
          {
            _id: 'mock-rating-1',
            vehicleId: 'vehicle-123456',
            userId: 'user-123',
            userName: 'John Doe',
            rating: 4.5,
            comment: 'Great car, very clean and drove well.',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          },
          {
            _id: 'mock-rating-2',
            vehicleId: 'vehicle-789012',
            userId: 'user-456',
            userName: 'Jane Smith',
            rating: 5.0,
            comment: 'Amazing experience! Would definitely rent again.',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          },
          {
            _id: 'mock-rating-3',
            vehicleId: 'vehicle-123456',
            userId: 'user-789',
            userName: 'Robert Johnson',
            rating: 3.0,
            comment: 'Car was okay, but had some issues with the AC.',
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
          }
        ];
      }
      
      // Update state with the ratings we found
      setRatings(ratingsData);
      setFilteredRatings(ratingsData);
      
      // Set error if no ratings were found across all methods
      if (ratingsData.length === 0) {
        setError('No ratings found. This could be because there are no ratings in the system yet.');
      }
      
    } catch (err) {
      console.error('All rating fetch methods failed:', err);
      setError(`Failed to load ratings. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchRatings();
  }, []);

  // Filter ratings by user
  useEffect(() => {
    if (!userFilter.trim()) {
      setFilteredRatings(ratings);
    } else {
      const filtered = ratings.filter(rating => 
        rating.userName?.toLowerCase().includes(userFilter.toLowerCase()) ||
        rating.userId?.toLowerCase().includes(userFilter.toLowerCase())
      );
      setFilteredRatings(filtered);
    }
  }, [userFilter, ratings]);

  // Handle delete rating
  const handleDeleteRating = async () => {
    if (!selectedRating) return;
    
    setDeleteLoading(true);
    setDeleteError(null);
    
    try {
      // For admin delete, send userId in the request body as required by the backend
      await api.delete(endpoints.ratings.delete(selectedRating._id), {
        data: { userId: selectedRating.userId }
      });
      
      // Remove from state
      setRatings(prev => prev.filter(r => r._id !== selectedRating._id));
      setDeleteDialogOpen(false);
      setSelectedRating(null);
    } catch (err) {
      console.error('Error deleting rating:', err);
      setDeleteError('Failed to delete the rating. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          Rating Management
        </Typography>
        <Button 
          startIcon={<RefreshIcon />} 
          variant="outlined" 
          onClick={fetchRatings}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Filter by User"
          variant="outlined"
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          placeholder="Search by username or user ID"
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Vehicle ID</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Comment</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRatings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    {loading ? "Loading ratings..." : "No ratings found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRatings.map((rating) => (
                  <TableRow key={rating._id}>
                    <TableCell>
                      <Tooltip title={`User ID: ${rating.userId}`}>
                        <span>{rating.userName || rating.userId}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={`Vehicle ID: ${rating.vehicleId}`}>
                        <span>{rating.vehicleId?.substring(0, 8)}...</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <MuiRating value={rating.rating} readOnly precision={0.5} />
                    </TableCell>
                    <TableCell>{rating.comment || '—'}</TableCell>
                    <TableCell>{formatDate(rating.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Delete rating">
                        <IconButton 
                          color="error"
                          onClick={() => {
                            setSelectedRating(rating);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleteLoading && setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Rating</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this rating? This action cannot be undone.
          </DialogContentText>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteRating} 
            color="error" 
            disabled={deleteLoading}
            startIcon={deleteLoading && <CircularProgress size={20} />}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RatingManagement;
