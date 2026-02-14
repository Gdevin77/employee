from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class Employee(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('employee', 'Employee'),
    ]
    
    employee_id = models.CharField(max_length=20, unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    phone_number = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    campaign = models.CharField(max_length=100, blank=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, default=6.00)
    
    USERNAME_FIELD = 'employee_id'
    REQUIRED_FIELDS = ['username', 'email']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.employee_id})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

class PunchRecord(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='punch_records')
    punch_in = models.DateTimeField()
    punch_out = models.DateTimeField(null=True, blank=True)
    date = models.DateField()
    total_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    class Meta:
        unique_together = ['employee', 'date']
        ordering = ['-date', '-punch_in']
    
    def save(self, *args, **kwargs):
        if self.punch_in:
            self.date = self.punch_in.date()
        
        if self.punch_in and self.punch_out:
            time_diff = self.punch_out - self.punch_in
            self.total_hours = round(time_diff.total_seconds() / 3600, 2)
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.employee.full_name} - {self.date}"
    
    @property
    def daily_salary(self):
        if self.total_hours:
            return self.total_hours * self.employee.hourly_rate
        return 0

class Report(models.Model):
    REPORT_TYPES = [
        ('attendance', 'Attendance Report'),
        ('salary', 'Salary Report'),
        ('employee', 'Employee Report'),
    ]
    
    title = models.CharField(max_length=200)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES)
    generated_by = models.ForeignKey(Employee, on_delete=models.CASCADE)
    generated_at = models.DateTimeField(auto_now_add=True)
    start_date = models.DateField()
    end_date = models.DateField()
    data = models.JSONField()
    
    class Meta:
        ordering = ['-generated_at']
    
    def __str__(self):
        return f"{self.title} - {self.generated_at.date()}"
