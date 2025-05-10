import React, { Component } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Home as HomeIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <Box 
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            p: 3
          }}
        >
          <Paper 
            sx={{ 
              p: 4, 
              maxWidth: 600, 
              textAlign: 'center',
              borderRadius: 2,
              boxShadow: 3
            }}
          >
            <Typography variant="h4" color="error" gutterBottom>
              Something went wrong
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 3 }}>
              We apologize for the inconvenience. An error occurred while rendering this component.
            </Typography>
            
            {this.state.error && (
              <Box 
                sx={{ 
                  bgcolor: 'background.paper', 
                  borderRadius: 1,
                  p: 2,
                  mb: 3,
                  textAlign: 'left',
                  overflow: 'auto',
                  maxHeight: 200
                }}
              >
                <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
                  {this.state.error.toString()}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleRefresh}
              >
                Refresh Page
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                component={Link}
                to="/"
              >
                Go to Homepage
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary; 