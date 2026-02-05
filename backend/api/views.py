from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.hashers import make_password, check_password
from .models import User, BilliardSession, PS4Session, InventoryItem, PS4Game, PS4TimeOption, AppSettings, BarOrder
from .serializers import (
    UserSerializer, UserLoginSerializer, BilliardSessionSerializer, 
    PS4SessionSerializer, InventoryItemSerializer, PS4GameSerializer,
    PS4TimeOptionSerializer, AppSettingsSerializer, AnalyticsSerializer,
    BarOrderSerializer
)


class LoginView(APIView):
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        
        try:
            user = User.objects.get(username=username, role='admin')
            if check_password(password, user.password):
                return Response({
                    'success': True,
                    'user': UserSerializer(user).data
                })
            else:
                return Response({
                    'success': False,
                    'error': 'Invalid credentials'
                }, status=status.HTTP_401_UNAUTHORIZED)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)


class BilliardSessionViewSet(viewsets.ModelViewSet):
    queryset = BilliardSession.objects.all()
    serializer_class = BilliardSessionSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(date=date)
        return queryset


class PS4SessionViewSet(viewsets.ModelViewSet):
    queryset = PS4Session.objects.all()
    serializer_class = PS4SessionSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(date=date)
        return queryset


class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    
    def create(self, request, *args, **kwargs):
        # Create default inventory if none exists
        if not InventoryItem.objects.exists():
            defaults = [
                {'name': 'Café', 'price': 1000, 'icon': '☕'},
                {'name': 'Thé', 'price': 800, 'icon': '🍵'},
                {'name': 'Soda', 'price': 2000, 'icon': '🥤'},
                {'name': 'Eau', 'price': 1000, 'icon': '💧'},
                {'name': 'Chicha', 'price': 5000, 'icon': '💨'},
            ]
            for item in defaults:
                InventoryItem.objects.create(**item)
            return Response(InventoryItemSerializer(InventoryItem.objects.all(), many=True).data)
        return super().create(request, *args, **kwargs)


