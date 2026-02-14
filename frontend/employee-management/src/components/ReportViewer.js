import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
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
    Grid,
    CircularProgress,
    Alert,
    Divider,
    Card,
    CardContent,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Assessment,
    PictureAsPdf,
    GetApp,
    Refresh,
    CalendarToday,
    Close,
    Add,
    Download,
} from '@mui/icons-material';
import { reportAPI } from '../services/api';

const ReportViewer = () => {
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [printReport, setPrintReport] = useState(null);
    const [printDialogOpen, setPrintDialogOpen] = useState(false);
    const reportRef = useRef(null);
    const [formData, setFormData] = useState({
        title: '',
        report_type: 'attendance',
        start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await reportAPI.getAll();
            setReports(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching reports:', error);
            setError('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateReport = async () => {
        // Validate form data
        if (!formData.title) {
            setError('Report title is required');
            return;
        }

        try {
            setLoading(true);
            setError(''); // Clear any previous errors

            // Prepare report data
            const reportData = {
                title: formData.title,
                report_type: formData.report_type,
                start_date: formData.start_date,
                end_date: formData.end_date,
                // We don't need to send data, the backend will generate it
            };

            console.log('Creating report with data:', reportData);

            // Send request to create report
            const response = await reportAPI.create(reportData);
            console.log('Report created successfully:', response.data);

            // Close dialog and refresh reports list
            setOpenDialog(false);
            setMessage('Report generated successfully!');
            fetchReports();
        } catch (error) {
            console.error('Error creating report:', error);

            // Log detailed error information for debugging
            console.log('Error response:', error.response);
            console.log('Error data:', error.response?.data);

            // Create a more detailed error message
            let errorMessage = 'Failed to create report. Please try again.';

            if (error.response) {
                if (error.response.data) {
                    if (error.response.data.detail) {
                        errorMessage = error.response.data.detail;
                    } else if (error.response.data.non_field_errors) {
                        errorMessage = error.response.data.non_field_errors.join(', ');
                    } else {
                        // Check for field-specific errors
                        const fieldErrors = [];
                        for (const field in error.response.data) {
                            if (Array.isArray(error.response.data[field])) {
                                fieldErrors.push(`${field}: ${error.response.data[field].join(', ')}`);
                            }
                        }
                        if (fieldErrors.length > 0) {
                            errorMessage = fieldErrors.join('; ');
                        }
                    }
                } else {
                    errorMessage = `Server error: ${error.response.status}`;
                }
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleViewReport = (report) => {
        setSelectedReport(report);
    };

    const handleDownloadPDF = (report) => {
        setPdfLoading(true);
        setPrintReport(report);

        // Set a timeout to allow the print dialog to open
        setTimeout(() => {
            printReportToPDF(report);
        }, 100);
    };

    const printReportToPDF = (report) => {
        try {
            // Create a new window for printing
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                setError('Please allow pop-ups to download PDF reports');
                setPdfLoading(false);
                return;
            }

            // Generate HTML content for the report
            const reportContent = generateReportHTML(report);

            // Write the HTML content to the new window
            printWindow.document.open();
            printWindow.document.write(reportContent);
            printWindow.document.close();

            // Wait for content to load before printing
            printWindow.onload = () => {
                try {
                    // Print the window content
                    printWindow.print();

                    // Close the window after printing (or if print is cancelled)
                    printWindow.onafterprint = () => {
                        printWindow.close();
                        setPdfLoading(false);
                    };
                } catch (err) {
                    console.error('Error during printing:', err);
                    printWindow.close();
                    setPdfLoading(false);
                    setError('Error generating PDF. Please try again.');
                }
            };
        } catch (err) {
            console.error('Error creating print window:', err);
            setPdfLoading(false);
            setError('Error generating PDF. Please try again.');
        }
    };

    const generateReportHTML = (report) => {
        const { title, report_type, data, start_date, end_date, generated_by_name, generated_at } = report;

        // Convert data to array of objects
        const reportData = Object.keys(data).map(key => ({
            employee_id: key,
            ...data[key],
        }));

        // Generate table HTML based on report type
        let tableHTML = '';

        if (report_type === 'attendance') {
            tableHTML = `
                <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th>Employee</th>
                            <th>Days Worked</th>
                            <th>Total Hours</th>
                            <th>Avg Hours/Day</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reportData.map(employee => `
                            <tr>
                                <td>${employee.name}</td>
                                <td>${employee.days_worked}</td>
                                <td>${employee.total_hours.toFixed(2)}</td>
                                <td>${employee.avg_hours_per_day.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else if (report_type === 'salary') {
            tableHTML = `
                <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th>Employee</th>
                            <th>Hourly Rate</th>
                            <th>Total Hours</th>
                            <th>Total Salary</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reportData.map(employee => `
                            <tr>
                                <td>${employee.name}</td>
                                <td>$${employee.hourly_rate.toFixed(2)}</td>
                                <td>${employee.total_hours.toFixed(2)}</td>
                                <td>$${employee.total_salary.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else if (report_type === 'employee') {
            tableHTML = `
                <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th>Employee</th>
                            <th>Email</th>
                            <th>Campaign</th>
                            <th>Hourly Rate</th>
                            <th>Days Worked</th>
                            <th>Total Hours</th>
                            <th>Total Salary</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reportData.map(employee => `
                            <tr>
                                <td>${employee.name}</td>
                                <td>${employee.email}</td>
                                <td>${employee.campaign || '-'}</td>
                                <td>$${employee.hourly_rate.toFixed(2)}</td>
                                <td>${employee.days_worked}</td>
                                <td>${employee.total_hours.toFixed(2)}</td>
                                <td>$${employee.total_salary.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        // Calculate total values for summary
        const totalHours = reportData.reduce((sum, employee) => sum + employee.total_hours, 0);
        const totalSalary = reportData.reduce((sum, employee) => sum + (employee.total_salary || 0), 0);

        // Generate full HTML document
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        color: #333;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .report-title {
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .report-subtitle {
                        font-size: 14px;
                        color: #666;
                        margin-bottom: 5px;
                    }
                    .report-info {
                        font-size: 12px;
                        color: #888;
                        margin-bottom: 20px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    th, td {
                        padding: 8px;
                        text-align: left;
                        border: 1px solid #ddd;
                    }
                    th {
                        background-color: #f2f2f2;
                        font-weight: bold;
                    }
                    tr:nth-child(even) {
                        background-color: #f9f9f9;
                    }
                    .summary {
                        margin-top: 20px;
                        padding: 10px;
                        background-color: #f2f2f2;
                        border-radius: 5px;
                    }
                    .footer {
                        margin-top: 30px;
                        text-align: center;
                        font-size: 12px;
                        color: #888;
                    }
                    @media print {
                        body {
                            margin: 0;
                            padding: 15px;
                        }
                        .no-print {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="report-title">${title}</div>
                    <div class="report-subtitle">${report_type.charAt(0).toUpperCase() + report_type.slice(1)} Report</div>
                    <div class="report-info">
                        Period: ${new Date(start_date).toLocaleDateString()} - ${new Date(end_date).toLocaleDateString()}<br>
                        Generated by: ${generated_by_name} on ${new Date(generated_at).toLocaleString()}
                    </div>
                </div>
                
                ${tableHTML}
                
                <div class="summary">
                    <p><strong>Summary:</strong></p>
                    <p>Total Employees: ${reportData.length}</p>
                    <p>Total Hours: ${totalHours.toFixed(2)}</p>
                    <p>Total Salary: $${totalSalary.toFixed(2)}</p>
                </div>
                
                <div class="footer">
                    <p>Employee Management System - Report generated on ${new Date().toLocaleString()}</p>
                </div>
                
                <script>
                    // Auto-print when loaded
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `;
    };

    const renderReportData = () => {
        if (!selectedReport) return null;

        const { report_type, data } = selectedReport;

        switch (report_type) {
            case 'attendance':
                return renderAttendanceReport(data);
            case 'salary':
                return renderSalaryReport(data);
            case 'employee':
                return renderEmployeeReport(data);
            default:
                return (
                    <Typography>Unknown report type: {report_type}</Typography>
                );
        }
    };

    const renderAttendanceReport = (data) => {
        const employees = Object.keys(data).map(key => ({
            employee_id: key,
            ...data[key],
        }));

        return (
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Employee</TableCell>
                            <TableCell>Days Worked</TableCell>
                            <TableCell>Total Hours</TableCell>
                            <TableCell>Avg Hours/Day</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {employees.map((employee) => (
                            <TableRow key={employee.employee_id}>
                                <TableCell>{employee.name}</TableCell>
                                <TableCell>{employee.days_worked}</TableCell>
                                <TableCell>{employee.total_hours.toFixed(2)}</TableCell>
                                <TableCell>{employee.avg_hours_per_day.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    const renderSalaryReport = (data) => {
        const employees = Object.keys(data).map(key => ({
            employee_id: key,
            ...data[key],
        }));

        return (
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Employee</TableCell>
                            <TableCell>Hourly Rate</TableCell>
                            <TableCell>Total Hours</TableCell>
                            <TableCell>Total Salary</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {employees.map((employee) => (
                            <TableRow key={employee.employee_id}>
                                <TableCell>{employee.name}</TableCell>
                                <TableCell>${employee.hourly_rate.toFixed(2)}</TableCell>
                                <TableCell>{employee.total_hours.toFixed(2)}</TableCell>
                                <TableCell>${employee.total_salary.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    const renderEmployeeReport = (data) => {
        const employees = Object.keys(data).map(key => ({
            employee_id: key,
            ...data[key],
        }));

        return (
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Employee</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Campaign</TableCell>
                            <TableCell>Hourly Rate</TableCell>
                            <TableCell>Days Worked</TableCell>
                            <TableCell>Total Hours</TableCell>
                            <TableCell>Total Salary</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {employees.map((employee) => (
                            <TableRow key={employee.employee_id}>
                                <TableCell>{employee.name}</TableCell>
                                <TableCell>{employee.email}</TableCell>
                                <TableCell>{employee.campaign}</TableCell>
                                <TableCell>${employee.hourly_rate.toFixed(2)}</TableCell>
                                <TableCell>{employee.days_worked}</TableCell>
                                <TableCell>{employee.total_hours.toFixed(2)}</TableCell>
                                <TableCell>${employee.total_salary.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}
            {message && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage('')}>
                    {message}
                </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Reports
                </Typography>
                <Box>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Refresh />}
                        onClick={fetchReports}
                        sx={{ mr: 1 }}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Add />}
                        onClick={() => setOpenDialog(true)}
                    >
                        Generate Report
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={selectedReport ? 4 : 12}>
                    <Paper elevation={3} sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Available Reports
                        </Typography>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                <CircularProgress />
                            </Box>
                        ) : reports.length === 0 ? (
                            <Alert severity="info">
                                No reports available. Click "Generate Report" to create one.
                            </Alert>
                        ) : (
                            <TableContainer sx={{ maxHeight: 600 }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Title</TableCell>
                                            <TableCell>Type</TableCell>
                                            <TableCell>Date Range</TableCell>
                                            <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {reports.map((report) => (
                                            <TableRow
                                                key={report.id}
                                                hover
                                                onClick={() => handleViewReport(report)}
                                                selected={selectedReport?.id === report.id}
                                                sx={{ cursor: 'pointer' }}
                                            >
                                                <TableCell>{report.title}</TableCell>
                                                <TableCell>
                                                    {report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(report.start_date).toLocaleDateString()} - {new Date(report.end_date).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Tooltip title="View Report">
                                                        <IconButton
                                                            color="primary"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleViewReport(report);
                                                            }}
                                                        >
                                                            <Assessment />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Download PDF">
                                                        <IconButton
                                                            color="secondary"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDownloadPDF(report);
                                                            }}
                                                            disabled={pdfLoading}
                                                        >
                                                            {pdfLoading && printReport?.id === report.id ?
                                                                <CircularProgress size={24} /> :
                                                                <PictureAsPdf />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>
                </Grid>

                {selectedReport && (
                    <Grid item xs={12} md={8}>
                        <Paper elevation={3} sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">
                                    {selectedReport.title}
                                </Typography>
                                <Box>
                                    <Tooltip title="Download PDF">
                                        <IconButton
                                            color="primary"
                                            onClick={() => handleDownloadPDF(selectedReport)}
                                            disabled={pdfLoading}
                                            sx={{ mr: 1 }}
                                        >
                                            {pdfLoading && printReport?.id === selectedReport.id ?
                                                <CircularProgress size={24} /> :
                                                <PictureAsPdf />
                                            }
                                        </IconButton>
                                    </Tooltip>
                                    <IconButton onClick={() => setSelectedReport(null)}>
                                        <Close />
                                    </IconButton>
                                </Box>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    <CalendarToday sx={{ fontSize: 'small', mr: 0.5, verticalAlign: 'middle' }} />
                                    {new Date(selectedReport.start_date).toLocaleDateString()} - {new Date(selectedReport.end_date).toLocaleDateString()}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Generated by: {selectedReport.generated_by_name} on {new Date(selectedReport.generated_at).toLocaleString()}
                                </Typography>
                            </Box>

                            <Divider sx={{ mb: 2 }} />

                            <div ref={reportRef}>
                                {renderReportData()}
                            </div>
                        </Paper>
                    </Grid>
                )}
            </Grid>

            {/* Generate Report Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>Generate New Report</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Report Title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                select
                                label="Report Type"
                                value={formData.report_type}
                                onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
                                required
                            >
                                <MenuItem value="attendance">Attendance Report</MenuItem>
                                <MenuItem value="salary">Salary Report</MenuItem>
                                <MenuItem value="employee">Employee Report</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Start Date"
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="End Date"
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleCreateReport}
                        variant="contained"
                        color="primary"
                        disabled={loading || !formData.title}
                    >
                        {loading ? 'Generating...' : 'Generate Report'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ReportViewer;