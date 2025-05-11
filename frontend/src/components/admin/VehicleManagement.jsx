import React, { useState, useEffect } from 'react';
import api, { endpoints } from '../../utils/api';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Container, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Chip,
  CircularProgress
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Info as InfoIcon,
  Dashboard as DashboardIcon,
  DirectionsCar as DirectionsCarIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency';
import VehicleDetails from './VehicleDetails';

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [providerStats, setProviderStats] = useState([]);
  const [viewStatsDialog, setViewStatsDialog] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const navigate = useNavigate();

  // Fetch all vehicles
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await api.get(endpoints.vehicles.list, {
        params: {
          page: page + 1,
          limit: rowsPerPage
        }
      });
      
      if (response.data.success) {
        setVehicles(response.data.data.vehicles);
        setTotalCount(response.data.data.pagination.total);
      } else {
        setError('Failed to fetch vehicles');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching vehicles');
      console.error('Error fetching vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate provider stats based on fetched vehicles
  const calculateProviderStats = (vehicleData) => {
    const providerMap = new Map();
    
    vehicleData.forEach(vehicle => {
      const providerId = vehicle.car_providerId._id || vehicle.car_providerId;
      const providerFullName = vehicle.car_providerId.fullName || 'Unknown Provider';
      const providerEmail = vehicle.car_providerId.email || 'No Email';
      
      if (providerMap.has(providerId)) {
        providerMap.get(providerId).count += 1;
      } else {
        providerMap.set(providerId, {
          id: providerId,
          fullName: providerFullName,
          email: providerEmail,
          count: 1
        });
      }
    });
    
    const stats = Array.from(providerMap.values())
      .sort((a, b) => b.count - a.count);
    
    setProviderStats(stats);
  };

  // Fetch all vehicles for statistics (across all pages)
  const fetchAllVehiclesForStats = async () => {
    try {
      setLoadingStats(true);
      // First get the total count and pages
      const countResponse = await api.get(endpoints.vehicles.list, {
        params: {
          limit: 1,
          page: 1
        }
      });
      
      if (!countResponse.data.success) {
        setError('Failed to fetch vehicle count');
        return;
      }
      
      const totalPages = countResponse.data.data.pagination.pages;
      const pageSize = 100; // Use a larger page size for efficiency
      
      // Create an array of promises to fetch all pages
      const fetchPromises = [];
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        fetchPromises.push(
          api.get(endpoints.vehicles.list, {
            params: {
              limit: pageSize,
              page: pageNum
            }
          })
        );
      }
      
      // Execute all promises in parallel
      const responses = await Promise.all(fetchPromises);
      
      // Combine all vehicles from all pages
      let allVehicles = [];
      responses.forEach(response => {
        if (response.data.success && response.data.data.vehicles) {
          allVehicles = [...allVehicles, ...response.data.data.vehicles];
        }
      });
      
      // Calculate provider stats with the complete dataset
      calculateProviderStats(allVehicles);
    } catch (err) {
      setError(err.message || 'Failed to fetch all vehicles for statistics');
      console.error('Error fetching all vehicles for stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Handle vehicle deletion
  const handleDeleteVehicle = async () => {
    if (!selectedVehicle) return;
    
    try {
      const response = await api.delete(endpoints.vehicles.delete(selectedVehicle._id));
      if (response.status === 200) {
        // Successfully deleted
        setVehicles(vehicles.filter(v => v._id !== selectedVehicle._id));
        
        // Update count if the last page has only one item and is deleted
        if (vehicles.length === 1 && page > 0) {
          setPage(page - 1);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete vehicle');
      console.error('Error deleting vehicle:', err);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedVehicle(null);
    }
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (vehicle) => {
    setSelectedVehicle(vehicle);
    setDeleteDialogOpen(true);
  };

  // View vehicle details
  const viewVehicleDetails = (id) => {
    setSelectedVehicleId(id);
  };

  // Go back to list view
  const handleBackToList = () => {
    setSelectedVehicleId(null);
  };

  // Open provider statistics dialog
  const openProviderStatsDialog = async () => {
    setViewStatsDialog(true);
    await fetchAllVehiclesForStats();
  };

  // Effect to fetch vehicles when page or rowsPerPage changes
  useEffect(() => {
    fetchVehicles();
  }, [page, rowsPerPage]);

  // Effect to calculate provider stats when vehicles change
  useEffect(() => {
    if (vehicles.length > 0) {
      calculateProviderStats(vehicles);
    }
  }, [vehicles]);

  // Render vehicle status chip
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

  // Render content based on whether a vehicle is selected or not
  const renderContent = () => {
    if (selectedVehicleId) {
      return (
        <VehicleDetails 
          vehicleId={selectedVehicleId} 
          onBack={handleBackToList} 
        />
      );
    }

    return (
      <Paper sx={{ width: '100%', mb: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
            <Button 
              variant="outlined" 
              onClick={fetchVehicles} 
              sx={{ mt: 2 }}
            >
              Try Again
            </Button>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Vehicle</TableCell>
                    <TableCell>License Plate</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Price/Day</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {vehicle.images && vehicle.images.length > 0 ? (
                            <Box
                              component="img"
                              src={`http://localhost:3002${vehicle.images[0]}`}
                              alt={vehicle.name}
                              sx={{ width: 50, height: 50, mr: 2, objectFit: 'cover', borderRadius: 1 }}
                            />
                          ) : (
                            <Box 
                              sx={{ 
                                width: 50, 
                                height: 50, 
                                mr: 2, 
                                bgcolor: 'grey.200', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                borderRadius: 1
                              }}
                            >
                              <DirectionsCarIcon />
                            </Box>
                          )}
                          <Box>
                            <Typography variant="body1">{vehicle.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {vehicle.brand} ({vehicle.modelYear})
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{vehicle.licensePlate}</TableCell>
                      <TableCell>
                        {typeof vehicle.car_providerId === 'object' 
                          ? vehicle.car_providerId.fullName || 'Unknown'
                          : 'Unknown'}
                      </TableCell>
                      <TableCell>{formatCurrency(vehicle.rentalPricePerDay)}</TableCell>
                      <TableCell>{renderStatusChip(vehicle.status)}</TableCell>
                      <TableCell align="center">
                        <IconButton 
                          color="primary" 
                          onClick={() => viewVehicleDetails(vehicle._id)}
                          size="small"
                          title="View details"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          color="error" 
                          onClick={() => openDeleteDialog(vehicle)}
                          size="small"
                          title="Delete vehicle"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {vehicles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <Typography variant="body1">No vehicles found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
    );
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {!selectedVehicleId && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              <DirectionsCarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Vehicle Management
            </Typography>
            
            <Button 
              variant="outlined" 
              startIcon={<DashboardIcon />}
              onClick={openProviderStatsDialog}
            >
              Provider Statistics
            </Button>
          </Box>
        )}

        {renderContent()}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the vehicle "{selectedVehicle?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteVehicle} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Provider Statistics Dialog */}
      <Dialog
        open={viewStatsDialog}
        onClose={() => setViewStatsDialog(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <InfoIcon sx={{ mr: 1 }} />
            Vehicle Provider Statistics
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingStats ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : providerStats.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Provider Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell align="center">Number of Vehicles</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {providerStats.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>{provider.fullName}</TableCell>
                      <TableCell>{provider.email}</TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={provider.count} 
                          color={provider.count > 3 ? "primary" : "default"}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body1" align="center" sx={{ py: 3 }}>
              No provider statistics available
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewStatsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default VehicleManagement;
