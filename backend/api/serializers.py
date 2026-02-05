from rest_framework import serializers
from .models import User, BilliardSession, PS4Session, InventoryItem, PS4Game, PS4TimeOption, AppSettings, BarOrder


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class BilliardSessionSerializer(serializers.ModelSerializer):
    # Override datetime fields to use ISO format
    start_time = serializers.DateTimeField(format='%H:%M:%S', required=False)
    stop_time = serializers.DateTimeField(format='%H:%M:%S', required=False, allow_null=True)
    date = serializers.DateField(format='%Y-%m-%d')
    
    class Meta:
        model = BilliardSession
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def to_internal_value(self, data):
        # Convert camelCase to snake_case
        converted = {}
        for key, value in data.items():
            snake_key = ''
            for i, char in enumerate(key):
                if char.isupper():
                    if i > 0:
                        snake_key += '_'
                    snake_key += char.lower()
                else:
                    snake_key += char
            converted[snake_key] = value
        return super().to_internal_value(converted)
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Convert snake_case to camelCase for frontend
        camel_data = {}
        for key, value in data.items():
            if value is None:
                camel_data[key.replace('_', '', 1)] = value if not key.startswith('_') else key
                continue
            camel_key = ''
            for i, char in enumerate(key):
                if char == '_':
                    continue
                if i > 0 and key[i-1] == '_':
                    camel_key += char.upper()
                else:
                    camel_key += char
            camel_data[camel_key] = value
        return camel_data


class PS4SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PS4Session
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def to_internal_value(self, data):
        # Convert camelCase to snake_case
        converted = {}
        for key, value in data.items():
            snake_key = ''
            for i, char in enumerate(key):
                if char.isupper():
                    if i > 0:
                        snake_key += '_'
                    snake_key += char.lower()
                else:
                    snake_key += char
            converted[snake_key] = value
        return super().to_internal_value(converted)


class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class PS4TimeOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PS4TimeOption
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class PS4GameSerializer(serializers.ModelSerializer):
    time_options = PS4TimeOptionSerializer(many=True, read_only=True)
    
    class Meta:
        model = PS4Game
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class AppSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppSettings
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class AnalyticsSerializer(serializers.Serializer):
    total_billard = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_ps4 = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_sessions = serializers.IntegerField()


class BarOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = BarOrder
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
