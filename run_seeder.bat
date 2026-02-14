@echo off
echo Running Employee Management System Data Seeder...
echo.

cd backend\employeemng
python -c "import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'employeemng.settings'); import django; django.setup(); from seed_data import run_seeder; run_seeder()"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Data seeding completed successfully!
    echo.
    echo You can now log in with these credentials:
    echo.
    echo Admin:    ADMIN001 / admin123
    echo Manager:  MGR001 / manager123
    echo Employee: EMP001 / employee1123
    echo.
) else (
    echo.
    echo Error running the seeder script.
    echo Make sure your Django server is properly configured.
    echo.
)

pause