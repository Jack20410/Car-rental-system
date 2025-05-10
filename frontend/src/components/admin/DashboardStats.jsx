import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Divider,
  useTheme,
} from '@mui/material';
import { 
  PeopleAlt, 
  DirectionsCar, 
  AttachMoney, 
  Timeline,
  TrendingUp,
  DonutLarge
} from '@mui/icons-material';
import api from '../../utils/api';
// Import Vietnamese currency formatter
import { formatCurrency, formatCompactCurrency } from '../../utils/formatCurrency';

// Activity types and their corresponding colors
const activityTypeColors = {
  LOGIN: '#3f51b5',
  LOGOUT: '#f50057',
  CREATE_RENTAL_ORDER: '#4caf50',
  UPDATE_RENTAL_ORDER: '#2196f3',
  CANCEL_RENTAL_ORDER: '#f44336',
  UPDATE_CAR_STATUS: '#ff9800',
  ADD_CAR: '#8bc34a',
  UPDATE_CAR: '#03a9f4',
  DELETE_CAR: '#e91e63',
  MAKE_PAYMENT: '#009688',
  ADD_RATING: '#9c27b0',
  ADD_REVIEW: '#673ab7',
};

// RGBA colors for charts
const chartColors = [
  'rgba(63, 81, 181, 0.8)',
  'rgba(0, 150, 136, 0.8)',
  'rgba(255, 152, 0, 0.8)',
  'rgba(233, 30, 99, 0.8)',
  'rgba(76, 175, 80, 0.8)',
];

const chartColorsLight = [
  'rgba(63, 81, 181, 0.2)',
  'rgba(0, 150, 136, 0.2)',
  'rgba(255, 152, 0, 0.2)',
  'rgba(233, 30, 99, 0.2)',
  'rgba(76, 175, 80, 0.2)',
];

