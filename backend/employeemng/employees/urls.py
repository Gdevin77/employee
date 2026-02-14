from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmployeeViewSet, PunchRecordViewSet, ReportViewSet, login

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet)
router.register(r'punch-records', PunchRecordViewSet)
router.register(r'reports', ReportViewSet)

urlpatterns = [
    path('api/login/', login, name='login'),
    path('api/', include(router.urls)),
]