class PS4GameViewSet(viewsets.ModelViewSet):
    queryset = PS4Game.objects.all()
    serializer_class = PS4GameSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Create default games if none exist
        if not PS4Game.objects.exists():
            self.create_default_games()
        return queryset
    
    def list(self, request, *args, **kwargs):
        # Create default games if none exist
        if not PS4Game.objects.exists():
            self.create_default_games()
        return super().list(request, *args, **kwargs)
    
    def create_default_games(self):
        default_games = [
            {
                'name': 'PES',
                'icon': '⚽',
                'player_options': [1, 2, 3, 4],
                'time_options': [
                    {'label': '10 min', 'minutes': 10, 'price': 1500, 'players': 1},
                    {'label': '15 min', 'minutes': 15, 'price': 2000, 'players': 1},
                    {'label': '20 min', 'minutes': 20, 'price': 2500, 'players': 1},
                    {'label': '10 min', 'minutes': 10, 'price': 2000, 'players': 2},
                    {'label': '15 min', 'minutes': 15, 'price': 2500, 'players': 2},
                    {'label': '20 min', 'minutes': 20, 'price': 3000, 'players': 2},
                    {'label': '10 min', 'minutes': 10, 'price': 2500, 'players': 3},
                    {'label': '15 min', 'minutes': 15, 'price': 3000, 'players': 3},
                    {'label': '20 min', 'minutes': 20, 'price': 3500, 'players': 3},
                    {'label': '10 min', 'minutes': 10, 'price': 3000, 'players': 4},
                    {'label': '15 min', 'minutes': 15, 'price': 3500, 'players': 4},
                    {'label': '20 min', 'minutes': 20, 'price': 4000, 'players': 4},
                ]
            },
            {
                'name': 'FC',
                'icon': '🎮',
                'player_options': [1, 2, 3, 4],
                'time_options': [
                    {'label': '8 min', 'minutes': 8, 'price': 1500, 'players': 1},
                    {'label': '10 min', 'minutes': 10, 'price': 2000, 'players': 1},
                    {'label': '15 min', 'minutes': 15, 'price': 2500, 'players': 1},
                    {'label': '8 min', 'minutes': 8, 'price': 2000, 'players': 2},
                    {'label': '10 min', 'minutes': 10, 'price': 2500, 'players': 2},
                    {'label': '15 min', 'minutes': 15, 'price': 3000, 'players': 2},
                    {'label': '8 min', 'minutes': 8, 'price': 2500, 'players': 3},
                    {'label': '10 min', 'minutes': 10, 'price': 3000, 'players': 3},
                    {'label': '15 min', 'minutes': 15, 'price': 3500, 'players': 3},
                    {'label': '8 min', 'minutes': 8, 'price': 3000, 'players': 4},
                    {'label': '10 min', 'minutes': 10, 'price': 3500, 'players': 4},
                    {'label': '15 min', 'minutes': 15, 'price': 4000, 'players': 4},
                ]
            },
            {
                'name': 'GTA',
                'icon': '🚗',
                'player_options': [1, 2, 3, 4],
                'time_options': [
                    {'label': '15 min', 'minutes': 15, 'price': 1000, 'players': 1},
                    {'label': '30 min', 'minutes': 30, 'price': 2000, 'players': 1},
                    {'label': '45 min', 'minutes': 45, 'price': 3000, 'players': 1},
                    {'label': '1h', 'minutes': 60, 'price': 4000, 'players': 1},
                    {'label': '15 min', 'minutes': 15, 'price': 1500, 'players': 2},
                    {'label': '30 min', 'minutes': 30, 'price': 2500, 'players': 2},
                    {'label': '45 min', 'minutes': 45, 'price': 3500, 'players': 2},
                    {'label': '1h', 'minutes': 60, 'price': 4500, 'players': 2},
                    {'label': '15 min', 'minutes': 15, 'price': 2000, 'players': 3},
                    {'label': '30 min', 'minutes': 30, 'price': 3000, 'players': 3},
                    {'label': '45 min', 'minutes': 45, 'price': 4000, 'players': 3},
                    {'label': '1h', 'minutes': 60, 'price': 5000, 'players': 3},
                    {'label': '15 min', 'minutes': 15, 'price': 2500, 'players': 4},
                    {'label': '30 min', 'minutes': 30, 'price': 3500, 'players': 4},
                    {'label': '45 min', 'minutes': 45, 'price': 4500, 'players': 4},
                    {'label': '1h', 'minutes': 60, 'price': 5500, 'players': 4},
                ]
            },
        ]
        
        for game_data in default_games:
            time_options = game_data.pop('time_options')
            game = PS4Game.objects.create(**game_data)
            for opt in time_options:
                PS4TimeOption.objects.create(game=game, **opt)
    
    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        time_options_data = data.pop('time_options', [])
        
        game = PS4Game.objects.create(**data)
        
        for opt in time_options_data:
            PS4TimeOption.objects.create(game=game, **opt)
        
        return Response(PS4GameSerializer(game).data)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data.copy()
        time_options_data = data.pop('time_options', None)
        
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        if time_options_data is not None:
            instance.time_options.all().delete()
            for opt in time_options_data:
                PS4TimeOption.objects.create(game=instance, **opt)
        
        return Response(PS4GameSerializer(instance).data)


class AppSettingsViewSet(viewsets.ModelViewSet):
    queryset = AppSettings.objects.all()
    serializer_class = AppSettingsSerializer
    
    def get_queryset(self):
        if not AppSettings.objects.exists():
            AppSettings.objects.create()
        return super().get_queryset()
    
    def list(self, request, *args, **kwargs):
        if not AppSettings.objects.exists():
            settings = AppSettings.objects.create()
        else:
            settings = AppSettings.objects.first()
        return Response(AppSettingsSerializer(settings).data)


class AnalyticsView(APIView):
    def get(self, request):
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        
        if not start or not end:
            return Response({'error': 'start and end parameters required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        billard_sessions = BilliardSession.objects.filter(date__gte=start, date__lte=end)
        ps4_sessions = PS4Session.objects.filter(date__gte=start, date__lte=end)
        
        total_billard = sum(s.price for s in billard_sessions)
        total_ps4 = sum(s.price for s in ps4_sessions)
        
        data = {
            'total_billard': total_billard,
            'total_ps4': total_ps4,
            'total_sessions': billard_sessions.count() + ps4_sessions.count()
        }
        
        return Response(data)


class BarOrderViewSet(viewsets.ModelViewSet):
    queryset = BarOrder.objects.all()
    serializer_class = BarOrderSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(date=date)
        return queryset
