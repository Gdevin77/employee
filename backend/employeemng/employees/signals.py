from django.contrib.auth import get_user_model
from django.db.models.signals import post_migrate
from django.dispatch import receiver


@receiver(post_migrate)
def create_default_users(sender, **kwargs):
    """Ensure default demo accounts exist after migrations."""
    User = get_user_model()

    defaults = [
        {
            "employee_id": "ADMIN001",
            "username": "admin",
            "first_name": "System",
            "last_name": "Administrator",
            "email": "admin@company.com",
            "role": "admin",
            "password": "admin123",
            "is_staff": True,
            "is_superuser": True,
        },
        {
            "employee_id": "MGR001",
            "username": "manager",
            "first_name": "John",
            "last_name": "Manager",
            "email": "manager@company.com",
            "role": "manager",
            "password": "manager123",
            "is_staff": False,
            "is_superuser": False,
        },
        {
            "employee_id": "EMP001",
            "username": "employee",
            "first_name": "Jane",
            "last_name": "Employee",
            "email": "employee@company.com",
            "role": "employee",
            "password": "employee123",
            "campaign": "Marketing Campaign 2024",
            "is_staff": False,
            "is_superuser": False,
        },
    ]

    for data in defaults:
        employee_id = data["employee_id"]
        password = data.pop("password")

        user, created = User.objects.get_or_create(
            employee_id=employee_id,
            defaults=data,
        )

        if not created:
            for field, value in data.items():
                setattr(user, field, value)

        # Always enforce known demo credentials for hosted demos.
        user.set_password(password)
        user.save()