import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import UserDetails from './UserDetails';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const UserManagement = () => {
  const { isAdmin, getAuthState } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [editDialog, setEditDialog] = useState(false);
  const [editUser, setEditUser] = useState({
    id: '',
    name: '',
    email: '',
    role: ''
  });
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'details'

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, filterRole, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Check if user is authenticated with admin role
      const auth = getAuthState();
      if (!auth.isAuthenticated) {
        setError('You must be logged in to view users');
        setUsers([]);
        setFilteredUsers([]);
        setLoading(false);
        return;
      }

      if (!isAdmin()) {
        setError('You must have admin privileges to view user management');
        setUsers([]);
        setFilteredUsers([]);
        setLoading(false);
        return;
      }

      const response = await api.get('/users');
      console.log('API Response:', response.data); // Log the response for debugging
      
      // Extract users from data property in the response
      const usersData = response.data && response.data.data ? response.data.data : [];
      
      // Ensure we're setting arrays
      const usersArray = Array.isArray(usersData) ? usersData : [];
      setUsers(usersArray);
      setFilteredUsers(usersArray);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      if (err.response?.status === 401) {
        setError('Authentication error: You are not authorized to view users');
      } else {
        setError('Failed to load users. Please try again.');
      }
      // Set empty arrays on error
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    // Ensure users is an array before spreading
    if (!Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }
    
    let result = [...users];
    
    // Filter by search term
    if (searchTerm) {
      result = result.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by role
    if (filterRole !== 'all') {
      result = result.filter(user => user.role === filterRole);
    }
    
    setFilteredUsers(result);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleRoleFilterChange = (event) => {
    setFilterRole(event.target.value);
    setPage(0);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setOpenDialog(true);
  };

  const handleEditClick = (user) => {
    setEditUser({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
    setEditDialog(true);
  };

  const handleViewUserDetails = (userId) => {
    setSelectedUserId(userId);
    setViewMode('details');
  };

  const handleBackToList = () => {
    setSelectedUserId(null);
    setViewMode('list');
    // Refresh the users list when returning from details view
    fetchUsers();
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setUserToDelete(null);
  };

  const handleEditDialogClose = () => {
    setEditDialog(false);
    setEditUser({
      id: '',
      name: '',
      email: '',
      role: ''
    });
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    setLoading(true);
    try {
      await api.delete(`/users/${userToDelete._id}`);
      // Remove the deleted user from the state
      const updatedUsers = users.filter(user => user._id !== userToDelete._id);
      setUsers(updatedUsers);
      setError(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    } finally {
      setLoading(false);
      setOpenDialog(false);
      setUserToDelete(null);
    }
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async () => {
    setLoading(true);
    try {
      const response = await api.patch(`/users/${editUser.id}`, {
        name: editUser.name,
        email: editUser.email,
        role: editUser.role
      });
      
      // Extract updated user from data property in the response
      const updatedUserData = response.data && response.data.data ? response.data.data : null;
      
      // Update the user in the state
      const updatedUsers = users.map(user => 
        user._id === editUser.id ? { ...user, ...updatedUserData } : user
      );
      setUsers(updatedUsers);
      setError(null);
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user. Please try again.');
    } finally {
      setLoading(false);
      setEditDialog(false);
    }
  };

  // If in details view, show the UserDetails component
  if (viewMode === 'details' && selectedUserId) {
    return <UserDetails userId={selectedUserId} onBack={handleBackToList} />;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            User Management
          </Typography>
        </Box>
        
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="role-filter-label">Filter by Role</InputLabel>
              <Select
                labelId="role-filter-label"
                value={filterRole}
                label="Filter by Role"
                onChange={handleRoleFilterChange}
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="car_provider">Car Provider</MenuItem>
                <MenuItem value="customer">Customer</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchUsers}
              disabled={loading}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Joined Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.isArray(filteredUsers) && filteredUsers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((user) => (
                      <TableRow hover key={user._id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.role} 
                            size="small"
                            color={user.role === 'admin' ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewUserDetails(user._id)}
                            color="primary"
                            title="View Details"
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditClick(user)}
                            title="Edit User"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteClick(user)}
                            color="error"
                            title="Delete User"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  {(!Array.isArray(filteredUsers) || filteredUsers.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={Array.isArray(filteredUsers) ? filteredUsers.length : 0}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
      >
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {userToDelete?.name}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog
        open={editDialog}
        onClose={handleEditDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={editUser.name}
                onChange={handleEditChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={editUser.email}
                onChange={handleEditChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={editUser.role}
                  label="Role"
                  onChange={handleEditChange}
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="car_provider">Car Provider</MenuItem>
                  <MenuItem value="customer">Customer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>Cancel</Button>
          <Button 
            onClick={handleEditSubmit} 
            color="primary" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement; 