#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'employeemng.settings')
django.setup()

from employees.models import Employee

def create_initial_users():
    """Create initial admin, manager, and employee users for testing"""
    
    # Create admin user
    if not Employee.objects.filter(employee_id='ADMIN001').exists():
        admin_user = Employee.objects.create_user(
            username='admin',
            employee_id='ADMIN001',
            first_name='System',
            last_name='Administrator',
            email='admin@company.com',
            role='admin',
            password='admin123'
        )
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()
        print("✓ Created admin user: ADMIN001 / admin123")
    
    # Create manager user
    if not Employee.objects.filter(employee_id='MGR001').exists():
        manager_user = Employee.objects.create_user(
            username='manager',
            employee_id='MGR001',
            first_name='John',
            last_name='Manager',
            email='manager@company.com',
            role='manager',
            password='manager123'
        )
        print("✓ Created manager user: MGR001 / manager123")
    
    # Create employee user
    if not Employee.objects.filter(employee_id='EMP001').exists():
        employee_user = Employee.objects.create_user(
            username='employee',
            employee_id='EMP001',
            first_name='Jane',
            last_name='Employee',
            email='employee@company.com',
            role='employee',
            password='employee123',
            campaign='Marketing Campaign 2024'
        )
        print("✓ Created employee user: EMP001 / employee123")

if __name__ == '__main__':
    print("Setting up Employee Management System database...")
    create_initial_users()
    print("Database setup complete!")
    print("\nDefault login credentials:")
    print("Admin:    ADMIN001 / admin123")
    print("Manager:  MGR001 / manager123")
    print("Employee: EMP001 / employee123")
