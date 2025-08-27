from django.db import models
from users.models import User

class Geofence(models.Model):
    name = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    radius = models.FloatField(help_text="Radius in meters")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='geofences')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    


class Attendance(models.Model):
    TYPE_CHOICES = (
        ('clock-in', 'Clock In'),
        ('clock-out', 'Clock Out'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendances')
    geofence = models.ForeignKey(Geofence, on_delete=models.CASCADE, related_name='attendances', null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    latitude = models.FloatField()
    longitude = models.FloatField()
    is_auto = models.BooleanField(default=False)

    
    def __str__(self):
        return f"{self.user.username} - {self.type} at {self.timestamp}"
    




class Complaint(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('resolved', 'Resolved'),
        ('rejected', 'Rejected'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='complaints')
    subject = models.CharField(max_length=255)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_response = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Complaint #{self.id} - {self.subject}"

class LoginLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_logs')
    login_time = models.DateTimeField(auto_now_add=True)
    logout_time = models.DateTimeField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    session_key = models.CharField(max_length=40, null=True, blank=True)
    was_successful = models.BooleanField(default=True)
    failure_reason = models.CharField(max_length=255, null=True, blank=True)
    
    class Meta:
        ordering = ['-login_time']
        verbose_name = 'Login Log'
        verbose_name_plural = 'Login Logs'
    
    def __str__(self):
        return f"{self.user.username} - {self.login_time} (Success: {self.was_successful})"
    
    @property
    def duration(self):
        if self.logout_time and self.login_time:
            return self.logout_time - self.login_time
        return None