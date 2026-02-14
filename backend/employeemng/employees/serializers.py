from rest_framework import serializers
from django.contrib.auth import authenticate
from django.db.models import Sum
from django.utils import timezone
from .models import Employee, PunchRecord, Report


class EmployeeSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    total_salary = serializers.SerializerMethodField()
    total_hours = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'first_name', 'last_name', 'email',
            'phone_number', 'address', 'campaign', 'role', 'hourly_rate',
            'password', 'total_salary', 'total_hours', 'is_active', 'username'
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'username': {'required': False},
        }

    def create(self, validated_data):
        password = validated_data.pop('password')

        # Ensure username is set (required by Django's User model)
        if 'username' not in validated_data or not validated_data['username']:
            # Use email as username if not provided
            validated_data['username'] = validated_data.get(
                'email', validated_data.get('employee_id', ''))

        employee = Employee.objects.create_user(**validated_data)
        employee.set_password(password)
        employee.save()
        return employee

    def update(self, instance, validated_data):
        # Handle password separately
        password = validated_data.pop('password', None)

        # Ensure username is preserved if not explicitly changed
        if 'username' not in validated_data or not validated_data['username']:
            validated_data['username'] = instance.username

        # Update all other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Update password if provided
        if password:
            instance.set_password(password)

        instance.save()
        return instance

    def get_total_salary(self, obj):
        total_hours = obj.punch_records.aggregate(
            total=Sum('total_hours')
        )['total'] or 0
        return float(total_hours * obj.hourly_rate)

    def get_total_hours(self, obj):
        total_hours = obj.punch_records.aggregate(
            total=Sum('total_hours')
        )['total'] or 0
        return float(total_hours)


class PunchRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(
        source='employee.full_name', read_only=True)
    daily_salary = serializers.ReadOnlyField()

    class Meta:
        model = PunchRecord
        fields = [
            'id', 'employee', 'employee_name', 'punch_in', 'punch_out',
            'date', 'total_hours', 'daily_salary'
        ]
        read_only_fields = ['date', 'total_hours']


class LoginSerializer(serializers.Serializer):
    employee_id = serializers.CharField()
    password = serializers.CharField()

    def validate(self, attrs):
        employee_id = attrs.get('employee_id')
        password = attrs.get('password')

        if employee_id and password:
            user = authenticate(
                request=self.context.get('request'),
                username=employee_id,
                password=password
            )

            if not user:
                msg = 'Unable to log in with provided credentials.'
                raise serializers.ValidationError(msg, code='authorization')

            if not user.is_active:
                msg = 'User account is disabled.'
                raise serializers.ValidationError(msg, code='authorization')

            attrs['user'] = user
            return attrs
        else:
            msg = 'Must include "employee_id" and "password".'
            raise serializers.ValidationError(msg, code='authorization')


class ReportSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.CharField(
        source='generated_by.full_name', read_only=True)
    data = serializers.JSONField(required=False, default=dict)

    class Meta:
        model = Report
        fields = [
            'id', 'title', 'report_type', 'generated_by', 'generated_by_name',
            'generated_at', 'start_date', 'end_date', 'data'
        ]
        read_only_fields = ['generated_by', 'generated_at']

    def create(self, validated_data):
        # Generate report data based on type
        report_type = validated_data.get('report_type')
        start_date = validated_data.get('start_date')
        end_date = validated_data.get('end_date')

        # Generate data if not provided
        if 'data' not in validated_data or not validated_data['data']:
            validated_data['data'] = self.generate_report_data(
                report_type, start_date, end_date)

        return super().create(validated_data)

    def generate_report_data(self, report_type, start_date, end_date):
        """Generate report data based on type and date range"""
        if report_type == 'attendance':
            return self.generate_attendance_report(start_date, end_date)
        elif report_type == 'salary':
            return self.generate_salary_report(start_date, end_date)
        elif report_type == 'employee':
            return self.generate_employee_report(start_date, end_date)
        else:
            return {}

    def generate_attendance_report(self, start_date, end_date):
        """Generate attendance report data"""
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

        return attendance_data

    def generate_salary_report(self, start_date, end_date):
        """Generate salary report data"""
        # Get all punch records in the date range
        punch_records = PunchRecord.objects.filter(
            date__gte=start_date,
            date__lte=end_date
        )

        # Group by employee
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

        return salary_data

    def generate_employee_report(self, start_date, end_date):
        """Generate employee report data"""
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

        return employee_data


class PunchInOutSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['punch_in', 'punch_out'])

    def validate(self, attrs):
        action = attrs.get('action')
        user = self.context['request'].user

        if action == 'punch_in':
            # Check if already punched in today
            today_record = PunchRecord.objects.filter(
                employee=user,
                date=timezone.now().date(),
                punch_out__isnull=True
            ).first()

            if today_record:
                raise serializers.ValidationError("Already punched in today")

        elif action == 'punch_out':
            # Check if punched in today and not punched out
            today_record = PunchRecord.objects.filter(
                employee=user,
                date=timezone.now().date(),
                punch_out__isnull=True
            ).first()

            if not today_record:
                raise serializers.ValidationError(
                    "No punch in record found for today")

        return attrs