const DashboardStats = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('month');
  
  // State for various statistics
  const [activityStats, setActivityStats] = useState(null);
  const [userStats, setUserStats] = useState({ totalCustomers: 0, totalProviders: 0 });
  const [vehicleStats, setVehicleStats] = useState({ 
    totalVehicles: 0,
    availableVehicles: 0,
    vehicleTypes: []
  });
  const [revenueStats, setRevenueStats] = useState({ 
    weekly: [],
    monthly: [],
    yearly: [],
    totalRevenue: 0
  });
  const [rentalStats, setRentalStats] = useState({ 
    totalRentals: 0, 
    activeRentals: 0,
    completedRentals: 0,
    cancelledRentals: 0
  });

  // Fetch all statistics
  useEffect(() => {
    const fetchAllStats = async () => {
      setLoading(true);
      try {
        // Get auth token for authenticated requests
        const token = localStorage.getItem('token');
        const authHeaders = token ? { 
          headers: { Authorization: `Bearer ${token}` } 
        } : {};
        
        await Promise.all([
          fetchActivityStats(authHeaders),
          fetchUserStats(authHeaders),
          fetchVehicleStats(authHeaders),
          fetchRevenueStats(authHeaders),
          fetchRentalStats(),  // This already includes auth headers internally
        ]);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard statistics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllStats();
  }, []);

  // Fetch activity statistics
  const fetchActivityStats = async (authOptions = {}) => {
    try {
      // The admin_routes uses a catch-all pattern for /api/admin/{path:path}
      const response = await api.get('/api/admin/activities/stats', authOptions);
      if (response.data.success) {
        setActivityStats(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch activity statistics');
      }
    } catch (err) {
      console.error('Error fetching activity stats:', err);
      // Provide default empty stats to prevent UI from crashing
      setActivityStats([
        { _id: 'customer', totalActivities: 0, activities: [] },
        { _id: 'car_provider', totalActivities: 0, activities: [] }
      ]);
    }
  };

  // Fetch user statistics
  const fetchUserStats = async (authOptions = {}) => {
    try {
      // The user_routes uses /users/{path:path} pattern
      const response = await api.get('/users', authOptions);
      if (response.data.success) {
        // Extract the count directly from the response data
        const count = response.data.count || 0;
        
        // Now fetch user roles distribution if available
        const roleDistribution = { customers: 0, providers: 0 };
        try {
          // This route should be handled by admin_routes
          const rolesResponse = await api.get('/api/admin/users/role-stats', authOptions);
          if (rolesResponse.data.success) {
            // If the endpoint provides role distribution, use it
            roleDistribution.customers = rolesResponse.data.data.customer || 0;
            roleDistribution.providers = rolesResponse.data.data.car_provider || 0;
          } else {
            // Fallback to estimation if role stats endpoint returns success: false
            roleDistribution.customers = Math.round(count * 0.7);
            roleDistribution.providers = Math.round(count * 0.3);
          }
        } catch (roleErr) {
          console.error('Could not fetch role distribution:', roleErr);
          // Fallback to estimation if role stats endpoint is not available
          roleDistribution.customers = Math.round(count * 0.7); // Assuming 70% are customers
          roleDistribution.providers = Math.round(count * 0.3); // Assuming 30% are providers
        }
        
        setUserStats({
          totalCustomers: roleDistribution.customers,
          totalProviders: roleDistribution.providers
        });
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
      // Set fallback values
      setUserStats({
        totalCustomers: 0,
        totalProviders: 0
      });
    }
  };

  // Fetch vehicle statistics
  const fetchVehicleStats = async (authOptions = {}) => {
    try {
      // Get total vehicles count - vehicle_routes uses /vehicles pattern
      const response = await api.get('/vehicles', authOptions);
      
      // Prepare vehicle stats object
      const stats = {
        totalVehicles: 0,
        availableVehicles: 0,
        vehicleTypes: []
      };
      
      if (response.data && response.data.success) {
        // Extract pagination data correctly
        const pagination = response.data.data.pagination;
        if (pagination && pagination.total) {
          stats.totalVehicles = pagination.total;
        }
        
        // Get vehicles array from the response
        const vehicles = response.data.data.vehicles || [];
        let availableCount = 0;
        const carTypeCounts = {};
        
        // Process each vehicle to count available vehicles and car types
        vehicles.forEach(vehicle => {
          // Count available vehicles
          if (vehicle.status === "Available") {
            availableCount++;
          }
          
          // Count car types
          const carType = vehicle.carType;
          if (carType) {
            carTypeCounts[carType] = (carTypeCounts[carType] || 0) + 1;
          }
        });
        
        // Set available vehicles count
        stats.availableVehicles = availableCount;
        
        // Convert car type counts to the format needed for charts
        stats.vehicleTypes = Object.keys(carTypeCounts).map(type => ({
          name: type,
          value: carTypeCounts[type]
        }));
        
        // If no car types were found, use default data
        if (stats.vehicleTypes.length === 0) {
          stats.vehicleTypes = [
            { name: 'Sedan', value: Math.round(stats.totalVehicles * 0.35) },
            { name: 'SUV', value: Math.round(stats.totalVehicles * 0.25) },
            { name: 'Hatchback', value: Math.round(stats.totalVehicles * 0.15) },
            { name: 'Convertible', value: Math.round(stats.totalVehicles * 0.10) },
            { name: 'Coupe', value: Math.round(stats.totalVehicles * 0.15) },
          ];
        }
        
        // Debug logs to help diagnose issues
        console.log('Vehicle stats:', stats);
        
        setVehicleStats(stats);
      }
    } catch (err) {
      console.error('Error fetching vehicle stats:', err);
      // Set fallback vehicle types
      setVehicleStats({
        totalVehicles: 0,
        availableVehicles: 0,
        vehicleTypes: [
          { name: 'Sedan', value: 35 },
          { name: 'SUV', value: 25 },
          { name: 'Hatchback', value: 15 },
          { name: 'Convertible', value: 10 },
          { name: 'Coupe', value: 15 },
        ]
      });
    }
  };

  // Fetch revenue statistics - this would be from payment service
  const fetchRevenueStats = async (authOptions = {}) => {
    try {
      // Get auth token for authenticated requests
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Fetch active rentals to calculate revenue
      const rentalResponse = await api.get('/rentals/present', { headers });
      
      if (rentalResponse.data.success && rentalResponse.data.data) {
        const rentals = rentalResponse.data.data;
        
        // Calculate total revenue by summing up totalPrice from all rentals
        const totalRevenue = rentals.reduce((sum, rental) => sum + (rental.totalPrice || 0), 0);
        
        // Process rental data into weekly, monthly, and yearly formats
        const revenueData = processRentalDataForRevenue(rentals);
        
        // Set the processed data
        setRevenueStats({
          ...revenueData,
          totalRevenue
        });
        
        // Debug logs
        console.log('Total Revenue:', totalRevenue);
        console.log('Revenue Data:', revenueData);
      } else {
        console.error('Error fetching rental data for revenue:', rentalResponse);
        // Use fallback empty data
        setRevenueStats({
          weekly: [],
          monthly: [],
          yearly: [],
          totalRevenue: 0
        });
      }
    } catch (err) {
      console.error('Error fetching revenue stats:', err);
      // Set fallback empty data
      setRevenueStats({
        weekly: [],
        monthly: [],
        yearly: [],
        totalRevenue: 0
      });
    }
  };
  
  // Process rental data into revenue time series data
  const processRentalDataForRevenue = (rentals) => {
    // Get current date for calculations
    const currentDate = new Date();
    
    // Create date objects for time ranges
    const oneWeekAgo = new Date(currentDate);
    oneWeekAgo.setDate(currentDate.getDate() - 7);
    
    const oneMonthAgo = new Date(currentDate);
    oneMonthAgo.setMonth(currentDate.getMonth() - 1);
    
    const oneYearAgo = new Date(currentDate);
    oneYearAgo.setFullYear(currentDate.getFullYear() - 1);
    
    // Weekly data (last 7 days)
    const weeklyData = Array(7).fill(0).map((_, index) => {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() - (6 - index));
      
      const dayRentals = rentals.filter(rental => {
        const rentalDate = new Date(rental.createdAt);
        return rentalDate.getDate() === date.getDate() &&
               rentalDate.getMonth() === date.getMonth() &&
               rentalDate.getFullYear() === date.getFullYear();
      });
      
      const dayRevenue = dayRentals.reduce((sum, rental) => sum + (rental.totalPrice || 0), 0);
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
      
      return {
        name: dayName,
        revenue: dayRevenue,
        transactions: dayRentals.length
      };
    });
    
    // Monthly data (last 30 days)
    const monthlyData = Array(30).fill(0).map((_, index) => {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() - (29 - index));
      
      const dayRentals = rentals.filter(rental => {
        const rentalDate = new Date(rental.createdAt);
        return rentalDate.getDate() === date.getDate() &&
               rentalDate.getMonth() === date.getMonth() &&
               rentalDate.getFullYear() === date.getFullYear();
      });
      
      const dayRevenue = dayRentals.reduce((sum, rental) => sum + (rental.totalPrice || 0), 0);
      
      return {
        name: date.getDate().toString(),
        revenue: dayRevenue,
        transactions: dayRentals.length
      };
    });
    
    // Yearly data (12 months)
    const yearlyData = Array(12).fill(0).map((_, index) => {
      const monthRentals = rentals.filter(rental => {
        const rentalDate = new Date(rental.createdAt);
        return rentalDate.getMonth() === index &&
               rentalDate.getFullYear() === currentDate.getFullYear();
      });
      
      const monthRevenue = monthRentals.reduce((sum, rental) => sum + (rental.totalPrice || 0), 0);
      const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index];
      
      return {
        name: monthName,
        revenue: monthRevenue,
        transactions: monthRentals.length
      };
    });
    
    return {
      weekly: weeklyData,
      monthly: monthlyData,
      yearly: yearlyData
    };
  };
  
  // Format revenue data by time periods
  const formatRevenueData = (payments, currentDate) => {
    // Get the start dates for different time periods
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
    
    // Filter payments by time period
    const weeklyPayments = payments.filter(p => new Date(p.createdAt) >= startOfWeek);
    const monthlyPayments = payments.filter(p => new Date(p.createdAt) >= startOfMonth);
    const yearlyPayments = payments.filter(p => new Date(p.createdAt) >= startOfYear);
    
    // Group by day, month, and year
    const weekly = groupPaymentsByDay(weeklyPayments, 7, startOfWeek);
    const monthly = groupPaymentsByDay(monthlyPayments, 30, startOfMonth);
    const yearly = groupPaymentsByMonth(yearlyPayments);
    
    // Calculate total revenue
    const totalRevenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    return {
      weekly,
      monthly,
      yearly,
      totalRevenue
    };
  };
  
  // Helper to group payments by day
  const groupPaymentsByDay = (payments, daysCount, startDate) => {
    const days = [];
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < daysCount; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayPayments = payments.filter(p => {
        const paymentDate = new Date(p.createdAt);
        return paymentDate.getDate() === date.getDate() && 
               paymentDate.getMonth() === date.getMonth() && 
               paymentDate.getFullYear() === date.getFullYear();
      });
      
      const dayRevenue = dayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      days.push({
        name: daysCount <= 7 ? dayLabels[date.getDay()] : `${date.getDate()}`,
        revenue: dayRevenue,
        transactions: dayPayments.length
      });
    }
    
    return days;
  };
  
  // Helper to group payments by month
  const groupPaymentsByMonth = (payments) => {
    const months = [];
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 12; i++) {
      const monthPayments = payments.filter(p => {
        const paymentDate = new Date(p.createdAt);
        return paymentDate.getMonth() === i;
      });
      
      const monthRevenue = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      months.push({
        name: monthLabels[i],
        revenue: monthRevenue,
        transactions: monthPayments.length
      });
    }
    
    return months;
  };
  
  // Generate mock revenue data when API is not available
  const generateMockRevenueData = () => {
    const mockData = {
      weekly: Array.from({ length: 7 }, (_, i) => ({
        name: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
        revenue: Math.floor(Math.random() * 300000000) + 50000000, // VND values
        transactions: Math.floor(Math.random() * 30) + 5,
      })),
      monthly: Array.from({ length: 30 }, (_, i) => ({
        name: `${i + 1}`,
        revenue: Math.floor(Math.random() * 500000000) + 100000000, // VND values
        transactions: Math.floor(Math.random() * 50) + 10,
      })),
      yearly: Array.from({ length: 12 }, (_, i) => ({
        name: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
        revenue: Math.floor(Math.random() * 5000000000) + 1000000000, // VND values
        transactions: Math.floor(Math.random() * 300) + 50,
      })),
      totalRevenue: Math.floor(Math.random() * 50000000000) + 10000000000 // VND values
    };
    
    setRevenueStats(mockData);
  };

  // Fetch rental statistics
  const fetchRentalStats = async () => {
    try {
      // Get general rental stats
      const headers = { 
        Authorization: `Bearer ${localStorage.getItem('token')}` 
      };
      
      // Get active rentals
      const presentResponse = await api.get('/rentals/present', { headers });
      
      // Initialize rental stats
      const stats = {
        totalRentals: 0,
        activeRentals: 0,
        completedRentals: 0,
        cancelledRentals: 0
      };
      
      if (presentResponse.data.success) {
        // Get rental data and pagination
        const activeRentals = presentResponse.data.data || [];
        
        // Get total count from pagination if available
        if (presentResponse.data.pagination && presentResponse.data.pagination.total) {
          stats.totalRentals = presentResponse.data.pagination.total;
        }
        
        // Count rentals by status
        let activeCount = 0;
        let completedCount = 0;
        let cancelledCount = 0;
        
        activeRentals.forEach(rental => {
          if (rental.status === 'pending' || rental.status === 'approved' || rental.status === 'started') {
            activeCount++;
          } else if (rental.status === 'completed') {
            completedCount++;
          } else if (rental.status === 'cancelled') {
            cancelledCount++;
          }
        });
        
        stats.activeRentals = activeCount;
        stats.completedRentals = completedCount;
        stats.cancelledRentals = cancelledCount;
        
        // Try to get total count if not available from pagination
        if (!stats.totalRentals) {
          try {
            const countResponse = await api.get('/rentals/count', { headers });
            if (countResponse.data.success) {
              stats.totalRentals = countResponse.data.data.count || 0;
            }
          } catch (countErr) {
            console.error('Could not fetch rental count:', countErr);
            // Fallback: sum of active, completed, and cancelled
            stats.totalRentals = activeCount + completedCount + cancelledCount;
          }
        }
        
        // Debug logs
        console.log('Rental stats:', stats);
        
        setRentalStats(stats);
      }
    } catch (err) {
      console.error('Error fetching rental stats:', err);
      // Set fallback values
      setRentalStats({
        totalRentals: 0,
        activeRentals: 0,
        completedRentals: 0,
        cancelledRentals: 0
      });
    }
  };

  // Get revenue data based on selected time range
  const currentRevenueData = useMemo(() => {
    return revenueStats[timeRange] || [];
  }, [revenueStats, timeRange]);

  // Calculate total revenue
  const totalRevenue = useMemo(() => {
    if (revenueStats.totalRevenue !== undefined) {
      return revenueStats.totalRevenue;
    }
    return currentRevenueData.reduce((sum, item) => sum + item.revenue, 0);
  }, [revenueStats, currentRevenueData]);
  
  // Calculate reasonable Y-axis scale for the chart based on data distribution
  const yAxisScale = useMemo(() => {
    if (!currentRevenueData || currentRevenueData.length === 0) {
      return { max: 100, mid: 50, min: 0 };
    }
    
    // Get the revenue values and sort them
    const values = currentRevenueData.map(item => item.revenue).sort((a, b) => a - b);
    const max = values[values.length - 1];
    
    // If there's a very large outlier, we'll use a more reasonable scale
    // by finding the second highest value if there's a big gap
    if (values.length > 1) {
      const secondHighest = values[values.length - 2];
      // If the highest value is more than 5x the second highest, use a different scale
      if (max > secondHighest * 5 && secondHighest > 0) {
        // Use the second highest as base and add some headroom
        const adjustedMax = secondHighest * 1.5;
        return {
          max: adjustedMax,
          mid: adjustedMax / 2,
          min: 0,
          hasOutlier: true,
          outlier: max
        };
      }
    }
    
    // Normal case - use the actual maximum with some headroom
    return {
      max: max * 1.2, // Add 20% headroom
      mid: max * 0.6,
      min: 0
    };
  }, [currentRevenueData]);

  // Get rental data based on status
  const rentalStatusData = useMemo(() => {
    if (!rentalStats) return [];
    
    return [
      { name: 'Active', value: rentalStats.activeRentals, color: '#4caf50' },
      { name: 'Completed', value: rentalStats.completedRentals, color: '#2196f3' },
      { name: 'Cancelled', value: rentalStats.cancelledRentals, color: '#f44336' }
    ];
  }, [rentalStats]);

  // Calculate total for percentage computation
  const rentalStatusTotal = useMemo(() => {
    return rentalStatusData.reduce((acc, item) => acc + item.value, 0) || 1; // Avoid division by zero
  }, [rentalStatusData]);

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
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ mb: 4, px: 2 }}>
      {/* Header */}
      <Typography 
        variant="h5" 
        gutterBottom 
        fontWeight="600" 
        color="primary"
        sx={{ 
          mb: 3,
          fontSize: { xs: '1.5rem', md: '1.8rem' },
          borderBottom: '2px solid',
          borderColor: 'primary.light',
          pb: 1
        }}
      >
        Dashboard Overview
      </Typography>
      
      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: 'Total Customers',
            value: userStats.totalCustomers,
            icon: PeopleAlt,
            gradient: 'linear-gradient(45deg, #3f51b5 30%, #7986cb 90%)',
            subtitle: 'Active Users'
          },
          {
            title: 'Total Vehicles',
            value: vehicleStats.totalVehicles,
            icon: DirectionsCar,
            gradient: 'linear-gradient(45deg, #009688 30%, #4db6ac 90%)',
            subtitle: `${vehicleStats.availableVehicles} Available`
          },
          {
            title: 'Total Rentals',
            value: rentalStats.totalRentals,
            icon: Timeline,
            gradient: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
            subtitle: `${rentalStats.activeRentals} Active`
          },
          {
            title: 'Total Revenue',
            value: formatCompactCurrency(totalRevenue),
            icon: AttachMoney,
            gradient: 'linear-gradient(45deg, #e91e63 30%, #f48fb1 90%)',
            subtitle: 'All Time'
          }
        ].map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              elevation={2}
              sx={{ 
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': { 
                  transform: 'translateY(-5px)',
                  boxShadow: (theme) => theme.shadows[8]
                },
                background: metric.gradient,
                color: 'white',
                height: '100%',
                minHeight: 140
              }}
            >
              <CardContent sx={{ height: '100%', p: 3 }}>
                <Box display="flex" flexDirection="column" height="100%" justifyContent="space-between">
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1, fontSize: '0.9rem' }}>
                        {metric.title}
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.8rem', md: '2rem' } }}>
                        {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                      </Typography>
                    </Box>
                    <metric.icon sx={{ fontSize: '2.5rem', opacity: 0.8 }} />
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.8, mt: 2, fontSize: '0.85rem' }}>
                    {metric.subtitle}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Revenue Chart */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: { xs: 2, md: 3 }, 
              borderRadius: 3,
              background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)',
              minHeight: { xs: 400, md: 500 }  // Increased minimum height
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
              <Typography variant="h6" fontWeight="600" sx={{ fontSize: { xs: '1.2rem', md: '1.4rem' } }}>
                Revenue Overview
              </Typography>
              <Tabs 
                value={timeRange} 
                onChange={(e, newValue) => setTimeRange(newValue)}
                textColor="primary"
                indicatorColor="primary"
                sx={{
                  '& .MuiTab-root': {
                    fontSize: { xs: '0.9rem', md: '1rem' },
                    minWidth: { xs: 100, md: 120 },
                    px: { xs: 3, md: 4 }
                  }
                }}
              >
                <Tab value="weekly" label="WEEKLY" />
                <Tab value="monthly" label="MONTHLY" />
                <Tab value="yearly" label="YEARLY" />
              </Tabs>
            </Box>
            
            {currentRevenueData && currentRevenueData.length > 0 ? (
              <Box sx={{ 
                height: { xs: 350, md: 450 },  // Increased chart height
                position: 'relative', 
                mb: 4,
                mt: 2  // Added top margin
              }}>
                {/* Chart Container */}
                <Box sx={{ 
                  height: { xs: 300, md: 400 },  // Increased container height
                  width: '100%',
                  position: 'relative',
                  boxSizing: 'border-box',
                  pt: 1
                }}>
                  {/* Y-axis labels on the left */}
                  <Box sx={{ 
                    position: 'absolute', 
                    left: 0, 
                    top: 0, 
                    bottom: 0, 
                    width: { xs: 70, md: 80 },  // Increased label width
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    pr: 2, 
                    pb: 2, 
                    fontSize: { xs: '0.8rem', md: '0.9rem' },  // Increased font size
                    color: 'text.secondary'
                  }}>
                    <Typography variant="caption" sx={{ 
                      textAlign: 'right', 
                      width: '100%',
                      fontSize: { xs: '0.8rem', md: '0.9rem' }  // Increased font size
                    }}>
                      {formatCompactCurrency(yAxisScale.max)}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      textAlign: 'right', 
                      width: '100%',
                      fontSize: { xs: '0.8rem', md: '0.9rem' }
                    }}>
                      {formatCompactCurrency(yAxisScale.mid)}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      textAlign: 'right', 
                      width: '100%',
                      fontSize: { xs: '0.8rem', md: '0.9rem' }
                    }}>
                      {formatCompactCurrency(yAxisScale.min)}
                    </Typography>
                  </Box>

                  {/* The Chart Area */}
                  <Box sx={{ 
                    position: 'absolute', 
                    left: { xs: 70, md: 80 },  // Adjusted left margin
                    right: { xs: 10, md: 20 },  // Added right margin
                    top: 0, 
                    bottom: 0, 
                    pb: 2 
                  }}>
                    {/* Background Grid Lines */}
                    <Box sx={{ 
                      position: 'absolute', 
                      left: 0, 
                      right: 0, 
                      top: 0, 
                      bottom: 0, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between' 
                    }}>
                      {[0, 1, 2].map((index) => (
                        <Box 
                          key={index} 
                          sx={{ 
                            width: '100%', 
                            height: '1px', 
                            bgcolor: 'rgba(0,0,0,0.06)',
                            position: 'relative'
                          }} 
                        />
                      ))}
                      {/* Vertical grid lines */}
                      <Box sx={{ 
                        position: 'absolute', 
                        top: 0, 
                        bottom: 0, 
                        left: 0, 
                        right: 0, 
                        display: 'flex', 
                        justifyContent: 'space-between' 
                      }}>
                        {Array.from({ length: 6 }).map((_, index) => (
                          <Box 
                            key={index} 
                            sx={{ 
                              width: '1px', 
                              height: '100%', 
                              bgcolor: 'rgba(0,0,0,0.04)' 
                            }} 
                          />
                        ))}
                      </Box>
                    </Box>

                    {/* Actual Chart SVG */}
                    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                      <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                        <defs>
                          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={`${theme.palette.primary.main}80`} />
                            <stop offset="100%" stopColor={`${theme.palette.primary.main}00`} />
                          </linearGradient>
                          <filter id="glow" height="130%" width="130%">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                            <feMerge>
                              <feMergeNode in="coloredBlur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                          <filter id="shadow" height="130%" width="130%">
                            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="rgba(0,0,0,0.1)" />
                          </filter>
                        </defs>

                        {/* Area Chart */}
                        {(() => {
                          // Use the calculated scale instead of the raw maximum
                          const maxValue = yAxisScale.max;
                          const width = 100 / (currentRevenueData.length - 1 || 1);
                          
                          // Create path for the area - handle the case of a single data point
                          let areaPath = '';
                          let linePath = '';
                          
                          // Add line segments between points
                          currentRevenueData.forEach((item, i) => {
                            const x = i * width;
                            // Cap percentage at 100% to handle outliers
                            const y = 100 - Math.min(100, (item.revenue / maxValue * 100));
                            
                            if (i === 0) {
                              areaPath = `M ${x} ${y}`;
                              linePath = `M ${x} ${y}`;
                            } else {
                              // Use curved lines for smoother appearance
                              const prevX = (i - 1) * width;
                              const prevY = 100 - Math.min(100, (currentRevenueData[i-1].revenue / maxValue * 100));
                              
                              // Control points for the curve
                              const cpx1 = prevX + (x - prevX) / 2;
                              const cpx2 = prevX + (x - prevX) / 2;
                              
                              linePath += ` C ${cpx1} ${prevY}, ${cpx2} ${y}, ${x} ${y}`;
                              areaPath += ` C ${cpx1} ${prevY}, ${cpx2} ${y}, ${x} ${y}`;
                            }
                          });
                          
                          // Complete the area by adding bottom corners
                          if (currentRevenueData.length > 0) {
                            const lastX = (currentRevenueData.length - 1) * width;
                            areaPath += ` L ${lastX} 100 L 0 100 Z`;
                          }
                          
                          return (
                            <>
                              {/* Filled area below the line */}
                              <path
                                d={areaPath}
                                fill="url(#areaGradient)"
                                stroke="none"
                                opacity="0.7"
                                filter="url(#shadow)"
                              />
                              
                              {/* Line on top */}
                              <path
                                d={linePath}
                                fill="none"
                                stroke={theme.palette.primary.main}
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                filter="url(#glow)"
                              />
                            </>
                          );
                        })()}

                        {/* Data Points */}
                        {currentRevenueData.map((item, i) => {
                          const maxValue = yAxisScale.max;
                          const width = 100 / (currentRevenueData.length - 1 || 1);
                          const x = i * width;
                          // Cap percentage at 100% to handle outliers
                          const y = 100 - Math.min(100, (item.revenue / maxValue * 100));
                          
                          // Note if this is an outlier value
                          const isOutlier = yAxisScale.hasOutlier && item.revenue > yAxisScale.max;
                          // Find peak value (highest revenue in the dataset)
                          const isPeak = item.revenue === Math.max(...currentRevenueData.map(d => d.revenue));
                          
                          return (
                            <g key={i} className="data-point-group">
                              {/* Pulsating animation for peak point */}
                              {isPeak && (
                                <circle
                                  cx={x}
                                  cy={y}
                                  r="8"
                                  fill={`${theme.palette.primary.main}40`}
                                  className="pulse-circle"
                                />
                              )}
                              
                              <circle
                                cx={x}
                                cy={y}
                                r={isPeak ? "6" : "5"}
                                fill="white"
                                stroke={isOutlier || isPeak ? theme.palette.secondary.main : theme.palette.primary.main}
                                strokeWidth={isPeak ? "3" : "2"}
                                className="data-point"
                                style={{
                                  transition: "all 0.2s ease-out",
                                  cursor: "pointer"
                                }}
                              />
                              
                              {/* Show value above peak point */}
                              {isPeak && (
                                <text
                                  x={x}
                                  y={y - 12}
                                  textAnchor="middle"
                                  fill={theme.palette.text.primary}
                                  fontSize="11"
                                  fontWeight="bold"
                                  filter="url(#glow)"
                                >
                                  {formatCompactCurrency(item.revenue)}
                                </text>
                              )}
                              
                              {/* Enhanced Tooltip */}
                              <g className="tooltip" opacity="0" pointerEvents="none">
                                <rect
                                  x={x - 55}
                                  y={y - 60}
                                  width="110"
                                  height="48"
                                  rx="6"
                                  fill={theme.palette.background.paper}
                                  stroke={theme.palette.divider}
                                  strokeWidth="1"
                                  filter="url(#shadow)"
                                />
                                <text
                                  x={x}
                                  y={y - 42}
                                  textAnchor="middle"
                                  fill={theme.palette.text.primary}
                                  fontSize="11"
                                  fontWeight="bold"
                                >
                                  {formatCurrency(item.revenue)}
                                </text>
                                <text
                                  x={x}
                                  y={y - 25}
                                  textAnchor="middle"
                                  fill={theme.palette.text.secondary}
                                  fontSize="10"
                                >
                                  {item.transactions} transaction{item.transactions !== 1 ? 's' : ''}
                                </text>
                                <text
                                  x={x}
                                  y={y - 10}
                                  textAnchor="middle"
                                  fill={theme.palette.primary.main}
                                  fontSize="10"
                                  fontWeight="600"
                                >
                                  {item.name}
                                </text>
                                
                                {/* Triangle pointer */}
                                <path
                                  d={`M ${x-5} ${y-12} L ${x+5} ${y-12} L ${x} ${y-5} Z`}
                                  fill={theme.palette.background.paper}
                                  stroke={theme.palette.divider}
                                  strokeWidth="1"
                                />
                              </g>
                            </g>
                          );
                        })}
                      </svg>
                    </Box>
                  </Box>
                </Box>

                {/* X-Axis Labels */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  pl: { xs: 8, md: 10 },  // Increased left padding
                  pr: { xs: 1, md: 2 },
                  mt: 2  // Increased top margin
                }}>
                  {currentRevenueData.map((item, i) => (
                    <Typography 
                      key={i} 
                      variant="caption" 
                      sx={{ 
                        color: 'text.secondary',
                        fontSize: { xs: '0.8rem', md: '0.9rem' },  // Increased font size
                        fontWeight: 500,
                        transform: currentRevenueData.length > 15 ? 'rotate(-45deg)' : 'none',
                        transformOrigin: 'center top',
                        width: `${100 / currentRevenueData.length}%`,
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: currentRevenueData.length > 15 ? '50px' : '70px'  // Increased max width
                      }}
                    >
                      {item.name}
                    </Typography>
                  ))}
                </Box>

                {/* Chart Notes - only show if there are outliers */}
                {yAxisScale.hasOutlier && (
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        bgcolor: 'rgba(233, 30, 99, 0.1)',
                        px: 2,
                        py: 1,
                        borderRadius: 2,
                        fontSize: { xs: '0.8rem', md: '0.9rem' }
                      }}
                    >
                      <Typography variant="caption" sx={{ fontSize: 'inherit' }}>
                        Chart scaled to show trend. Peak value: {formatCurrency(yAxisScale.outlier)}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* CSS for hover effects */}
                <style jsx>{`
                  .data-point-group:hover .data-point {
                    r: 8;
                    filter: drop-shadow(0px 0px 4px ${theme.palette.primary.main});
                    transition: all 0.2s;
                  }
                  .data-point-group:hover .tooltip {
                    opacity: 1;
                    transition: opacity 0.3s;
                  }
                  @keyframes pulse {
                    0% { r: 8; opacity: 0.6; }
                    50% { r: 12; opacity: 0.4; }
                    100% { r: 8; opacity: 0.6; }
                  }
                  .pulse-circle {
                    animation: pulse 2s infinite;
                  }
                `}</style>
              </Box>
            ) : (
              <Box 
                sx={{ 
                  width: '100%', 
                  height: { xs: 350, md: 450 },  // Matched empty state height
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  flexDirection: 'column',
                  color: 'text.secondary' 
                }}
              >
                <Typography variant="body2" mb={1}>No revenue data available</Typography>
                <TrendingUp fontSize="large" color="disabled" />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Bottom Section */}
      <Grid container spacing={3}>
        {/* Rental Status Distribution */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: { xs: 2, md: 3 }, 
              borderRadius: 3,
              height: '100%',
              minHeight: 400,
              background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)'
            }}
          >
            <Typography 
              variant="h6" 
              fontWeight="600" 
              gutterBottom 
              sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}
            >
              Rental Status Distribution
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {rentalStatusTotal > 0 ? (
              <Box sx={{ position: 'relative', width: 220, height: 220, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {/* SVG Donut Chart */}
                <svg width="220" height="220" viewBox="0 0 220 220">
                  <defs>
                    {rentalStatusData.map((item, i) => (
                      <filter key={`shadow-${i}`} id={`shadow-${i}`} height="130%">
                        <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={item.color} />
                      </filter>
                    ))}
                  </defs>
                  
                  {/* Draw the donut segments */}
                  {rentalStatusData.map((item, i) => {
                    // Calculate the percentage to determine arc length
                    const percentage = (item.value / rentalStatusTotal);
                    
                    // We start from the top (270 degrees) and go clockwise
                    // Previous segments determine our starting angle
                    const previousPercentage = rentalStatusData
                      .slice(0, i)
                      .reduce((acc, segment) => acc + (segment.value / rentalStatusTotal), 0);
                    
                    // Convert percentages to angles (in degrees)
                    const startAngle = previousPercentage * 360 + 270;
                    const endAngle = startAngle + (percentage * 360);
                    
                    // Convert angles to radians for SVG calculations
                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = (endAngle * Math.PI) / 180;
                    
                    // Calculate points on the circumference
                    const radius = 80; // Outer radius
                    const innerRadius = 50; // Inner radius (for the donut hole)
                    
                    // Outer arc points
                    const startX = 110 + radius * Math.cos(startRad);
                    const startY = 110 + radius * Math.sin(startRad);
                    const endX = 110 + radius * Math.cos(endRad);
                    const endY = 110 + radius * Math.sin(endRad);
                    
                    // Inner arc points
                    const innerStartX = 110 + innerRadius * Math.cos(endRad);
                    const innerStartY = 110 + innerRadius * Math.sin(endRad);
                    const innerEndX = 110 + innerRadius * Math.cos(startRad);
                    const innerEndY = 110 + innerRadius * Math.sin(startRad);
                    
                    // Flag for large arc (> 180 degrees)
                    const largeArcFlag = percentage > 0.5 ? 1 : 0;
                    
                    // Construct the SVG path
                    // Move to start point, draw outer arc, line to inner arc, draw inner arc, close path
                    const path = `M ${startX},${startY} 
                                 A ${radius},${radius} 0 ${largeArcFlag},1 ${endX},${endY} 
                                 L ${innerStartX},${innerStartY} 
                                 A ${innerRadius},${innerRadius} 0 ${largeArcFlag},0 ${innerEndX},${innerEndY} Z`;
                    
                    // Calculate position for percentage text
                    // Midpoint angle to place the text
                    const midAngle = (startAngle + endAngle) / 2;
                    const midRad = (midAngle * Math.PI) / 180;
                    
                    // Text position between the inner and outer radius
                    const textRadius = (radius + innerRadius) / 2 + 5;
                    const textX = 110 + textRadius * Math.cos(midRad);
                    const textY = 110 + textRadius * Math.sin(midRad);
                    
                    // Only show text for segments with enough space
                    const showText = percentage > 0.08;
                    
                    return (
                      <g key={`segment-${i}`} className="chart-segment">
                        <path
                          d={path}
                          fill={item.color}
                          stroke="#fff"
                          strokeWidth="1"
                          filter={`url(#shadow-${i})`}
                          className="segment"
                        />
                        {showText && (
                          <text
                            x={textX}
                            y={textY}
                            textAnchor="middle"
                            fill="#fff"
                            fontSize="12"
                            fontWeight="bold"
                            className="segment-text"
                          >
                            {Math.round(percentage * 100)}%
                          </text>
                        )}
                      </g>
                    );
                  })}
                  
                  {/* Center text with total */}
                  <g>
                    <text
                      x="110"
                      y="100"
                      textAnchor="middle"
                      fontSize="14"
                      fill={theme.palette.text.secondary}
                    >
                      Total Rentals
                    </text>
                    <text
                      x="110"
                      y="130"
                      textAnchor="middle"
                      fontSize="24"
                      fontWeight="bold"
                      fill={theme.palette.text.primary}
                    >
                      {rentalStats.totalRentals}
                    </text>
                  </g>
                </svg>
                
                {/* Hover effects for the segments */}
                <style jsx>{`
                  .chart-segment:hover .segment {
                    transform: translateX(5px) translateY(5px);
                    transition: transform 0.3s ease-out;
                  }
                  .chart-segment:hover .segment-text {
                    font-size: 14px;
                    transition: font-size 0.3s ease-out;
                  }
                `}</style>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'text.secondary' }}>
                <DonutLarge fontSize="large" color="disabled" sx={{ mb: 1 }} />
                <Typography variant="body2">No rental data available</Typography>
              </Box>
            )}
            
            {/* Legend */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 2, flexWrap: 'wrap' }}>
              {rentalStatusData.map((item, i) => (
                <Box 
                  key={`legend-${i}`} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    px: 2,
                    py: 0.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    boxShadow: 1
                  }}
                >
                  <Box 
                    sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      backgroundColor: item.color 
                    }} 
                  />
                  <Typography variant="body2">{item.name}</Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ ml: 0.5 }}>
                    ({item.value})
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
        
        {/* User Activities */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: { xs: 2, md: 3 }, 
              borderRadius: 3,
              height: '100%',
              minHeight: 400,
              background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)'
            }}
          >
            <Typography 
              variant="h6" 
              fontWeight="600" 
              gutterBottom 
              sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}
            >
              User Activities
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {!activityStats || activityStats.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                No activity data available yet.
              </Alert>
            ) : (
              <Box sx={{ height: 'calc(100% - 60px)', overflowY: 'auto' }}>
                {activityStats.map((roleStats) => (
                  <Box key={roleStats._id} sx={{ mb: 3 }}>
                    <Typography 
                      variant="subtitle1" 
                      gutterBottom 
                      sx={{ 
                        fontSize: { xs: '1rem', md: '1.1rem' },
                        fontWeight: 600,
                        color: 'text.primary'
                      }}
                    >
                      {roleStats._id === 'customer' ? 'Customer' : 'Car Provider'} Activities
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {roleStats.activities.map((activity) => (
                        <Box
                          key={activity.type}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            backgroundColor: activityTypeColors[activity.type] || '#757575',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: 2
                            }
                          }}
                        >
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontSize: { xs: '0.75rem', md: '0.85rem' },
                              fontWeight: 500
                            }}
                          >
                            {activity.type.replace(/_/g, ' ')}
                          </Typography>
                          <Box
                            sx={{
                              backgroundColor: 'rgba(255,255,255,0.3)',
                              px: 1,
                              py: 0.5,
                              borderRadius: 10,
                              fontSize: { xs: '0.7rem', md: '0.8rem' },
                              fontWeight: 600
                            }}
                          >
                            {activity.count}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Vehicle Types Distribution */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: { xs: 2, md: 3 }, 
              borderRadius: 3,
              height: '100%',
              minHeight: 400,
              background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)'
            }}
          >
            <Typography 
              variant="h6" 
              fontWeight="600" 
              gutterBottom 
              sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}
            >
              Vehicle Types Distribution
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ height: 'calc(100% - 60px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {vehicleStats.vehicleTypes.map((entry, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 2,
                    p: 1,
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.02)'
                    }
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      width: '30%',
                      fontSize: { xs: '0.85rem', md: '0.95rem' },
                      fontWeight: 500
                    }}
                  >
                    {entry.name}
                  </Typography>
                  <Box sx={{ width: '50%', mr: 2 }}>
                    <Box 
                      sx={{ 
                        height: 16,
                        width: `${(entry.value / vehicleStats.vehicleTypes.reduce((acc, curr) => acc + curr.value, 0)) * 100}%`,
                        backgroundColor: chartColors[index % chartColors.length],
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'scaleX(1.02)',
                          boxShadow: 2
                        }
                      }} 
                    />
                  </Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      width: '20%',
                      fontSize: { xs: '0.85rem', md: '0.95rem' },
                      fontWeight: 600
                    }}
                  >
                    {Math.round((entry.value / vehicleStats.vehicleTypes.reduce((acc, curr) => acc + curr.value, 0)) * 100)}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardStats; 