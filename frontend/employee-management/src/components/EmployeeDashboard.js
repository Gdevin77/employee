import React, { useState, useEffect, useCallback } from 'react';
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
  Card,
  CardContent,
  Alert,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  Snackbar,
  Tooltip,
  InputAdornment,
  Badge,
  Stack,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  Collapse,
  Fade,
  LinearProgress,
} from '@mui/material';
import {
  Logout,
  AccessTime,
  AttachMoney,
  Edit,
  PlayArrow,
  Stop,
  Person,
  Email,
  Phone,
  Home,
  Business,
  Save,
  Cancel,
  Menu as MenuIcon,
  Dashboard,
  CalendarMonth,
  Notifications,
  Settings,
  ExpandMore,
  ExpandLess,
  AccountCircle,
  Timelapse,
  History,
  Paid,
  MoreVert,
  CheckCircle,
  ErrorOutline,
  Info,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { employeeAPI, punchAPI } from '../services/api';

// TabPanel component for tab content
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
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const EmployeeDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [employee, setEmployee] = useState(null);
  const [punchRecords, setPunchRecords] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
    hourly_rate: '',
  });
  const [todayRecord, setTodayRecord] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [loading, setLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [punchLoading, setPunchLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [workingTime, setWorkingTime] = useState(0);

  const { logout, user } = useAuth();

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());

      // Update working time if punched in
      if (todayRecord && !todayRecord.punch_out) {
        const punchInTime = new Date(todayRecord.punch_in);
        const elapsedMs = new Date() - punchInTime;
        setWorkingTime(Math.floor(elapsedMs / 1000 / 60)); // in minutes
      }
    }, 60000); // update every minute

    return () => clearInterval(timer);
  }, [todayRecord]);

  const fetchEmployeeData = useCallback(async () => {
    try {
      const response = await employeeAPI.getAll();
      const employees = response.data.results || response.data;
      const currentEmployee = employees.find(emp => emp.employee_id === user.employee_id);
      if (currentEmployee) {
        setEmployee(currentEmployee);
        setFormData({
          first_name: currentEmployee.first_name,
          last_name: currentEmployee.last_name,
          email: currentEmployee.email,
          phone_number: currentEmployee.phone_number || '',
          address: currentEmployee.address || '',
          hourly_rate: currentEmployee.hourly_rate || 6.00,
        });
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      setMessage('Failed to load employee data');
      setMessageType('error');
    }
  }, [user.employee_id]);

  const fetchPunchRecords = useCallback(async () => {
    try {
      const response = await punchAPI.getAll();
      const records = response.data.results || response.data;
      setPunchRecords(records);

      // Check for today's record
      const today = new Date().toISOString().split('T')[0];
      const todayRec = records.find(record => record.date === today && !record.punch_out);
      setTodayRecord(todayRec);

      // Initialize working time if punched in
      if (todayRec && !todayRec.punch_out) {
        const punchInTime = new Date(todayRec.punch_in);
        const elapsedMs = new Date() - punchInTime;
        setWorkingTime(Math.floor(elapsedMs / 1000 / 60)); // in minutes
      }
    } catch (error) {
      console.error('Error fetching punch records:', error);
      setMessage('Failed to load punch records');
      setMessageType('error');
    }
  }, []);

  useEffect(() => {
    fetchEmployeeData();
    fetchPunchRecords();
  }, [fetchEmployeeData, fetchPunchRecords]);

  const handlePunchIn = async () => {
    try {
      setPunchLoading(true);
      await punchAPI.punch('punch_in');
      setMessage('Successfully punched in!');
      setMessageType('success');
      fetchPunchRecords();
    } catch (error) {
      setMessage(error.response?.data?.non_field_errors?.[0] || 'Error punching in');
      setMessageType('error');
    } finally {
      setPunchLoading(false);
    }
  };

  const handlePunchOut = async () => {
    try {
      setPunchLoading(true);
      await punchAPI.punch('punch_out');
      setMessage('Successfully punched out!');
      setMessageType('success');
      fetchPunchRecords();
    } catch (error) {
      setMessage(error.response?.data?.non_field_errors?.[0] || 'Error punching out');
      setMessageType('error');
    } finally {
      setPunchLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      setUpdateError('');

      // Validate form data
      if (!formData.first_name || !formData.last_name || !formData.email) {
        setUpdateError('Name and email are required fields');
        setLoading(false);
        return;
      }

      // Validate hourly rate
      const hourlyRate = parseFloat(formData.hourly_rate);
      if (isNaN(hourlyRate) || hourlyRate <= 0) {
        setUpdateError('Hourly rate must be a positive number');
        setLoading(false);
        return;
      }

      // Make sure we're only sending the fields we want to update
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone_number: formData.phone_number,
        address: formData.address,
        hourly_rate: formData.hourly_rate,
      };

      // Convert hourly_rate to a number
      updateData.hourly_rate = parseFloat(updateData.hourly_rate);

      // Add username field (required by Django)
      updateData.username = employee.username || employee.email;

      await employeeAPI.update(employee.id, updateData);
      setMessage('Profile updated successfully!');
      setMessageType('success');
      await fetchEmployeeData(); // Refresh employee data
      setOpenDialog(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setUpdateError(error.response?.data?.detail ||
        error.response?.data?.email?.[0] ||
        error.response?.data?.username?.[0] ||
        'Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Format working time
  const formatWorkingTime = () => {
    if (!workingTime) return '0h 0m';
    const hours = Math.floor(workingTime / 60);
    const minutes = workingTime % 60;
    return `${hours}h ${minutes}m`;
  };

  // Calculate progress percentage for the day (assuming 8-hour workday)
  const calculateProgress = () => {
    if (!todayRecord) return 0;
    const workHours = workingTime / 60; // convert minutes to hours
    return Math.min(Math.round((workHours / 8) * 100), 100);
  };

  // Get recent punch records (last 7 days)
  const getRecentRecords = () => {
    return punchRecords.slice(0, 7);
  };

  // Calculate weekly stats
  const calculateWeeklyStats = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weekRecords = punchRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= oneWeekAgo;
    });

    // Ensure totalHours is a number by using parseFloat or defaulting to 0
    const totalHours = weekRecords.reduce((sum, record) => {
      const hours = record.total_hours ? parseFloat(record.total_hours) : 0;
      return sum + (isNaN(hours) ? 0 : hours);
    }, 0);

    const hourlyRate = employee?.hourly_rate ? parseFloat(employee.hourly_rate) : 6;
    const totalEarnings = totalHours * hourlyRate;
    const avgHoursPerDay = weekRecords.length > 0 ? totalHours / weekRecords.length : 0;

    return {
      totalHours: totalHours.toFixed(2),
      totalEarnings: totalEarnings.toFixed(2),
      avgHoursPerDay: avgHoursPerDay.toFixed(2),
      daysWorked: weekRecords.length
    };
  };

  if (!employee) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f5f5f5' }}>
        <CircularProgress size={60} thickness={4} color="primary" />
        <Typography variant="h6" sx={{ mt: 3, fontWeight: 'medium' }}>Loading your dashboard...</Typography>
      </Box>
    );
  }

  // Sidebar content
  const drawer = (
    <Box sx={{ bgcolor: '#fff', height: '100%' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
        <Avatar
          sx={{
            bgcolor: theme.palette.primary.main,
            color: '#fff',
            width: 40,
            height: 40,
            mr: 2
          }}
        >
          {employee.first_name[0]}{employee.last_name[0]}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            {employee.first_name} {employee.last_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ID: {employee.employee_id}
          </Typography>
        </Box>
      </Box>

      <List sx={{ pt: 0 }}>
        <ListItemButton
          selected={tabValue === 0}
          onClick={() => { setTabValue(0); if (isMobile) setMobileOpen(false); }}
        >
          <ListItemIcon>
            <Dashboard color={tabValue === 0 ? "primary" : "inherit"} />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>

        <ListItemButton
          selected={tabValue === 1}
          onClick={() => { setTabValue(1); if (isMobile) setMobileOpen(false); }}
        >
          <ListItemIcon>
            <AccessTime color={tabValue === 1 ? "primary" : "inherit"} />
          </ListItemIcon>
          <ListItemText primary="Time Tracking" />
        </ListItemButton>

        <ListItemButton
          selected={tabValue === 2}
          onClick={() => { setTabValue(2); if (isMobile) setMobileOpen(false); }}
        >
          <ListItemIcon>
            <Person color={tabValue === 2 ? "primary" : "inherit"} />
          </ListItemIcon>
          <ListItemText primary="My Profile" />
        </ListItemButton>
      </List>

      <Divider sx={{ my: 2 }} />

      <List>
        <ListItemButton onClick={logout}>
          <ListItemIcon>
            <Logout />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>
    </Box>
  );
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: '#1976d2',
          boxShadow: 3
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Dashboard sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }} />
            Employee Management System
          </Typography>

          {/* Current Time */}
          <Chip
            icon={<AccessTime />}
            label={currentTime.toLocaleTimeString()}
            variant="outlined"
            sx={{
              mr: 2,
              bgcolor: 'rgba(255,255,255,0.1)',
              color: 'white',
              display: { xs: 'none', sm: 'flex' }
            }}
          />

          {/* User Menu */}
          <Tooltip title="Account menu">
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#fff', color: '#1976d2' }}>
                {employee.first_name[0]}{employee.last_name[0]}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => { setTabValue(2); handleMenuClose(); }}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          <ListItemText>My Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setOpenDialog(true); handleMenuClose(); }}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Profile</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={logout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>

      {/* Sidebar / Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: 240 }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240, borderRight: '1px solid rgba(0,0,0,0.12)' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - 240px)` },
          bgcolor: '#f5f5f5',
          mt: '64px'
        }}
      >
        {/* Messages */}
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

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          {/* Dashboard Tab */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Welcome back, {employee.first_name}! Here's your work summary.
            </Typography>
          </Box>

          {/* Time Tracking Status */}
          <Paper
            elevation={3}
            sx={{
              p: 3,
              mb: 4,
              borderRadius: 2,
              background: todayRecord ?
                'linear-gradient(to right, rgba(46, 125, 50, 0.1), rgba(46, 125, 50, 0.05))' :
                'white'
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {todayRecord ? 'Currently Working' : 'Not Clocked In'}
                  </Typography>

                  {todayRecord ? (
                    <>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        You've been working for <strong>{formatWorkingTime()}</strong> today
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={calculateProgress()}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          mb: 1,
                          bgcolor: 'rgba(0,0,0,0.1)'
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {calculateProgress()}% of standard 8-hour workday
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      Click the "Punch In" button to start your workday
                    </Typography>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}>
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={<PlayArrow />}
                    onClick={handlePunchIn}
                    disabled={todayRecord || punchLoading}
                    sx={{
                      py: 1.5,
                      px: 4,
                      mr: 2,
                      display: todayRecord ? 'none' : 'inline-flex'
                    }}
                  >
                    {punchLoading ? 'Processing...' : 'Punch In'}
                  </Button>

                  <Button
                    variant="contained"
                    color="error"
                    size="large"
                    startIcon={<Stop />}
                    onClick={handlePunchOut}
                    disabled={!todayRecord || punchLoading}
                    sx={{
                      py: 1.5,
                      px: 4,
                      display: !todayRecord ? 'none' : 'inline-flex'
                    }}
                  >
                    {punchLoading ? 'Processing...' : 'Punch Out'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Weekly Hours
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'medium', color: '#1565c0' }}>
                    {calculateWeeklyStats().totalHours}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg: {calculateWeeklyStats().avgHoursPerDay} hrs/day
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Weekly Earnings
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'medium', color: '#2e7d32' }}>
                    ${calculateWeeklyStats().totalEarnings}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rate: ${employee.hourly_rate}/hr
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Days Worked
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'medium', color: '#7b1fa2' }}>
                    {calculateWeeklyStats().daysWorked}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This week
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Hours
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'medium', color: '#ed6c02' }}>
                    {employee.total_hours || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    All time
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Recent Activity */}
          <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ bgcolor: '#1976d2', p: 2, color: 'white' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <History sx={{ mr: 1 }} />
                Recent Activity
              </Typography>
            </Box>
            <TableContainer sx={{ maxHeight: 350 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Punch In</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Punch Out</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Hours</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Earnings</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getRecentRecords().length > 0 ? (
                    getRecentRecords().map((record) => (
                      <TableRow key={record.id} hover>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>
                          {record.punch_in ? new Date(record.punch_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </TableCell>
                        <TableCell>
                          {record.punch_out ? new Date(record.punch_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </TableCell>
                        <TableCell>{record.total_hours || 0}</TableCell>
                        <TableCell>${record.daily_salary || 0}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography variant="body1" color="text.secondary">
                          No recent activity found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {/* Time Tracking Tab */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              Time Tracking
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Track your work hours and view your punch records.
            </Typography>
          </Box>

          {/* Punch In/Out Card */}
          <Card elevation={3} sx={{ borderRadius: 2, overflow: 'hidden', mb: 4 }}>
            <Box sx={{ bgcolor: '#2196f3', p: 2, color: 'white' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTime sx={{ mr: 1 }} />
                Clock In/Out
              </Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={7}>
                  <Box sx={{ mb: { xs: 2, md: 0 } }}>
                    <Typography variant="h5" gutterBottom>
                      {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </Typography>

                    {todayRecord ? (
                      <Alert severity="success" icon={<CheckCircle />} sx={{ mt: 2 }}>
                        <Typography variant="body1" fontWeight="medium">
                          You punched in at {new Date(todayRecord.punch_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Working time: {formatWorkingTime()}
                        </Typography>
                      </Alert>
                    ) : (
                      <Alert severity="info" icon={<Info />} sx={{ mt: 2 }}>
                        <Typography variant="body1">
                          You haven't punched in today
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Click the "Punch In" button to start tracking your time
                        </Typography>
                      </Alert>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} md={5}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, gap: 2, justifyContent: 'center' }}>
                    <Button
                      variant="contained"
                      color="success"
                      size="large"
                      fullWidth
                      startIcon={<PlayArrow />}
                      onClick={handlePunchIn}
                      disabled={todayRecord || punchLoading}
                      sx={{ py: 2 }}
                    >
                      {punchLoading ? <CircularProgress size={24} color="inherit" /> : 'Punch In'}
                    </Button>

                    <Button
                      variant="contained"
                      color="error"
                      size="large"
                      fullWidth
                      startIcon={<Stop />}
                      onClick={handlePunchOut}
                      disabled={!todayRecord || punchLoading}
                      sx={{ py: 2 }}
                    >
                      {punchLoading ? <CircularProgress size={24} color="inherit" /> : 'Punch Out'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Punch Records */}
          <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ bgcolor: '#ff9800', p: 2, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <History sx={{ mr: 1 }} />
                Punch Records
              </Typography>
              <Chip
                label={`Total Hours: ${employee.total_hours || 0}`}
                color="primary"
                sx={{ bgcolor: 'white', color: '#ff9800' }}
              />
            </Box>
            <TableContainer sx={{ maxHeight: 500 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
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
                        <TableCell>{record.date}</TableCell>
                        <TableCell>
                          {record.punch_in ? new Date(record.punch_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </TableCell>
                        <TableCell>
                          {record.punch_out ? new Date(record.punch_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </TableCell>
                        <TableCell>{record.total_hours || 0}</TableCell>
                        <TableCell>${record.daily_salary || 0}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
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
          {/* Profile Tab */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              My Profile
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              View and manage your personal information.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              {/* Profile Summary Card */}
              <Card elevation={3} sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
                <Box sx={{
                  bgcolor: '#673ab7',
                  p: 4,
                  color: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}>
                  <Avatar
                    sx={{
                      bgcolor: '#fff',
                      color: '#673ab7',
                      width: 100,
                      height: 100,
                      fontSize: '2.5rem',
                      mb: 2
                    }}
                  >
                    {employee.first_name[0]}{employee.last_name[0]}
                  </Avatar>
                  <Typography variant="h5" gutterBottom>
                    {employee.first_name} {employee.last_name}
                  </Typography>
                  <Chip
                    label={`ID: ${employee.employee_id}`}
                    variant="outlined"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={<Edit />}
                    onClick={() => setOpenDialog(true)}
                    sx={{ mb: 2 }}
                  >
                    Edit Profile
                  </Button>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Campaign
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {employee.campaign || 'Not assigned'}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Hourly Rate
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      ${employee.hourly_rate || 6.00}/hour
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Earnings
                    </Typography>
                    <Typography variant="h6" color="primary" gutterBottom>
                      ${employee.total_salary || 0}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              {/* Contact Information Card */}
              <Card elevation={3} sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
                <Box sx={{ bgcolor: '#2196f3', p: 2, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    Contact Information
                  </Typography>
                  <IconButton color="inherit" onClick={() => setOpenDialog(true)}>
                    <Edit />
                  </IconButton>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        Email Address
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Email sx={{ mr: 1, color: '#2196f3' }} />
                        <Typography variant="body1">
                          {employee.email || 'Not provided'}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        Phone Number
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Phone sx={{ mr: 1, color: '#2196f3' }} />
                        <Typography variant="body1">
                          {employee.phone_number || 'Not provided'}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Address
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 1 }}>
                        <Home sx={{ mr: 1, mt: 0.5, color: '#2196f3' }} />
                        <Typography variant="body1">
                          {employee.address || 'Not provided'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Work Summary Card */}
              <Card elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ bgcolor: '#ff9800', p: 2, color: 'white' }}>
                  <Typography variant="h6">
                    Work Summary
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Paper elevation={1} sx={{ p: 2, borderRadius: 2, bgcolor: '#f5f5f5' }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Total Hours Worked
                        </Typography>
                        <Typography variant="h5" color="primary">
                          {employee.total_hours || 0} hours
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Paper elevation={1} sx={{ p: 2, borderRadius: 2, bgcolor: '#f5f5f5' }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Total Earnings
                        </Typography>
                        <Typography variant="h5" color="success.main">
                          ${employee.total_salary || 0}
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Weekly Performance
                      </Typography>
                      <Box sx={{ mt: 1, mb: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((calculateWeeklyStats().daysWorked / 5) * 100, 100)}
                          sx={{ height: 10, borderRadius: 5 }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {calculateWeeklyStats().daysWorked} of 5 workdays this week
                        </Typography>
                      </Box>

                      <Typography variant="body1">
                        You've worked <strong>{calculateWeeklyStats().totalHours} hours</strong> this week, earning <strong>${calculateWeeklyStats().totalEarnings}</strong>.
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Box>

      {/* Edit Profile Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setUpdateError('');
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#673ab7', color: 'white', display: 'flex', alignItems: 'center' }}>
          <Edit sx={{ mr: 1 }} /> Edit My Information
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {updateError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {updateError}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
                error={!formData.first_name}
                helperText={!formData.first_name ? "First name is required" : ""}
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
                helperText={!formData.last_name ? "Last name is required" : ""}
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
                helperText={!formData.email ? "Email is required" : ""}
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
              setUpdateError('');
            }}
            startIcon={<Cancel />}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateProfile}
            variant="contained"
            color="primary"
            disabled={loading || !formData.first_name || !formData.last_name || !formData.email ||
              isNaN(parseFloat(formData.hourly_rate)) || parseFloat(formData.hourly_rate) <= 0}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeDashboard;