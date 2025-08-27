from django.urls import path
from .views import (
    AutoClockOutView,
    CurrentAttendanceStatusView,
    GeofenceListView, 
    GeofenceDetailView,
    AttendanceListView,
    ClockInOutView,
    ComplaintListView,
    ComplaintDetailView,
    LoginLogListView,
    LogoutView,
    AttendanceReportView,
    SystemStatsView,
)

urlpatterns = [
    path('geofences/', GeofenceListView.as_view(), name='geofence-list'),
    path('geofences/<int:pk>/', GeofenceDetailView.as_view(), name='geofence-detail'),
    path('attendance/', AttendanceListView.as_view(), name='attendance-list'),
    path('attendance/auto-clockout/', AutoClockOutView.as_view(), name='auto-clock-out'),
    path('attendance/<str:action>/', ClockInOutView.as_view(), name='clock-in-out'),
    path('current/attendance/', CurrentAttendanceStatusView.as_view(), name='current-attendance-status'),
    path('complaints/', ComplaintListView.as_view(), name='complaint-list'),
    path('complaints/<int:pk>/', ComplaintDetailView.as_view(), name='complaint-detail'),
    path('login-logs/', LoginLogListView.as_view(), name='login-log-list'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('reports/attendance/', AttendanceReportView.as_view(), name='attendance-report'),
    path('stats/', SystemStatsView.as_view(), name='system-stats'),
    

]