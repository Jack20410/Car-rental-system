import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Typography,
  Alert
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import axios from 'axios';

const AddUserForm = ({ onUserAdded }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    status: 'active'
  });

  const handleOpen = () => {
    setOpen(true);
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    if (!loading) {
      setOpen(false);
      // Reset form
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'user',
        status: 'active'
      });
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!newUser.name.trim()) return 'Name is required';
    if (!newUser.email.trim()) return 'Email is required';
    if (!newUser.password.trim()) return 'Password is required';
    if (newUser.password.length < 6) return 'Password must be at least 6 characters';
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) return 'Invalid email format';
    
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const response = await axios.post('/api/admin/users', newUser);
      
      setSuccess(true);
      // Reset form after successful submission
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'user',
        status: 'active'
      });
      
      // Callback to parent component
      if (onUserAdded) {
        onUserAdded(response.data);
      }
      
      // Close dialog after a short delay
      setTimeout(() => {
        setOpen(false);
      }, 1500);
      
    } catch (err) {
      console.error('Error adding user:', err);
      setError(err.response?.data?.message || 'Failed to add user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={handleOpen}
      >
        Add New User
      </Button>
      
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                User added successfully!
              </Alert>
            )}
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="Full Name"
                  fullWidth
                  required
                  value={newUser.name}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="email"
                  label="Email Address"
                  type="email"
                  fullWidth
                  required
                  value={newUser.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="password"
                  label="Password"
                  type="password"
                  fullWidth
                  required
                  value={newUser.password}
                  onChange={handleChange}
                  disabled={loading}
                  helperText="Password must be at least 6 characters"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={loading}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    name="role"
                    value={newUser.role}
                    label="Role"
                    onChange={handleChange}
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="staff">Staff</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={loading}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={newUser.status}
                    label="Status"
                    onChange={handleChange}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Add User'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default AddUserForm; 