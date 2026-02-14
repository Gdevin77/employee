from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Sum
from .models import Employee, PunchRecord, Report
from .serializers import (
    EmployeeSerializer, PunchRecordSerializer, LoginSerializer,
    ReportSerializer, PunchInOutSerializer
)
import json


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        response_data = {
            'token': token.key,
            'employee_id': user.employee_id,
            'role': user.role,
        }
        return Response(response_data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'manager':
            return Employee.objects.filter(role='employee')
        return self.queryset

    def perform_create(self, serializer):
        serializer.save()


class PunchRecordViewSet(viewsets.ModelViewSet):
    queryset = PunchRecord.objects.all()
    serializer_class = PunchRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'employee':
            return self.queryset.filter(employee=user)
        elif user.role == 'manager':
            return self.queryset.filter(employee__role='employee')
        return self.queryset

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def punch(self, request):
        serializer = PunchInOutSerializer(
            data=request.data, context={'request': request})
        if serializer.is_valid():
            employee = request.user
            action = serializer.validated_data['action']

            if action == 'punch_in':
                PunchRecord.objects.create(
                    employee=employee,
                    punch_in=timezone.now()
                )
                return Response({'status': 'punched in'}, status=status.HTTP_200_OK)

            elif action == 'punch_out':
                today_record = PunchRecord.objects.filter(
                    employee=employee,
                    date=timezone.now().date(),
                    punch_out__isnull=True
                ).first()
                if today_record:
                    today_record.punch_out = timezone.now()
                    today_record.save()
                    return Response({'status': 'punched out'}, status=status.HTTP_200_OK)
                return Response({'status': 'no punch in record found'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'employee':
            return Report.objects.none()
        return self.queryset

    def create(self, request, *args, **kwargs):
        try:
            # Extract data from request
            title = request.data.get('title')
            report_type = request.data.get('report_type')
            start_date = request.data.get('start_date')
            end_date = request.data.get('end_date')

            # Validate required fields
            if not all([title, report_type, start_date, end_date]):
                return Response(
                    {'error': 'Missing required fields: title, report_type, start_date, end_date'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Generate report data based on type
            report_data = self.generate_report_data(
                report_type, start_date, end_date)

            # Create report
            report = Report.objects.create(
                title=title,
                report_type=report_type,
                generated_by=request.user,
                start_date=start_date,
                end_date=end_date,
                data=report_data
            )

            # Serialize and return
            serializer = self.get_serializer(report)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
