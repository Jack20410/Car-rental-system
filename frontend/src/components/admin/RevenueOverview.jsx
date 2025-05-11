import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO, subDays, subMonths } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  ButtonGroup,
  Button,
  useTheme,
  IconButton,
  Tooltip as MuiTooltip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  Refresh,
  ArrowUpward,
  ArrowDownward,
  Info,
  ZoomIn,
  ZoomOut,
} from '@mui/icons-material';
import api from '../../utils/api';
import { formatCurrency, formatCompactCurrency } from '../../utils/formatCurrency';

const RevenueOverview = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('weekly');
  const [refreshKey, setRefreshKey] = useState(0);
  const [fullScreen, setFullScreen] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Revenue data
  const [revenueStats, setRevenueStats] = useState({
    weekly: [],
    monthly: [],
    yearly: [],
    totalRevenue: 0,
  });

  // Fetch revenue data - preserving the existing API URL structure
  useEffect(() => {
    const fetchRevenueData = async () => {
      setLoading(true);
      try {
        // Get auth token for authenticated requests
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        // Fetch active rentals to calculate revenue - preserving existing API URL
        const rentalResponse = await api.get('/rentals/present', { headers });
        
        if (rentalResponse.data.success && rentalResponse.data.data) {
          const rentals = rentalResponse.data.data;
          
          // Calculate total revenue
          const totalRevenue = rentals.reduce((sum, rental) => sum + (rental.totalPrice || 0), 0);
          
          // Process rental data into weekly, monthly, and yearly formats
          const revenueData = processRentalDataForRevenue(rentals);
          
          // Set the processed data
          setRevenueStats({
            ...revenueData,
            totalRevenue,
          });
          
          console.log('Revenue data loaded successfully');
        } else {
          console.error('Error fetching rental data for revenue:', rentalResponse);
          // Use mock data if API returns no data or error
          generateMockRevenueData();
        }
      } catch (err) {
        console.error('Error fetching revenue stats:', err);
        // Generate mock data in case of errors
        generateMockRevenueData();
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, [refreshKey]);

  // Process rental data into revenue time series
  const processRentalDataForRevenue = (rentals) => {
    // Get current date for calculations
    const currentDate = new Date();
    
    // Weekly data (last 7 days)
    const weeklyData = Array(7).fill(0).map((_, index) => {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() - (6 - index));
      
      const dayRentals = rentals.filter(rental => {
        const rentalDate = new Date(rental.createdAt);
        return (
          rentalDate.getDate() === date.getDate() &&
          rentalDate.getMonth() === date.getMonth() &&
          rentalDate.getFullYear() === date.getFullYear()
        );
      });
      
      const dayRevenue = dayRentals.reduce((sum, rental) => sum + (rental.totalPrice || 0), 0);
      return {
        name: format(date, 'EEE'),
        fullDate: format(date, 'dd MMM yyyy'),
        revenue: dayRevenue,
        transactions: dayRentals.length,
      };
    });
    
    // Monthly data (last 30 days)
    const monthlyData = Array(30).fill(0).map((_, index) => {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() - (29 - index));
      
      const dayRentals = rentals.filter(rental => {
        const rentalDate = new Date(rental.createdAt);
        return (
          rentalDate.getDate() === date.getDate() &&
          rentalDate.getMonth() === date.getMonth() &&
          rentalDate.getFullYear() === date.getFullYear()
        );
      });
      
      const dayRevenue = dayRentals.reduce((sum, rental) => sum + (rental.totalPrice || 0), 0);
      return {
        name: format(date, 'd'),
        fullDate: format(date, 'dd MMM yyyy'),
        revenue: dayRevenue,
        transactions: dayRentals.length,
      };
    });
    
    // Yearly data (12 months)
    const yearlyData = Array(12).fill(0).map((_, index) => {
      const monthRentals = rentals.filter(rental => {
        const rentalDate = new Date(rental.createdAt);
        return rentalDate.getMonth() === index && rentalDate.getFullYear() === currentDate.getFullYear();
      });
      
      const monthRevenue = monthRentals.reduce((sum, rental) => sum + (rental.totalPrice || 0), 0);
      return {
        name: format(new Date(currentDate.getFullYear(), index, 1), 'MMM'),
        fullDate: format(new Date(currentDate.getFullYear(), index, 1), 'MMMM yyyy'),
        revenue: monthRevenue,
        transactions: monthRentals.length,
      };
    });
    
    return {
      weekly: weeklyData,
      monthly: monthlyData,
      yearly: yearlyData,
    };
  };

  // Generate mock revenue data
  const generateMockRevenueData = () => {
    const currentDate = new Date();
    
    const weeklyData = Array(7).fill(0).map((_, i) => {
      const date = subDays(currentDate, 6 - i);
      return {
        name: format(date, 'EEE'),
        fullDate: format(date, 'dd MMM yyyy'),
        revenue: Math.floor(Math.random() * 300000000) + 50000000, // VND values
        transactions: Math.floor(Math.random() * 30) + 5,
      };
    });
    
    const monthlyData = Array(30).fill(0).map((_, i) => {
      const date = subDays(currentDate, 29 - i);
      return {
        name: format(date, 'd'),
        fullDate: format(date, 'dd MMM yyyy'),
        revenue: Math.floor(Math.random() * 500000000) + 100000000, // VND values
        transactions: Math.floor(Math.random() * 50) + 10,
      };
    });
    
    const yearlyData = Array(12).fill(0).map((_, i) => {
      const date = new Date(currentDate.getFullYear(), i, 1);
      return {
        name: format(date, 'MMM'),
        fullDate: format(date, 'MMMM yyyy'),
        revenue: Math.floor(Math.random() * 5000000000) + 1000000000, // VND values
        transactions: Math.floor(Math.random() * 300) + 50,
      };
    });
    
    setRevenueStats({
      weekly: weeklyData,
      monthly: monthlyData,
      yearly: yearlyData,
      totalRevenue: weeklyData.reduce((sum, item) => sum + item.revenue, 0),
    });
  };

  // Get current revenue data based on selected time range
  const currentRevenueData = useMemo(() => {
    return revenueStats[timeRange] || [];
  }, [revenueStats, timeRange]);

  // Calculate stats for the current period
  const periodStats = useMemo(() => {
    if (!currentRevenueData.length) return { total: 0, avg: 0, max: 0, trend: 0 };
    
    const total = currentRevenueData.reduce((sum, item) => sum + item.revenue, 0);
    const avg = total / currentRevenueData.length;
    const max = Math.max(...currentRevenueData.map(item => item.revenue));
    
    // Calculate trend (change percentage)
    const firstHalf = currentRevenueData.slice(0, Math.floor(currentRevenueData.length / 2));
    const secondHalf = currentRevenueData.slice(Math.floor(currentRevenueData.length / 2));
    
    const firstHalfTotal = firstHalf.reduce((sum, item) => sum + item.revenue, 0);
    const secondHalfTotal = secondHalf.reduce((sum, item) => sum + item.revenue, 0);
    
    // Avoid division by zero
    const trend = firstHalfTotal === 0 
      ? secondHalfTotal > 0 ? 100 : 0
      : Math.round(((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100);
    
    return { total, avg, max, trend };
  }, [currentRevenueData]);

  // Calculate Y-axis scale
  const yAxisScale = useMemo(() => {
    if (!currentRevenueData || currentRevenueData.length === 0) {
      return { max: 100, mid: 50, min: 0 };
    }
    
    const values = currentRevenueData.map(item => item.revenue).sort((a, b) => a - b);
    const max = values[values.length - 1];
    
    // Handle outliers
    if (values.length > 1) {
      const secondHighest = values[values.length - 2];
      if (max > secondHighest * 5 && secondHighest > 0) {
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
    
    return {
      max: max * 1.2, // Add 20% headroom
      mid: max * 0.6,
      min: 0
    };
  }, [currentRevenueData]);

  // Handle click on a time range tab
  const handleTimeRangeChange = (event, newValue) => {
    setTimeRange(newValue);
    setHoveredPoint(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper 
        elevation={0} 
        sx={{
          p: 3,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          position: 'relative',
          transition: 'all 0.3s ease',
          ...(fullScreen && {
            position: 'fixed',
            top: '10px',
            left: '10px',
            right: '10px',
            bottom: '10px',
            zIndex: 1300,
            maxHeight: 'calc(100vh - 20px)',
            overflow: 'auto'
          })
        }}
      >
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center">
            <AttachMoney sx={{ fontSize: 28, color: 'primary.main', mr: 1 }} />
            <Typography variant="h6" fontWeight="bold">
              Revenue Overview
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            <Tabs 
              value={timeRange} 
              onChange={handleTimeRangeChange}
              sx={{
                '& .MuiTabs-indicator': {
                  backgroundColor: 'primary.main',
                  height: 3,
                  borderRadius: 1,
                },
                '& .MuiTab-root': {
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  minWidth: 'auto',
                },
                '& .Mui-selected': {
                  color: 'primary.main',
                }
              }}
            >
              <Tab value="weekly" label="Weekly" />
              <Tab value="monthly" label="Monthly" />
              <Tab value="yearly" label="Yearly" />
            </Tabs>
            
            <Box display="flex" gap={1}>
              <Tooltip title="Refresh Data">
                <IconButton onClick={() => setRefreshKey(prev => prev + 1)} size="small">
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Tooltip title={fullScreen ? "Exit Fullscreen" : "Fullscreen"}>
                <IconButton onClick={() => setFullScreen(prev => !prev)} size="small">
                  {fullScreen ? <ZoomOut /> : <ZoomIn />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
        
        {/* Stats Summary */}
        <Box 
          display="flex" 
          gap={3} 
          mb={3} 
          sx={{
            flexDirection: { xs: 'column', md: 'row' }
          }}
        >
          {[
            { 
              label: 'Total Revenue', 
              value: formatCurrency(periodStats.total),
              icon: <AttachMoney sx={{ fontSize: 20, color: 'primary.main' }} />
            },
            { 
              label: 'Average Revenue', 
              value: formatCurrency(periodStats.avg),
              icon: <TrendingUp sx={{ fontSize: 20, color: 'info.main' }} />
            },
            { 
              label: 'Highest Revenue', 
              value: formatCurrency(periodStats.max),
              icon: <ArrowUpward sx={{ fontSize: 20, color: 'success.main' }} />
            },
            { 
              label: 'Trend', 
              value: `${periodStats.trend > 0 ? '+' : ''}${periodStats.trend}%`,
              icon: periodStats.trend >= 0 
                ? <ArrowUpward sx={{ fontSize: 20, color: 'success.main' }} />
                : <ArrowDownward sx={{ fontSize: 20, color: 'error.main' }} />,
              color: periodStats.trend >= 0 ? 'success.main' : 'error.main'
            },
          ].map((stat, index) => (
            <Box 
              key={index}
              sx={{
                flex: 1,
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'background.paper',
                boxShadow: theme.shadows[0],
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: theme.shadows[2],
                  transform: 'translateY(-2px)',
                }
              }}
            >
              <Box display="flex" alignItems="center" mb={0.5}>
                {stat.icon}
                <Typography variant="body2" color="text.secondary" ml={1}>
                  {stat.label}
                </Typography>
              </Box>
              <Typography 
                variant="h6" 
                fontWeight="bold" 
                color={stat.color || 'text.primary'}
              >
                {stat.value}
              </Typography>
            </Box>
          ))}
        </Box>
        
        {/* Chart */}
        {currentRevenueData.length > 0 ? (
          <Box 
            sx={{ 
              position: 'relative',
              height: fullScreen ? 'calc(100vh - 250px)' : 400,
              mt: 4
            }}
          >
            {/* Y-axis labels */}
            <Box 
              sx={{ 
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 40,
                width: 80,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                pr: 2,
                fontSize: '0.85rem',
                color: 'text.secondary',
                zIndex: 1
              }}
            >
              <Typography variant="caption">
                {formatCompactCurrency(yAxisScale.max)}
              </Typography>
              <Typography variant="caption">
                {formatCompactCurrency(yAxisScale.mid)}
              </Typography>
              <Typography variant="caption">
                {formatCompactCurrency(yAxisScale.min)}
              </Typography>
            </Box>
            
            {/* Chart area */}
            <Box 
              sx={{ 
                position: 'absolute',
                left: 80,
                right: 0,
                top: 0,
                bottom: 40,
                borderLeft: '1px dashed',
                borderColor: 'divider'
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={currentRevenueData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                    dy={10}
                  />
                  <YAxis 
                    hide 
                    domain={[0, yAxisScale.max]}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <Box
                            sx={{
                              backgroundColor: 'background.paper',
                              p: 1.5,
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1,
                              boxShadow: 1,
                              minWidth: 150,
                            }}
                          >
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>
                              {formatCurrency(data.revenue)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                              {data.transactions} transaction{data.transactions !== 1 ? 's' : ''}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mt: 0.5 }}>
                              {data.fullDate}
                            </Typography>
                          </Box>
                        );
                      }
                      return null;
                    }}
                  />
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={theme.palette.primary.main}
                    strokeWidth={3}
                    fill="url(#colorRevenue)"
                    activeDot={{ 
                      r: 6, 
                      stroke: theme.palette.background.paper,
                      strokeWidth: 2,
                      fill: theme.palette.primary.main
                    }}
                    dot={{ 
                      r: 4, 
                      stroke: theme.palette.background.paper,
                      strokeWidth: 2,
                      fill: theme.palette.primary.main
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
            
            {/* X-axis labels (these are now handled by the chart component) */}
            <Box 
              sx={{ 
                position: 'absolute',
                left: 80,
                right: 0,
                bottom: 0,
                height: 40,
                borderTop: '1px dashed',
                borderColor: 'divider'
              }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 10,
              color: 'text.secondary',
            }}
          >
            <Info sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6">No revenue data available</Typography>
            <Typography variant="body2" mt={1}>
              Try a different time period or refresh the data
            </Typography>
          </Box>
        )}

        {/* Chart Notes - only show if there are outliers */}
        {yAxisScale.hasOutlier && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Alert severity="info" icon={<Info />} sx={{ borderRadius: 2 }}>
              Chart scaled to show trend. Peak value: {formatCurrency(yAxisScale.outlier)}
            </Alert>
          </Box>
        )}
      </Paper>
    </motion.div>
  );
};

export default RevenueOverview; 