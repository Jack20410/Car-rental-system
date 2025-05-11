import React, { useState, useEffect } from 'react';
import api, { endpoints } from '../../utils/api';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  DirectionsCar as DirectionsCarIcon,
  Person as PersonIcon,
  CalendarToday as CalendarTodayIcon,
  Speed as SpeedIcon,
  LocalGasStation as LocalGasStationIcon,
  Chair as ChairIcon,
  Settings as SettingsIcon,
  LocationOn as LocationOnIcon,
} from '@mui/icons-material';

const VehicleDetails = ({ vehicleId, onBack }) => {
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVehicleDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(endpoints.vehicles.details(vehicleId));
        
        if (response.data && response.data.data) {
          setVehicle(response.data.data);
        } else {
          setError('Vehicle data not found');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching vehicle details');
        console.error('Error fetching vehicle details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (vehicleId) {
      fetchVehicleDetails();
    }
  }, [vehicleId]);

  const renderStatusChip = (status) => {
    let color = 'default';
    
    switch(status) {
      case 'Available':
        color = 'success';
        break;
      case 'Rented':
        color = 'primary';
        break;
      case 'Unavailable':
        color = 'error';
        break;
      default:
        color = 'default';
    }
    
    return <Chip label={status} color={color} size="small" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !vehicle) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h5" color="error" gutterBottom>
          {error || 'Vehicle not found'}
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />} 
          onClick={onBack}
          sx={{ mt: 2 }}
        >
          Back to Vehicles
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Button 
        variant="outlined" 
        startIcon={<ArrowBackIcon />} 
        onClick={onBack}
        sx={{ mb: 3 }}
      >
        Back to Vehicles
      </Button>

      <Paper sx={{ mb: 4, overflow: 'hidden' }}>
        <Box
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
          }}
        >
          <Box>
            <Typography variant="h4" component="h1">
              {vehicle.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {vehicle.brand} - {vehicle.modelYear}
            </Typography>
          </Box>
          <Box sx={{ mt: { xs: 2, md: 0 }, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" color="primary">
              {formatCurrency(vehicle.rentalPricePerDay)}/day
            </Typography>
            {renderStatusChip(vehicle.status)}
          </Box>
        </Box>

        {/* Vehicle Images */}
        <Box sx={{ px: 3, pb: 3 }}>
          <Grid container spacing={2}>
            {vehicle.images && vehicle.images.length > 0 ? (
              vehicle.images.map((image, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card sx={{ height: '100%' }}>
                    <CardMedia
                      component="img"
                      sx={{ height: 200, objectFit: 'cover' }}
                      image={`http://localhost:3002${image}`}
                      alt={`${vehicle.name} - image ${index + 1}`}
                    />
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Box
                  sx={{
                    height: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    No images available
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>

        {/* Vehicle Details */}
        <Box sx={{ px: 3, pb: 3 }}>
          <Grid container spacing={4}>
            {/* Left Column - Vehicle Specs */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Vehicle Specifications
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" sx={{ width: '40%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <DirectionsCarIcon sx={{ mr: 1 }} />
                          Car Type
                        </Box>
                      </TableCell>
                      <TableCell>{vehicle.carType}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarTodayIcon sx={{ mr: 1 }} />
                          Model Year
                        </Box>
                      </TableCell>
                      <TableCell>{vehicle.modelYear}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ChairIcon sx={{ mr: 1 }} />
                          Seats
                        </Box>
                      </TableCell>
                      <TableCell>{vehicle.seats}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <SettingsIcon sx={{ mr: 1 }} />
                          Transmission
                        </Box>
                      </TableCell>
                      <TableCell>{vehicle.transmission}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocalGasStationIcon sx={{ mr: 1 }} />
                          Fuel Type
                        </Box>
                      </TableCell>
                      <TableCell>{vehicle.fuelType}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationOnIcon sx={{ mr: 1 }} />
                          Location
                        </Box>
                      </TableCell>
                      <TableCell>
                        {vehicle.location?.city 
                          ? `${vehicle.location.city}${vehicle.location.address ? `, ${vehicle.location.address}` : ''}`
                          : 'Not specified'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            {/* Right Column - Owner Details & Description */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Vehicle Owner
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                {typeof vehicle.car_providerId === 'object' ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body1">
                        {vehicle.car_providerId.fullName || 'Unknown Name'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {vehicle.car_providerId.email || 'No email provided'}
                      </Typography>
                      {vehicle.car_providerId.phone && (
                        <Typography variant="body2" color="text.secondary">
                          {vehicle.car_providerId.phone}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body1">
                    Owner information not available
                  </Typography>
                )}
              </Paper>

              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="body1">
                  {vehicle.description || 'No description provided'}
                </Typography>
              </Paper>

              <Typography variant="h6" gutterBottom>
                Features
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                {vehicle.features && vehicle.features.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {vehicle.features.map((feature, index) => (
                      <Chip key={index} label={feature} variant="outlined" />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body1">
                    No features listed
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default VehicleDetails; 