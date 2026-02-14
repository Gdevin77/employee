import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  AppBar,
  Toolbar,
  IconButton,
  Tabs,
  Tab,
  Chip,
  Avatar,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Logout,
  AccessTime,
  AttachMoney,
  People,
  Person,
  Assessment,
  Search,
  Refresh,
  Save,
  Cancel,
  Business,
  Email,
  Phone,
  Home,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { employeeAPI, punchAPI, reportAPI } from '../services/api';
import ReportViewer from './ReportViewer';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdminDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [punchRecords, setPunchRecords] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
    campaign: '',
    role: 'employee',
    password: '',
    hourly_rate: 6.00,
  });
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [formError, setFormError] = useState('');

  const { logout, user } = useAuth();

  useEffect(() => {
    fetchEmployees();
    fetchPunchRecords();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeAPI.getAll();
      setEmployees(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setMessage('Failed to load employees');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPunchRecords = async () => {
    try {
      const response = await punchAPI.getAll();
      setPunchRecords(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching punch records:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setFormData({
      employee_id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      address: '',
      campaign: '',
      role: 'employee',
      password: '',
      hourly_rate: 6.00,
    });
    setFormError('');
    setOpenDialog(true);
  };

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      employee_id: employee.employee_id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone_number: employee.phone_number || '',
      address: employee.address || '',
      campaign: employee.campaign || '',
      role: employee.role,
      password: '',
      hourly_rate: employee.hourly_rate || 6.00,
    });
    setFormError('');
    setOpenDialog(true);
  };

  const validateForm = () => {
    if (!formData.employee_id) {
      setFormError('Employee ID is required');
      return false;
    }
    if (!formData.first_name || !formData.last_name) {
      setFormError('First and last name are required');
      return false;
    }
    if (!formData.email) {
      setFormError('Email is required');
      return false;
    }
    if (!selectedEmployee && !formData.password) {
      setFormError('Password is required for new employees');
      return false;
    }
    return true;
  };

  const handleSaveEmployee = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Validate hourly rate
      const hourlyRate = parseFloat(formData.hourly_rate);
      if (isNaN(hourlyRate) || hourlyRate <= 0) {
        setFormError('Hourly rate must be a positive number');
        setLoading(false);
        return;
      }

      if (selectedEmployee) {
        // Prepare update data
        const updateData = { ...formData };

        // Convert hourly_rate to a number
        updateData.hourly_rate = parseFloat(updateData.hourly_rate);

        // Only include password if it's provided
        if (!updateData.password) {
          delete updateData.password;
        }

        // Add username field (required by Django)
        updateData.username = selectedEmployee.username || selectedEmployee.email || selectedEmployee.employee_id;

        // Make sure we're sending the employee_id field
        if (!updateData.employee_id && selectedEmployee.employee_id) {
          updateData.employee_id = selectedEmployee.employee_id;
        }

        // Add is_active field if it exists on the selected employee
        if (selectedEmployee.hasOwnProperty('is_active')) {
          updateData.is_active = selectedEmployee.is_active;
        }

        console.log('Updating employee with data:', updateData);
        await employeeAPI.update(selectedEmployee.id, updateData);
        setMessage('Employee updated successfully');
      } else {
        // For new employee creation
        const createData = { ...formData };
        createData.hourly_rate = parseFloat(createData.hourly_rate);
        createData.username = createData.email; // Set username to email for new employees

        await employeeAPI.create(createData);
        setMessage('Employee created successfully');
      }
      setMessageType('success');
      fetchEmployees();
      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving employee:', error);
      setFormError(
        error.response?.data?.detail ||
        error.response?.data?.email?.[0] ||
        error.response?.data?.username?.[0] ||
        'Error saving employee. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        setLoading(true);
        await employeeAPI.delete(id);
        setMessage('Employee deleted successfully');
        setMessageType('success');
        fetchEmployees();
      } catch (error) {
        console.error('Error deleting employee:', error);
        setMessage('Error deleting employee');
        setMessageType('error');
      } finally {
        setLoading(false);
      }
    }
  };

  const calculateSalary = (totalHours) => {
    return (totalHours * 6).toFixed(2);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return '#d32f2f';
      case 'manager':
        return '#1976d2';
      case 'employee':
        return '#388e3c';
      default:
        return '#757575';
    }
  };

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ bgcolor: '#d32f2f' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <People sx={{ mr: 1 }} /> Admin Dashboard
          </Typography>
          <Chip
            avatar={<Avatar sx={{ bgcolor: '#fff', color: '#d32f2f' }}>{user?.employee_id?.[0]}</Avatar>}
            label={user?.employee_id}
            variant="outlined"
            sx={{ mr: 2, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
          <Tooltip title="Logout">
            <IconButton color="inherit" onClick={logout}>
              <Logout />
            </IconButton>
          </Tooltip>
        </Toolbar>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="secondary"
          textColor="inherit"
          variant="fullWidth"
          sx={{ bgcolor: 'rgba(0,0,0,0.1)' }}
        >
          <Tab icon={<People />} label="EMPLOYEES" />
          <Tab icon={<AccessTime />} label="PUNCH RECORDS" />
          <Tab icon={<Assessment />} label="REPORTS" />
        </Tabs>
      </AppBar>

      <Snackbar
        open={!!message}
        autoHideDuration={6000}
        onClose={() => setMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={messageType} sx={{ width: '100%' }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      </Snackbar>

      <Box sx={{ padding: 2 }}>
        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center', borderRadius: 2, bgcolor: '#e8f5e9' }}>
              <People sx={{ fontSize: 48, color: '#2e7d32' }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32', mt: 1 }}>
                {employees.length}
              </Typography>
              <Typography variant="h6" color="text.secondary">Total Employees</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center', borderRadius: 2, bgcolor: '#e3f2fd' }}>
              <AccessTime sx={{ fontSize: 48, color: '#1565c0' }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1565c0', mt: 1 }}>
                {punchRecords.length}
              </Typography>
              <Typography variant="h6" color="text.secondary">Punch Records</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center', borderRadius: 2, bgcolor: '#fce4ec' }}>
              <AttachMoney sx={{ fontSize: 48, color: '#c2185b' }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#c2185b', mt: 1 }}>
                ${employees.reduce((total, emp) => total + parseFloat(emp.total_salary || 0), 0).toFixed(2)}
              </Typography>
              <Typography variant="h6" color="text.secondary">Total Payroll</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ bgcolor: '#2e7d32', p: 2, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                <People sx={{ mr: 1 }} />
                Employee Management
              </Typography>
              <Box>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<Refresh />}
                  onClick={fetchEmployees}
                  sx={{ mr: 1 }}
                >
                  Refresh
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<Add />}
                  onClick={handleAddEmployee}
                >
                  Add Employee
                </Button>
              </Box>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Employee ID</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Campaign</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Total Hours</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Total Salary</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employees.length > 0 ? (
                      employees.map((employee) => (
                        <TableRow key={employee.id} hover>
                          <TableCell>{employee.employee_id}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ mr: 1, bgcolor: getRoleColor(employee.role) }}>
                                {employee.first_name[0]}{employee.last_name[0]}
                              </Avatar>
                              {employee.first_name} {employee.last_name}
                            </Box>
                          </TableCell>
                          <TableCell>{employee.email}</TableCell>
                          <TableCell>
                            <Chip
                              label={employee.role}
                              size="small"
                              sx={{
                                bgcolor: getRoleColor(employee.role),
                                color: 'white',
                                textTransform: 'capitalize'
                              }}
                            />
                          </TableCell>
                          <TableCell>{employee.campaign || '-'}</TableCell>
                          <TableCell>{employee.total_hours || 0}</TableCell>
                          <TableCell>${employee.total_salary || 0}</TableCell>
                          <TableCell>
                            <Tooltip title="Edit">
                              <IconButton onClick={() => handleEditEmployee(employee)} color="primary">
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton onClick={() => handleDeleteEmployee(employee.id)} color="error">
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                          <Typography variant="body1" color="text.secondary">
                            No employees found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ bgcolor: '#1565c0', p: 2, color: 'white' }}>
              <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTime sx={{ mr: 1 }} />
                Punch Records
              </Typography>
            </Box>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Punch In</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Punch Out</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Total Hours</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Daily Salary</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {punchRecords.length > 0 ? (
                    punchRecords.map((record) => (
                      <TableRow key={record.id} hover>
                        <TableCell>{record.employee_name}</TableCell>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>
                          {record.punch_in ? new Date(record.punch_in).toLocaleTimeString() : '-'}
                        </TableCell>
                        <TableCell>
                          {record.punch_out ? new Date(record.punch_out).toLocaleTimeString() : '-'}
                        </TableCell>
                        <TableCell>{record.total_hours || 0}</TableCell>
                        <TableCell>${record.daily_salary || 0}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <Typography variant="body1" color="text.secondary">
                          No punch records found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <ReportViewer />
        </TabPanel>
      </Box>

      {/* Employee Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setFormError('');
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#2e7d32', color: 'white' }}>
          {selectedEmployee ? 'Edit Employee' : 'Add Employee'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Employee ID"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                required
                error={!formData.employee_id}
                disabled={!!selectedEmployee}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              >
                <MenuItem value="employee">Employee</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
                error={!formData.first_name}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
                error={!formData.last_name}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                error={!formData.email}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Campaign"
                value={formData.campaign}
                onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hourly Rate"
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  inputProps: { min: 0, step: 0.01 }
                }}
                error={isNaN(parseFloat(formData.hourly_rate)) || parseFloat(formData.hourly_rate) <= 0}
                helperText={isNaN(parseFloat(formData.hourly_rate)) || parseFloat(formData.hourly_rate) <= 0 ? "Hourly rate must be a positive number" : ""}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!selectedEmployee}
                error={!selectedEmployee && !formData.password}
                helperText={selectedEmployee ? "Leave blank to keep current password" : "Required for new employees"}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}>
          <Button
            onClick={() => {
              setOpenDialog(false);
              setFormError('');
            }}
            startIcon={<Cancel />}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveEmployee}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={<Save />}
          >
            {loading ? 'Saving...' : (selectedEmployee ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;