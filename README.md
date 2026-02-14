# Employee Management System

A full-stack web application built with Django (backend) and React (frontend) for managing employees, tracking work hours, and generating reports.

## Features

### Admin Dashboard
- ✅ Add, edit, and delete employees
- ✅ View all employee punch in/out times
- ✅ Calculate employee salaries based on hourly rates
- ✅ Generate various reports
- ✅ Full employee management capabilities

### Manager Dashboard
- ✅ View punch in/out times of employees
- ✅ Edit employee details
- ✅ View employee salaries
- ✅ Monitor team performance

### Employee Dashboard
- ✅ Edit personal details
- ✅ Punch in/out functionality
- ✅ View personal punch times and salary information
- ✅ Track earnings based on hours worked

## Technology Stack

**Backend:**
- Django 5.2.3
- Django REST Framework
- Token Authentication
- SQLite Database

**Frontend:**
- React.js
- Material-UI (MUI)
- Axios for API calls
- React Router for navigation

## Project Structure

```
employeemng/
├── backend/
│   └── employeemng/
│       ├── employees/          # Django app
│       ├── employeemng/        # Project settings
│       ├── requirements.txt    # Python dependencies
│       └── seed_data.py        # Data seeding script
├── frontend/
│   └── employee-management/    # React application
│       ├── src/
│       │   ├── components/     # React components
│       │   ├── contexts/       # React contexts
│       │   └── services/       # API services
│       └── package.json        # Node dependencies
└── run_seeder.bat              # Windows batch file to run the seeder
```

## Quick Start Guide

### Prerequisites
- Python 3.8+
- Node.js 14+
- pip (Python package manager)
- npm (Node package manager)

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd employeemng
```

### Step 2: Set Up the Backend
```bash
# Navigate to the backend directory
cd backend/employeemng

# Install Python dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py makemigrations
python manage.py migrate

# Start the Django development server
python manage.py runserver
```

### Step 3: Set Up the Frontend
```bash
# Open a new terminal window
# Navigate to the frontend directory
cd frontend/employee-management

# Install Node dependencies
npm install

# Start the React development server
npm start
```

### Step 4: Seed the Database with Test Data
```bash
# From the project root directory
# For Windows:
run_seeder.bat

# For macOS/Linux:
cd backend/employeemng
python -c "import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'employeemng.settings'); import django; django.setup(); from seed_data import run_seeder; run_seeder()"
```

The backend API will be available at `http://localhost:8000`
The frontend will be available at `http://localhost:3000`

## Detailed Setup Instructions

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend/employeemng
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run database migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

4. **Start the Django development server:**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend/employee-management
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   ```

3. **Start the React development server:**
   ```bash
   npm start
   ```

### Seeding the Database

The project includes a data seeder script that populates the database with:
- Admin, manager, and employee user accounts
- 30 days of punch records for all employees
- Sample reports (attendance, salary, employee summary)

**To run the seeder:**

**Windows:**
```bash
# From the project root directory
run_seeder.bat
```

**macOS/Linux:**
```bash
cd backend/employeemng
python -c "import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'employeemng.settings'); import django; django.setup(); from seed_data import run_seeder; run_seeder()"
```

## Default Login Credentials

After running the seeder script, you can log in with these default accounts:

| Role | Employee ID | Password |
|------|------------|----------|
| Admin | ADMIN001 | admin123 |
| Manager | MGR001 | manager123 |
| Employee | EMP001 | employee123 |

Additional employee accounts are also created with IDs EMP002, EMP003, etc., with passwords following the pattern `employee2123`, `employee3123`, etc.

## API Endpoints

### Authentication
- `POST /api/login/` - User login

### Employees
- `GET /api/employees/` - List employees
- `POST /api/employees/` - Create employee
- `PUT /api/employees/{id}/` - Update employee
- `DELETE /api/employees/{id}/` - Delete employee

### Punch Records
- `GET /api/punch-records/` - List punch records
- `POST /api/punch-records/punch/` - Punch in/out

### Reports
- `GET /api/reports/` - List reports
- `POST /api/reports/` - Create report

## Usage Guide

### For Admins
1. Login with admin credentials
2. Add new employees using the "Add Employee" button
3. View and manage all employee records in the table
4. Monitor punch records and salary calculations
5. Generate reports as needed

### For Managers
1. Login with manager credentials
2. View list of employees under management
3. Edit employee details as needed
4. Monitor punch records and productivity
5. Track team salary expenses

### For Employees
1. Login with employee credentials
2. Use "Punch In" when starting work
3. Use "Punch Out" when ending work
4. Edit personal information as needed
5. View work history and earnings

## Key Features Explained

### Salary Calculation
- Automatic calculation based on $6/hour rate
- Real-time updates when punch records are modified
- Displays both daily and total earnings

### Time Tracking
- Prevents multiple punch-ins on the same day
- Automatic calculation of total hours worked
- Historical record keeping

### Role-Based Access
- Different dashboards based on user role
- Appropriate permissions for each user type
- Secure authentication using Django tokens

## Development Notes

### Adding New Features
1. Backend: Add models to `employees/models.py`
2. Create serializers in `employees/serializers.py`
3. Add views to `employees/views.py`
4. Update URLs in `employees/urls.py`
5. Frontend: Create components in `src/components/`
6. Update API services in `src/services/api.js`

### Database Management
- Use `python manage.py makemigrations` for model changes
- Apply migrations with `python manage.py migrate`
- Access admin panel at `http://localhost:8000/admin/`

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Ensure django-cors-headers is installed
   - Check CORS settings in Django settings.py

2. **Authentication Issues:**
   - Verify token is being sent in API requests
   - Check if user is active in Django admin

3. **Database Issues:**
   - Run migrations if models have changed
   - Check database file permissions

4. **Frontend Build Issues:**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Update dependencies if needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues or questions, please create an issue in the repository or contact the development team.
