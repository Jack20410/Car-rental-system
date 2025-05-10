import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Divider,
  Chip,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  AlertTitle
} from '@mui/material';
import { 
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  ArrowBack as ArrowBackIcon,
  Star,
  Warning as WarningIcon
} from '@mui/icons-material';
import api from '../../utils/api'
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatCurrency';

const UserDetails = ({ userId, onBack }) => {
  const { isAdmin } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [rentalHistory, setRentalHistory] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [rentalError, setRentalError] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [ratingsError, setRatingsError] = useState(null);

  useEffect(() => {
    if (userId) {
      if (!isAdmin()) {
        setError('You must have admin privileges to view user details');
        setLoading(false);
        return;
      }
      fetchUserDetails();
    }
  }, [userId, isAdmin]);

  const fetchUserDetails = async () => {
    setLoading(true);
    // Reset all errors
    setError(null);
    setRentalError(null);
    setPaymentError(null);
    setRatingsError(null);
    
    try {
      // 1. Fetch user details from user service
      const userResponse = await api.get(`/users/${userId}/all`);
      console.log('User details response:', userResponse.data);
      
      // Extract user from data property in the response
      const userData = userResponse.data && userResponse.data.data ? userResponse.data.data : null;
      
      // If the user data from the API has 'fullName' instead of 'name' (as seen in the controller)
      if (userData && userData.fullName && !userData.name) {
        userData.name = userData.fullName;
      }
      
      setUser(userData);

      if (userData) {
        // 2. Fetch rental history from rental service
        let userRentals = [];
        try {
          // From the controller code, we can see getAllRentals supports userId as query param
          const rentalResponse = await api.get(`/rentals/all?userId=${userId}`);
          console.log('Rental history response:', rentalResponse.data);
          
          // Handle nested data structure from getAllRentals
          if (rentalResponse.data && rentalResponse.data.data) {
            // The getAllRentals endpoint returns rentals inside data.rentals
            userRentals = rentalResponse.data.data.rentals || [];
          } else if (rentalResponse.data && Array.isArray(rentalResponse.data)) {
            userRentals = rentalResponse.data;
          }
          
          if (userRentals.length > 0) {
            // Get unique vehicleIds from all rentals
            const vehicleIds = [...new Set(userRentals.map(rental => rental.vehicleId))];
            
            // Fetch vehicle details for each unique vehicleId
            const vehicleDetailsPromises = vehicleIds.map(vehicleId => 
              api.get(`/vehicles/${vehicleId}`)
                .then(response => {
                  console.log(`Vehicle details for ${vehicleId}:`, response.data);
                  return response.data?.data || null;
                })
                .catch(err => {
                  console.error(`Error fetching vehicle ${vehicleId}:`, err);
                  return null;
                })
            );

            // Wait for all vehicle requests to complete
            const vehicleDetails = await Promise.all(vehicleDetailsPromises);
            
            // Create a map of vehicleId to vehicle details
            const vehicleMap = {};
            vehicleDetails.forEach(vehicle => {
              if (vehicle && vehicle._id) {
                vehicleMap[vehicle._id] = vehicle;
              }
            });
            
            // Enhance rental data with vehicle details
            const enhancedRentals = userRentals.map(rental => ({
              ...rental,
              vehicle: vehicleMap[rental.vehicleId] || { name: 'Unknown Vehicle' }
            }));
            
            setRentalHistory(enhancedRentals);
          } else {
            setRentalHistory([]);
          }
        } catch (rentalErr) {
          console.error('Error fetching rental history:', rentalErr);
          setRentalHistory([]);
          setRentalError('Unable to fetch rental history. The rental service may be unavailable.');
        }

        // 3. Fetch payment history using rentalIds from the rental history
        try {
          // Only proceed if we have rentals
          if (Array.isArray(userRentals) && userRentals.length > 0) {
            // Get all payments for each rental
            const paymentPromises = userRentals.map(rental => 
              api.get(`/payments/rental/${rental._id}`)
                .then(response => {
                  console.log(`Payment for rental ${rental._id}:`, response.data);
                  return response.data && response.data.data ? response.data.data : [];
                })
                .catch(err => {
                  console.error(`Error fetching payment for rental ${rental._id}:`, err);
                  return [];
                })
            );

            // Wait for all payment requests to complete
            const paymentResults = await Promise.all(paymentPromises);
            
            // Flatten the array of payment arrays
            const allPayments = paymentResults.flat();
            console.log('All payments:', allPayments);
            
            setPaymentHistory(allPayments);
          } else {
            setPaymentHistory([]);
          }
        } catch (paymentErr) {
          console.error('Error fetching payment history:', paymentErr);
          setPaymentHistory([]);
          setPaymentError('Unable to fetch payment history. The payment service may be unavailable.');
        }

        // 4. For ratings, we have different endpoints depending on user role
        try {
          if (userData.role === 'car_provider') {
            // For providers, need to get their vehicles then fetch ratings
            try {
              const vehiclesResponse = await api.get(`/vehicles?providerId=${userId}`);
              const vehicles = vehiclesResponse.data?.data || [];
              const vehicleIds = vehicles.map(v => v._id).join(',');
              
              if (vehicleIds) {
                // Using the by-provider endpoint with vehicleIds query param
                const ratingsResponse = await api.get(`/by-provider/${userId}?vehicleIds=${vehicleIds}`);
                console.log('Ratings response:', ratingsResponse.data);
                const ratingsData = ratingsResponse.data || [];
                setRatings(Array.isArray(ratingsData) ? ratingsData : []);
              } else {
                setRatings([]);
              }
            } catch (error) {
              console.error('Error fetching provider vehicles/ratings:', error);
              setRatings([]);
            }
          } else {
            // For regular users, use the new user ratings endpoint
            try {
              const ratingsResponse = await api.get(`/ratings/user/${userId}`);
              console.log('User ratings response:', ratingsResponse.data);
              let ratingsData = ratingsResponse.data || [];
              
              // Ensure we have an array of ratings
              ratingsData = Array.isArray(ratingsData) ? ratingsData : [];
              
              if (ratingsData.length > 0) {
                // Extract unique vehicleIds from ratings
                const vehicleIds = [...new Set(ratingsData.map(rating => rating.vehicleId))];
                
                // Fetch vehicle details for each vehicleId
                const vehicleDetailsPromises = vehicleIds.map(vehicleId => 
                  api.get(`/vehicles/${vehicleId}`)
                    .then(response => {
                      console.log(`Vehicle details for ${vehicleId}:`, response.data);
                      return response.data?.data || null;
                    })
                    .catch(err => {
                      console.error(`Error fetching vehicle ${vehicleId}:`, err);
                      return null;
                    })
                );
                
                // Wait for all vehicle requests to complete
                const vehicleDetails = await Promise.all(vehicleDetailsPromises);
                
                // Create a map of vehicleId to vehicle details
                const vehicleMap = {};
                vehicleDetails.forEach(vehicle => {
                  if (vehicle && vehicle._id) {
                    vehicleMap[vehicle._id] = vehicle;
                  }
                });
                
                // Enhance ratings with vehicle details
                const enhancedRatings = ratingsData.map(rating => ({
                  ...rating,
                  vehicle: vehicleMap[rating.vehicleId] || { name: 'Unknown Vehicle' }
                }));
                
                setRatings(enhancedRatings);
              } else {
                setRatings([]);
              }
            } catch (error) {
              console.error('Error fetching user ratings:', error);
              setRatings([]);
            }
          }
        } catch (ratingsErr) {
          console.error('Error fetching ratings:', ratingsErr);
          setRatings([]);
          setRatingsError('Unable to fetch ratings. The rating service may be unavailable.');
        }
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      if (err.response?.status === 401) {
        setError('Authentication error: You are not authorized to view user details');
      } else {
        setError('Failed to load user details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography color="error">{error}</Typography>
        <Button 
          startIcon={<ArrowBackIcon />} 
          variant="outlined" 
          onClick={onBack}
          sx={{ mt: 2 }}
        >
          Back to Users
        </Button>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box>
        <Typography>User not found</Typography>
        <Button 
          startIcon={<ArrowBackIcon />} 
          variant="outlined" 
          onClick={onBack}
          sx={{ mt: 2 }}
        >
          Back to Users
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Button 
        startIcon={<ArrowBackIcon />} 
        variant="outlined" 
        onClick={onBack}
        sx={{ mb: 3 }}
      >
        Back to Users
      </Button>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ overflow: 'visible' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    mb: 2,
                    bgcolor: 'primary.main',
                    fontSize: '2rem'
                  }}
                  src={user.avatar || user.profileImage || ''}
                  alt={user.name}
                >
                  {user.name?.charAt(0).toUpperCase()}
                </Avatar>
                
                <Typography variant="h6" fontWeight="bold" align="center" sx={{ mb: 1 }}>
                  {user.name || 'Unknown User'}
                </Typography>
                
                <Chip 
                  label={(user.role?.replace('_', ' ') || 'USER').toUpperCase()} 
                  color={user.role === 'admin' ? 'error' : user.role === 'car_provider' ? 'primary' : 'default'}
                  size="small"
                  sx={{ 
                    fontWeight: 'bold',
                    mb: 2
                  }}
                />
              </Box>
              
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <EmailIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    {user.phoneNumber}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    Joined: {formatDate(user.createdAt)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Rental History" />
              <Tab label="Payment History" />
              <Tab label="Ratings & Reviews" />
            </Tabs>
            
            <Box sx={{ p: 2 }}>
              {/* Rental History Tab */}
              {activeTab === 0 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Rental History
                  </Typography>
                  
                  {rentalError && (
                    <Alert 
                      severity="warning" 
                      sx={{ mb: 2 }}
                      icon={<WarningIcon />}
                    >
                      <AlertTitle>Service Unavailable</AlertTitle>
                      {rentalError}
                    </Alert>
                  )}
                  
                  {!rentalError && rentalHistory.length > 0 ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Vehicle</TableCell>
                            <TableCell>Start Date</TableCell>
                            <TableCell>End Date</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rentalHistory.map((rental) => (
                            <TableRow key={rental._id}>
                              <TableCell>{rental.vehicle?.name || 'Unknown Vehicle'}</TableCell>
                              <TableCell>{formatDate(rental.startDate)}</TableCell>
                              <TableCell>{formatDate(rental.endDate)}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={rental.status} 
                                  size="small"
                                  color={
                                    rental.status === 'completed' ? 'success' :
                                    rental.status === 'active' ? 'primary' :
                                    rental.status === 'cancelled' ? 'error' : 'default'
                                  }
                                />
                              </TableCell>
                              <TableCell>{formatCurrency(rental.totalPrice || 0)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    !rentalError && (
                      <Typography variant="body2" color="text.secondary">
                        No rental history found.
                      </Typography>
                    )
                  )}
                </>
              )}
              
              {/* Payment History Tab */}
              {activeTab === 1 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Payment History
                  </Typography>
                  
                  {paymentError && (
                    <Alert 
                      severity="warning" 
                      sx={{ mb: 2 }}
                      icon={<WarningIcon />}
                    >
                      <AlertTitle>Service Unavailable</AlertTitle>
                      {paymentError}
                    </Alert>
                  )}
                  
                  {!paymentError && paymentHistory.length > 0 ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Method</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paymentHistory.map((payment) => (
                            <TableRow key={payment._id}>
                              <TableCell>{formatDate(payment.createdAt)}</TableCell>
                              <TableCell>{formatCurrency(payment.amount || 0)}</TableCell>
                              <TableCell>{payment.paymentMethod}</TableCell>
                              <TableCell>{payment.description}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={payment.paymentStatus} 
                                  size="small"
                                  color={
                                    payment.paymentStatus === 'completed' ? 'success' :
                                    payment.paymentStatus === 'failed' ? 'error' :
                                    payment.paymentStatus === 'pending' ? 'warning' : 'default'
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    !paymentError && (
                      <Typography variant="body2" color="text.secondary">
                        No payment history found.
                      </Typography>
                    )
                  )}
                </>
              )}
              
              {/* Ratings Tab */}
              {activeTab === 2 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Ratings & Reviews
                  </Typography>
                  
                  {ratingsError && (
                    <Alert 
                      severity="warning" 
                      sx={{ mb: 2 }}
                      icon={<WarningIcon />}
                    >
                      <AlertTitle>Service Unavailable</AlertTitle>
                      {ratingsError}
                    </Alert>
                  )}
                  
                  {!ratingsError && ratings.length > 0 ? (
                    <List>
                      {ratings.map((rating) => (
                        <ListItem 
                          key={rating._id}
                          divider
                          alignItems="flex-start"
                        >
                          <Box sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="subtitle1">
                                {rating.vehicle?.name || 'Unknown Vehicle'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(rating.createdAt)}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i}
                                  sx={{ 
                                    color: i < rating.rating ? 'gold' : 'text.disabled',
                                    fontSize: '1rem'
                                  }}
                                />
                              ))}
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{ ml: 1 }}
                              >
                                {rating.rating}/5
                              </Typography>
                            </Box>
                            
                            <Typography variant="body2">{rating.comment}</Typography>
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    !ratingsError && (
                      <Typography variant="body2" color="text.secondary">
                        No ratings or reviews found.
                      </Typography>
                    )
                  )}
                </>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserDetails; 