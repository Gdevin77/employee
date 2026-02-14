from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Employee, PunchRecord, Report

@admin.register(Employee)
class EmployeeAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Employee Details', {
            'fields': ('employee_id', 'role', 'phone_number', 'address', 'campaign', 'hourly_rate')
        }),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Employee Details', {
            'fields': ('employee_id', 'role', 'phone_number', 'address', 'campaign', 'hourly_rate')
        }),
    )
    list_display = ['employee_id', 'first_name', 'last_name', 'email', 'role', 'is_active']
    list_filter = ['role', 'is_active', 'date_joined']
    search_fields = ['employee_id', 'first_name', 'last_name', 'email']

@admin.register(PunchRecord)
class PunchRecordAdmin(admin.ModelAdmin):
    list_display = ['employee', 'date', 'punch_in', 'punch_out', 'total_hours', 'daily_salary']
    list_filter = ['date', 'employee__role']
    search_fields = ['employee__employee_id', 'employee__first_name', 'employee__last_name']
    readonly_fields = ['total_hours', 'daily_salary']
    date_hierarchy = 'date'

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['title', 'report_type', 'generated_by', 'generated_at']
    list_filter = ['report_type', 'generated_at']
    search_fields = ['title', 'generated_by__employee_id']
    readonly_fields = ['generated_at']
    date_hierarchy = 'generated_at'
