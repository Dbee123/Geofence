import googlemaps
from django.conf import settings
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from users.serializers import UserSerializer
from .models import Geofence, Attendance
from .serializers import CurrentAttendanceStatusSerializer, GeofenceSerializer, AttendanceSerializer
from django.shortcuts import get_object_or_404
from users.models import User
from django.contrib.gis.geos import Point
from django.db import transaction
from django.utils import timezone
import math
import logging
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import Complaint, LoginLog
from .serializers import ComplaintSerializer, LoginLogSerializer, AttendanceReportSerializer


gmaps = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)

class GeofenceListView(generics.ListCreateAPIView):
    queryset = Geofence.objects.all()
    serializer_class = GeofenceSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]  # allow both admins and employees to view
     
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "total": queryset.count(),
            "geofences": serializer.data
        }, status=status.HTTP_200_OK)


class GeofenceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Geofence.objects.all()
    serializer_class = GeofenceSerializer
    permission_classes = [permissions.IsAdminUser]

class AttendanceListView(generics.ListAPIView):
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Attendance.objects.all()
        return Attendance.objects.filter(user=user)




logger = logging.getLogger(__name__)

class ClockInOutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    EARTH_RADIUS_M = 6371000  # Earth radius in meters
    
    def haversine_distance(self, lat1, lon1, lat2, lon2):
        """
        Calculate distance between two points using Haversine formula
        """
        try:
            # Convert decimal degrees to radians
            lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
            
            # Haversine formula
            dlat = lat2 - lat1 
            dlon = lon2 - lon1 
            a = (math.sin(dlat/2)**2 + 
                 math.cos(lat1) * math.cos(lat2) * 
                 math.sin(dlon/2)**2)
            c = 2 * math.asin(math.sqrt(a))
            return self.EARTH_RADIUS_M * c
        except Exception as e:
            logger.error(f"Distance calculation error: {str(e)}")
            raise

    def validate_coordinates(self, latitude, longitude):
        """Validate coordinate ranges"""
        if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
            raise ValueError("Coordinates out of valid range")
        return True

    def get_nearest_geofence(self, lat, lng):
        """
        Find the nearest geofence with optimized query
        Returns tuple of (geofence, distance)
        """
        try:
            geofences = Geofence.objects.all()
            if not geofences.exists():
                return (None, None)
            
            nearest = None
            min_distance = float('inf')
            
            for geofence in geofences:
                distance = self.haversine_distance(
                    lat, lng,
                    geofence.latitude, geofence.longitude
                )
                
                # Check if within radius + 10m buffer
                if distance <= (geofence.radius + 10):
                    return (geofence, distance)
                
                # Track nearest for error reporting
                if distance < min_distance:
                    min_distance = distance
                    nearest = geofence
            
            return (None, min_distance)
        except Exception as e:
            logger.error(f"Geofence lookup error: {str(e)}")
            raise

    def validate_attendance_sequence(self, user, action):
        """Ensure proper clock-in/out sequence"""
        last_attendance = Attendance.objects.filter(user=user).last()
        
        if action == 'clock-in':
            if last_attendance and last_attendance.type == 'clock-in':
                raise ValueError("Already clocked in")
        elif action == 'clock-out':
            if not last_attendance or last_attendance.type == 'clock-out':
                raise ValueError("No active clock-in found")
        else:
            raise ValueError("Invalid action type")

    @transaction.atomic
    def post(self, request, action, *args, **kwargs):
        try:
            user = request.user
            latitude = request.data.get('latitude')
            longitude = request.data.get('longitude')
            
            # Validate presence of location data
            if not latitude or not longitude:
                return Response(
                    {'error': 'Location data is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Convert and validate coordinates
            try:
                lat = float(latitude)
                lng = float(longitude)
                self.validate_coordinates(lat, lng)
            except (TypeError, ValueError) as e:
                return Response(
                    {'error': 'Invalid location data', 'details': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Find appropriate geofence
            within_geofence, distance = self.get_nearest_geofence(lat, lng)
            
            if not within_geofence:
                nearest_geofence = Geofence.objects.first()  # Simplified for example
                return Response(
                    {
                        'error': 'Not within any geofence',
                        'details': {
                            'nearest_geofence': {
                                'name': nearest_geofence.name,
                                'distance': distance,
                                'required_radius': nearest_geofence.radius
                            }
                        }
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Validate attendance sequence
            try:
                self.validate_attendance_sequence(user, action)
            except ValueError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create attendance record
            attendance_data = {
                'user': user.id,
                'geofence': within_geofence.id,
                'type': action,
                'latitude': lat,
                'longitude': lng,
                'timestamp': timezone.now()
            }
            
            serializer = AttendanceSerializer(data=attendance_data)
            if not serializer.is_valid():
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            attendance = serializer.save()
            
            return Response(
                {
                    'success': True,
                    'data': serializer.data,
                    'geofence': {
                        'name': within_geofence.name,
                        'distance': distance
                    }
                },
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            logger.exception("Unexpected error in attendance processing")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class AutoClockOutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    @transaction.atomic
    def post(self, request, *args, **kwargs):
        try:
            user = request.user
            latitude = request.data.get('latitude')
            longitude = request.data.get('longitude')
            original_geofence_id = request.data.get('original_geofence_id')
            
            # Validate required fields
            if not all([latitude, longitude, original_geofence_id]):
                return Response(
                    {'error': 'Missing required fields: latitude, longitude, original_geofence_id'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate coordinates
            try:
                lat = float(latitude)
                lng = float(longitude)
                if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
                    raise ValueError("Coordinates out of valid range")
            except (TypeError, ValueError) as e:
                return Response(
                    {'error': 'Invalid location data', 'details': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the original geofence where user clocked in
            try:
                original_geofence = Geofence.objects.get(pk=original_geofence_id)
            except Geofence.DoesNotExist:
                return Response(
                    {'error': 'Original geofence not found'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verify user is currently clocked in
            last_attendance = Attendance.objects.filter(user=user).order_by('-timestamp').first()
            
            if not last_attendance or last_attendance.type != 'clock-in':
                return Response(
                    {'error': 'No active clock-in found. User is not currently clocked in.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Additional validation: ensure they clocked in at the same geofence
            if last_attendance.geofence_id != original_geofence_id:
                logger.warning(f"Auto clock-out geofence mismatch: clocked in at {last_attendance.geofence_id}, trying to clock out from {original_geofence_id}")
                # Still allow it but log the discrepancy
            
            # Create auto clock-out record
            # Note: We don't check if they're within ANY geofence because 
            # the whole point is they've LEFT the geofence
            attendance = Attendance.objects.create(
                user=user,
                geofence=original_geofence,  # Use the original geofence they clocked in from
                type='clock-out',
                latitude=lat,
                longitude=lng,
                is_auto=True,
                timestamp=timezone.now()
            )
            
            logger.info(f"Auto clock-out successful: User {user.username} from {original_geofence.name}")
            
            return Response(
                {
                    'success': True,
                    'message': f'Auto clock-out from {original_geofence.name} recorded successfully',
                    'data': {
                        'id': attendance.id,
                        'user': user.username,
                        'geofence': {
                            'id': original_geofence.id,
                            'name': original_geofence.name
                        },
                        'type': 'clock-out',
                        'is_auto': True,
                        'timestamp': attendance.timestamp,
                        'location': {
                            'latitude': lat,
                            'longitude': lng
                        }
                    }
                },
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            logger.exception(f"Auto clock-out error for user {request.user.username}: {str(e)}")
            return Response(
                {
                    'error': 'Failed to process auto clock-out',
                    'details': str(e) if settings.DEBUG else 'Internal server error'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

logger = logging.getLogger(__name__)

# ... (keep your existing views)

class ComplaintListView(generics.ListCreateAPIView):
    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Complaint.objects.all().order_by('-created_at')
        return Complaint.objects.filter(user=user).order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ComplaintDetailView(generics.RetrieveUpdateAPIView):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.user.role != 'admin' and request.user != instance.user:
            return Response(
                {'error': 'You do not have permission to perform this action.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)

class LoginLogListView(generics.ListAPIView):
    serializer_class = LoginLogSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        queryset = LoginLog.objects.all().order_by('-login_time')
        
        # Filtering options
        user_id = self.request.query_params.get('user_id')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if date_from:
            queryset = queryset.filter(login_time__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(login_time__date__lte=date_to)
            
        return queryset

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            # Get the most recent login log without logout time
            login_log = LoginLog.objects.filter(
                user=request.user,
                logout_time__isnull=True
            ).order_by('-login_time').first()
            
            if login_log:
                login_log.logout_time = timezone.now()
                login_log.save()
                return Response({'success': True}, status=status.HTTP_200_OK)
            
            return Response(
                {'error': 'No active login session found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Logout error: {str(e)}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from django.db.models.functions import TruncDate
from datetime import timedelta, date, datetime

class AttendanceReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        group_by = request.query_params.get('group_by', 'day')
        start_date_str = request.query_params.get('start_date')

        try:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return Response({"error": "Invalid or missing start_date"}, status=400)

        end_date = date.today()

        # Group by date
        queryset = Attendance.objects.filter(
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date
        ).annotate(day=TruncDate('timestamp'))

        # Count clock-ins and outs by day
        clock_in_data = queryset.filter(type='clock-in').values('day').annotate(count=Count('id'))
        clock_out_data = queryset.filter(type='clock-out').values('day').annotate(count=Count('id'))

        # Convert to dict
        clock_in_dict = {d['day'].strftime('%Y-%m-%d'): d['count'] for d in clock_in_data}
        clock_out_dict = {d['day'].strftime('%Y-%m-%d'): d['count'] for d in clock_out_data}

        # Build 7-day padded response
        results = []
        current_date = start_date
        while current_date <= end_date:
            date_str = current_date.strftime('%Y-%m-%d')
            results.append({
                'date': date_str,
                'clock_in': clock_in_dict.get(date_str, 0),
                'clock_out': clock_out_dict.get(date_str, 0),
            })
            current_date += timedelta(days=1)

        return Response(results)


class SystemStatsView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        # Basic stats
        stats = {
            'total_users': User.objects.count(),
            'total_geofences': Geofence.objects.count(),
            'total_attendances': Attendance.objects.count(),
            'total_complaints': Complaint.objects.count(),
            'pending_complaints': Complaint.objects.filter(status='pending').count(),
            'active_logins': LoginLog.objects.filter(logout_time__isnull=True).count(),
        }
        
        # Attendance stats for last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        stats['recent_attendances'] = Attendance.objects.filter(
            timestamp__gte=thirty_days_ago
        ).count()
        
        # Login stats for last 30 days
        stats['recent_logins'] = LoginLog.objects.filter(
            login_time__gte=thirty_days_ago
        ).count()
        
        return Response(stats)
    




class UserActivityView(APIView):
    def get(self, request, user_id):
        user = get_object_or_404(User, pk=user_id)
        
        # Get all related data
        attendances = Attendance.objects.filter(user=user).select_related('geofence', 'user')
        complaints = Complaint.objects.filter(user=user).select_related('user')
        login_logs = LoginLog.objects.filter(user=user).select_related('user')
        
        # Serialize the data
        user_data = UserSerializer(user).data
        attendance_data = AttendanceSerializer(attendances, many=True).data
        complaint_data = ComplaintSerializer(complaints, many=True).data
        login_log_data = LoginLogSerializer(login_logs, many=True).data
        
        response_data = {
            'user': user_data,
            'attendances': attendance_data,
            'complaints': complaint_data,
            'login_logs': login_log_data,
        }
        
        return Response(response_data)



class CurrentAttendanceStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            # Get the most recent attendance record for this user
            last_attendance = Attendance.objects.filter(
                user=request.user
            ).select_related('geofence').order_by('-timestamp').first()
            
            response_data = {
                'isClockedIn': False,
                'lastAction': None,
                'lastActionTime': None,
                'lastGeofence': None
            }
            
            if last_attendance:
                response_data = {
                    'isClockedIn': last_attendance.type == 'clock-in',
                    'lastAction': last_attendance.type,
                    'lastActionTime': last_attendance.timestamp,
                    'lastGeofence': {
                        'id': last_attendance.geofence.id,
                        'name': last_attendance.geofence.name
                    } if last_attendance.geofence else None
                }
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error fetching current attendance status: {str(e)}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )