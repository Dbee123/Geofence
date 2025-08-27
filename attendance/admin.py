from django.contrib import admin
from .models import Geofence, Attendance, Complaint, LoginLog

# Register your models here.
admin.site.register(Geofence)
admin.site.register(Attendance)
admin.site.register(Complaint)
admin.site.register(LoginLog)
admin.site.site_header = "Attendance Management Admin"
admin.site.site_title = "Admin Portal"
admin.site.index_title = "Welcome to the Admin Portal"
