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
  AppBar,
  Toolbar,
  IconButton,
  Tabs,
  Tab,
  Avatar,
  Chip,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  InputAdornment,
} from '@mui/material';
import {
  Edit,
  Logout,
  AccessTime,
  AttachMoney,
  Person,
  People,
  Refresh,
  Save,
  Cancel,
  Email,
  Phone,
  Home,
  Business,
  Search,
  Assessment,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { employeeAPI, punchAPI } from '../services/api';
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

const ManagerDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [punchRecords, setPunchRecords] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
    campaign: '',
    hourly_rate: 6.00,
  });
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [formError, setFormError] = useState('');
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState(null);

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

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone_number: employee.phone_number || '',
      address: employee.address || '',
      campaign: employee.campaign || '',
      hourly_rate: employee.hourly_rate || 6.00,
    });
    setFormError('');
    setOpenDialog(true);
  };

  const handleViewEmployeeDetails = (employee) => {
    setSelectedEmployeeDetails(employee);

    // Filter punch records for this employee
    const employeePunchRecords = punchRecords.filter(
      record => record.employee_id === employee.id
    );

    // Add punch records to the employee details
    setSelectedEmployeeDetails({
      ...employee,
      punchRecords: employeePunchRecords
    });
  };

  const handleSaveEmployee = async () => {
    if (!formData.first_name || !formData.last_name || !formData.email) {
      setFormError('Name and email are required fields');
      return;
    }

    // Validate hourly rate
    const hourlyRate = parseFloat(formData.hourly_rate);
    if (isNaN(hourlyRate) || hourlyRate <= 0) {
      setFormError('Hourly rate must be a positive number');
      return;
    }

    try {
      setLoading(true);

      // Prepare update data
      const updateData = { ...formData };

      // Convert hourly_rate to a number
      updateData.hourly_rate = parseFloat(updateData.hourly_rate);

      // Add username field (required by Django)
      updateData.username = selectedEmployee.username || selectedEmployee.email || selectedEmployee.employee_id;

      // Make sure we're sending the employee_id field
      if (!updateData.employee_id && selectedEmployee.employee_id) {
        updateData.employee_id = selectedEmployee.employee_id;
      }

      console.log('Updating employee with data:', updateData);
      await employeeAPI.update(selectedEmployee.id, updateData);
      setMessage('Employee updated successfully');
      setMessageType('success');
      fetchEmployees();
      setOpenDialog(false);

      // If we were viewing this employee's details, refresh that data too
      if (selectedEmployeeDetails && selectedEmployeeDetails.id === selectedEmployee.id) {
        handleViewEmployeeDetails({ ...selectedEmployee, ...updateData });
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      setFormError(
        error.response?.data?.detail ||
        error.response?.data?.email?.[0] ||
        error.response?.data?.username?.[0] ||
        'Error updating employee. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ bgcolor: '#1976d2' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <Person sx={{ mr: 1 }} /> Manager Dashboard
          </Typography>
          <Chip
            avatar={<Avatar sx={{ bgcolor: '#fff', color: '#1976d2' }}>{user?.employee_id?.[0]}</Avatar>}
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
          <Tab icon={<AttachMoney />} label="SALARY OVERVIEW" />
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
                {employees.filter(emp => emp.role === 'employee').length}
              </Typography>
              <Typography variant="h6" color="text.secondary">Team Members</Typography>
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
                ${employees
                  .filter(emp => emp.role === 'employee')
                  .reduce((total, emp) => total + parseFloat(emp.total_salary || 0), 0)
                  .toFixed(2)}
              </Typography>
              <Typography variant="h6" color="text.secondary">Team Payroll</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={selectedEmployeeDetails ? 7 : 12}>
              <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ bgcolor: '#2e7d32', p: 2, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                    <People sx={{ mr: 1 }} />
                    Team Members
                  </Typography>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<Refresh />}
                    onClick={fetchEmployees}
                  >
                    Refresh
                  </Button>
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
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Employee</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Email</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Campaign</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Hours</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Salary</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {employees.filter(emp => emp.role === 'employee').length > 0 ? (
                          employees.filter(emp => emp.role === 'employee').map((employee) => (
                            <TableRow
                              key={employee.id}
                              hover
                              selected={selectedEmployeeDetails?.id === employee.id}
                              onClick={() => handleViewEmployeeDetails(employee)}
                              sx={{ cursor: 'pointer' }}
                            >
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Avatar sx={{ mr: 1, bgcolor: '#2e7d32' }}>
                                    {employee.first_name[0]}{employee.last_name[0]}
                                  </Avatar>
                                  {employee.first_name} {employee.last_name}
                                </Box>
                              </TableCell>
                              <TableCell>{employee.email}</TableCell>
                              <TableCell>{employee.campaign || '-'}</TableCell>
                              <TableCell>{employee.total_hours || 0}</TableCell>
                              <TableCell>${employee.total_salary || 0}</TableCell>
                              <TableCell>
                                <Tooltip title="Edit">
                                  <IconButton
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditEmployee(employee);
                                    }}
                                    color="primary"
                                  >
                                    <Edit />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
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
            </Grid>

            {selectedEmployeeDetails && (
              <Grid item xs={12} md={5}>
                <Card elevation={3} sx={{ borderRadius: 2, overflow: 'hidden', height: '100%' }}>
                  <Box sx={{ bgcolor: '#1976d2', p: 2, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Person sx={{ mr: 1 }} />
                      Employee Details
                    </Typography>
                    <IconButton
                      color="inherit"
                      onClick={() => setSelectedEmployeeDetails(null)}
                      size="small"
                    >
                      <Cancel />
                    </IconButton>
                  </Box>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar
                        sx={{
                          width: 80,
                          height: 80,
                          bgcolor: '#1976d2',
                          fontSize: '2rem',
                          mr: 2
                        }}
                      >
                        {selectedEmployeeDetails.first_name[0]}{selectedEmployeeDetails.last_name[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="h5">{selectedEmployeeDetails.first_name} {selectedEmployeeDetails.last_name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Employee ID: {selectedEmployeeDetails.employee_id}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Email sx={{ mr: 2, color: '#1976d2' }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">Email Address</Typography>
                          <Typography variant="body1">{selectedEmployeeDetails.email}</Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Phone sx={{ mr: 2, color: '#1976d2' }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">Phone Number</Typography>
                          <Typography variant="body1">{selectedEmployeeDetails.phone_number || 'Not provided'}</Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Business sx={{ mr: 2, color: '#1976d2' }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">Campaign</Typography>
                          <Typography variant="body1">{selectedEmployeeDetails.campaign || 'Not assigned'}</Typography>
                        </Box>
                      </Box>

                      {selectedEmployeeDetails.address && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <Home sx={{ mr: 2, color: '#1976d2', mt: 0.5 }} />
                          <Box>
                            <Typography variant="body2" color="text.secondary">Address</Typography>
                            <Typography variant="body1">{selectedEmployeeDetails.address}</Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}>
                          <Typography variant="h6" color="primary">{selectedEmployeeDetails.total_hours || 0}</Typography>
                          <Typography variant="body2" color="text.secondary">Total Hours</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e9' }}>
                          <Typography variant="h6" color="success.main">${selectedEmployeeDetails.total_salary || 0}</Typography>
                          <Typography variant="body2" color="text.secondary">Total Salary</Typography>
                        </Paper>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" gutterBottom>Recent Punch Records</Typography>
                      {selectedEmployeeDetails.punchRecords && selectedEmployeeDetails.punchRecords.length > 0 ? (
                        <TableContainer sx={{ maxHeight: 200 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>In</TableCell>
                                <TableCell>Out</TableCell>
                                <TableCell>Hours</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {selectedEmployeeDetails.punchRecords.slice(0, 5).map((record) => (
                                <TableRow key={record.id}>
                                  <TableCell>{record.date}</TableCell>
                                  <TableCell>
                                    {record.punch_in ? new Date(record.punch_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                  </TableCell>
                                  <TableCell>
                                    {record.punch_out ? new Date(record.punch_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                  </TableCell>
                                  <TableCell>{record.total_hours || 0}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No punch records found</Typography>
                      )}
                    </Box>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Edit />}
                        onClick={() => handleEditEmployee(selectedEmployeeDetails)}
                      >
                        Edit Employee
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
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
          <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ bgcolor: '#c2185b', p: 2, color: 'white' }}>
              <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoney sx={{ mr: 1 }} />
                Salary Overview
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {employees.filter(emp => emp.role === 'employee').map((employee) => (
                  <Grid item xs={12} md={6} lg={4} key={employee.id}>
                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: '#2e7d32', mr: 2 }}>
                            {employee.first_name[0]}{employee.last_name[0]}
                          </Avatar>
                          <Typography variant="h6">{employee.first_name} {employee.last_name}</Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Total Hours</Typography>
                            <Typography variant="h6" color="primary">{employee.total_hours || 0}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Hourly Rate</Typography>
                            <Typography variant="h6" color="text.primary">${employee.hourly_rate || 6.00}</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">Total Salary</Typography>
                            <Typography variant="h5" color="success.main">${employee.total_salary || 0}</Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <ReportViewer />
        </TabPanel>
      </Box>

      {/* Edit Employee Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setFormError('');
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white' }}>
          Edit Employee Details
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
            {loading ? 'Saving...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManagerDashboard;