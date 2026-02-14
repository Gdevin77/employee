from django.db import transaction
from employees.models import Employee, PunchRecord, Report
from django.utils import timezone
import os
import sys
import django
import random
from datetime import datetime, timedelta, time

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'employeemng.settings')
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
django.setup()


def create_test_employees():
    """Create test employees if they don't exist"""
    print("Creating test employees...")

    # Create admin if not exists
    if not Employee.objects.filter(employee_id='ADMIN001').exists():
        admin = Employee.objects.create_user(
            username='admin',
            employee_id='ADMIN001',
            password='admin123',
            first_name='Admin',
            last_name='User',
            email='admin@example.com',
            role='admin',
            hourly_rate=10.00
        )
        print(f"Created admin: {admin}")

    # Create manager if not exists
    if not Employee.objects.filter(employee_id='MGR001').exists():
        manager = Employee.objects.create_user(
            username='manager',
            employee_id='MGR001',
            password='manager123',
            first_name='Manager',
            last_name='User',
            email='manager@example.com',
            role='manager',
            hourly_rate=8.00
        )
        print(f"Created manager: {manager}")

    # Create employees if not enough exist
    employee_count = Employee.objects.filter(role='employee').count()
    if employee_count < 5:
        for i in range(1, 6 - employee_count):
            emp_id = f'EMP{i:03d}'
            if not Employee.objects.filter(employee_id=emp_id).exists():
                employee = Employee.objects.create_user(
                    username=f'employee{i}',
                    employee_id=emp_id,
                    password=f'employee{i}123',
                    first_name=f'Employee{i}',
                    last_name='User',
                    email=f'employee{i}@example.com',
                    role='employee',
                    hourly_rate=6.00 + (i * 0.5),  # Different hourly rates
                    campaign=random.choice(
                        ['Marketing', 'Sales', 'Support', 'Development'])
                )
                print(f"Created employee: {employee}")


def create_punch_records():
    """Create punch records for the past 30 days for all employees"""
    print("Creating punch records...")

    employees = Employee.objects.filter(role='employee')
    if not employees:
        print("No employees found. Please create employees first.")
        return

    # Delete existing punch records for clean slate
    PunchRecord.objects.all().delete()

    # Generate punch records for the past 30 days
    for employee in employees:
        print(f"Creating punch records for {employee}...")

        # For each day in the past 30 days
        for day_offset in range(30, 0, -1):
            # Skip weekends (Saturday=5, Sunday=6)
            record_date = timezone.now().date() - timedelta(days=day_offset)
            if record_date.weekday() >= 5:  # Skip weekends
                continue

            # 80% chance of having a record for this day
            if random.random() < 0.8:
                # Random start time between 8:00 AM and 9:30 AM
                start_hour = random.randint(8, 9)
                start_minute = random.randint(
                    0, 59) if start_hour == 8 else random.randint(0, 30)
                punch_in_time = time(start_hour, start_minute)

                # Random end time between 4:30 PM and 6:00 PM
                end_hour = random.randint(16, 18)
                end_minute = random.randint(
                    30, 59) if end_hour == 16 else random.randint(0, 59)
                punch_out_time = time(end_hour, end_minute)

                # Combine date and time
                punch_in = datetime.combine(record_date, punch_in_time)
                punch_out = datetime.combine(record_date, punch_out_time)

                # Create the punch record
                punch_record = PunchRecord.objects.create(
                    employee=employee,
                    punch_in=punch_in,
                    punch_out=punch_out,
                    date=record_date
                )

                # Calculate total hours and save
                time_diff = punch_out - punch_in
                total_hours = round(time_diff.total_seconds() / 3600, 2)
                punch_record.total_hours = total_hours
                punch_record.save()

                print(
                    f"  Created record for {record_date}: {total_hours} hours")


def create_sample_reports():
    """Create sample reports for demonstration"""
    print("Creating sample reports...")

    # Delete existing reports for clean slate
    Report.objects.all().delete()

    # Get admin user
    try:
        admin = Employee.objects.get(role='admin')
    except Employee.DoesNotExist:
        print("Admin user not found. Please create an admin user first.")
        return

    # Create attendance report
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=30)

    # Get all punch records in the date range
    punch_records = PunchRecord.objects.filter(
        date__gte=start_date,
        date__lte=end_date
    )

    # Group by employee
    attendance_data = {}
    for record in punch_records:
        employee_id = record.employee.employee_id
        if employee_id not in attendance_data:
            attendance_data[employee_id] = {
                'name': record.employee.full_name,
                'days_worked': 0,
                'total_hours': 0,
                'avg_hours_per_day': 0
            }

        attendance_data[employee_id]['days_worked'] += 1
        attendance_data[employee_id]['total_hours'] += float(
            record.total_hours or 0)

    # Calculate averages
    for employee_id in attendance_data:
        days = attendance_data[employee_id]['days_worked']
        if days > 0:
            attendance_data[employee_id]['avg_hours_per_day'] = round(
                attendance_data[employee_id]['total_hours'] / days, 2
            )

    # Create attendance report
    Report.objects.create(
        title="Monthly Attendance Report",
        report_type="attendance",
        generated_by=admin,
        start_date=start_date,
        end_date=end_date,
        data=attendance_data
    )
    print("Created attendance report")

    # Create salary report
    salary_data = {}
    for record in punch_records:
        employee_id = record.employee.employee_id
        if employee_id not in salary_data:
            salary_data[employee_id] = {
                'name': record.employee.full_name,
                'hourly_rate': float(record.employee.hourly_rate),
                'total_hours': 0,
                'total_salary': 0
            }

        hours = float(record.total_hours or 0)
        salary_data[employee_id]['total_hours'] += hours
        salary_data[employee_id]['total_salary'] += hours * \
            float(record.employee.hourly_rate)

    # Create salary report
    Report.objects.create(
        title="Monthly Salary Report",
        report_type="salary",
        generated_by=admin,
        start_date=start_date,
        end_date=end_date,
        data=salary_data
    )
    print("Created salary report")

    # Create employee report (summary of all employees)
    employees = Employee.objects.filter(role='employee')
    employee_data = {}

    for employee in employees:
        employee_records = PunchRecord.objects.filter(
            employee=employee,
            date__gte=start_date,
            date__lte=end_date
        )

        total_hours = sum(float(record.total_hours or 0)
                          for record in employee_records)
        total_salary = total_hours * float(employee.hourly_rate)

        employee_data[employee.employee_id] = {
            'name': employee.full_name,
            'email': employee.email,
            'role': employee.role,
            'campaign': employee.campaign,
            'hourly_rate': float(employee.hourly_rate),
            'total_hours': total_hours,
            'total_salary': total_salary,
            'days_worked': employee_records.count()
        }

    # Create employee report
    Report.objects.create(
        title="Employee Summary Report",
        report_type="employee",
        generated_by=admin,
        start_date=start_date,
        end_date=end_date,
        data=employee_data
    )
    print("Created employee report")


@transaction.atomic
def run_seeder():
    """Run all seeder functions"""
    create_test_employees()
    create_punch_records()
    create_sample_reports()
    print("Data seeding completed successfully!")


if __name__ == "__main__":
    run_seeder()
