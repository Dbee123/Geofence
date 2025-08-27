#attendance/middleware.py
from django.utils import timezone
from .models import LoginLog
import logging

logger = logging.getLogger(__name__)

class LoginLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Log successful logins
        if request.path == '/api/login/' and response.status_code == 200:
            try:
                if request.user.is_authenticated:
                    LoginLog.objects.create(
                        user=request.user,
                        ip_address=self.get_client_ip(request),
                        user_agent=request.META.get('HTTP_USER_AGENT', '')
                    )
            except Exception as e:
                logger.error(f"Failed to log login: {str(e)}")
        
        return response
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip