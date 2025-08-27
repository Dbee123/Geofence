from rest_framework import serializers
from .models import Geofence, Attendance, Complaint, LoginLog
from users.models import User
from users.serializers import UserSerializer

class GeofenceSerializer(serializers.ModelSerializer):
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = Geofence
        fields = ['id', 'name', 'latitude', 'longitude', 'radius', 'created_by', 'created_at']
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['created_by'] = request.user
        return super().create(validated_data)

class AttendanceSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    geofence_details = GeofenceSerializer(source='geofence', read_only=True)
    
    class Meta:
        model = Attendance
        fields = [
            'id',
            'user',
            'user_details',
            'geofence',
            'geofence_details',
            'type',
            'latitude',
            'longitude',
            'timestamp'
        ]
        read_only_fields = ['id', 'timestamp', 'user_details', 'geofence_details']
        
    def validate(self, data):
        if data['type'] not in ['clock-in', 'clock-out']:
            raise serializers.ValidationError("Invalid attendance type")
        return data
    

class CurrentAttendanceStatusSerializer(serializers.Serializer):
    isClockedIn = serializers.BooleanField()
    lastAction = serializers.CharField()
    lastActionTime = serializers.DateTimeField()
    lastGeofence = serializers.DictField(required=False)


class ComplaintSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = Complaint
        fields = [
            'id', 
            'user', 
            'user_details',
            'subject', 
            'message', 
            'status',
            'admin_response',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user', 'user_details']
    
    def validate(self, data):
        if self.instance and 'status' in data and data['status'] == 'resolved' and not data.get('admin_response'):
            raise serializers.ValidationError("Admin response is required when resolving a complaint")
        return data

class LoginLogSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = LoginLog
        fields = [
            'id',
            'user',
            'user_details',
            'login_time',
            'logout_time',
            'ip_address',
            'user_agent'
        ]
        read_only_fields = fields

class AttendanceReportSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(required=False)
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    geofence_id = serializers.IntegerField(required=False)


    