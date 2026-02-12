from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
import json
from .models import User, BilliardSession, PS4Session, InventoryItem, PS4Game, PS4TimeOption, AppSettings, BarOrder, Client
from .serializers import (
    UserSerializer, UserLoginSerializer, BilliardSessionSerializer, 
    PS4SessionSerializer, InventoryItemSerializer, PS4GameSerializer,
    PS4TimeOptionSerializer, AppSettingsSerializer, AnalyticsSerializer,
    BarOrderSerializer, ClientSerializer
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
    
    @action(detail=False, methods=['post'])
    def start(self, request):
        """
        Start a new session for a table.
        Required fields: table_id
        Optional fields: client_name
        """
        try:
            table_id = request.data.get('table_id')
            if not table_id:
                return Response(
                    {'error': 'table_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if table already has active session
            active = BilliardSession.objects.filter(
                table_id=table_id,
                stop_time__isnull=True
            ).first()
            
            if active:
                return Response(
                    {'error': f'Table {table_id} already has an active session'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create new session with ISO datetime
            now = timezone.now()
            session = BilliardSession.objects.create(
                table_id=table_id,
                start_time=now,
                stop_time=None,
                duration_minutes=0,
                price=0,
                client_name=request.data.get('client_name', 'Anonyme'),
                is_paid=False,
                date=now.date(),
                timestamp=int(now.timestamp() * 1000)
            )
            
            return Response(
                BilliardSessionSerializer(session).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def stop(self, request):
        """
        Stop an active session and calculate price.
        Required fields: table_id
        """
        try:
            table_id = request.data.get('table_id')
            if not table_id:
                return Response(
                    {'error': 'table_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Find active session
            session = BilliardSession.objects.filter(
                table_id=table_id,
                stop_time__isnull=True
            ).order_by('-start_time').first()
            
            if not session:
                return Response(
                    {'error': f'No active session found for table {table_id}'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Validate start_time exists
            if not session.start_time:
                return Response(
                    {'error': 'Session has no start_time'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Calculate duration and price
            now = timezone.now()
            duration = now - session.start_time
            duration_minutes = int(duration.total_seconds() / 60)
            
            # Get settings for pricing
            try:
                settings = AppSettings.objects.first()
                rate_base = float(settings.rate_base) if settings else 150
                rate_reduced = float(settings.rate_reduced) if settings else 135
                threshold_mins = settings.threshold_mins if settings else 15
                floor_min = float(settings.floor_min) if settings else 1000
                floor_mid = float(settings.floor_mid) if settings else 1500
            except:
                rate_base = 150
                rate_reduced = 135
                threshold_mins = 15
                floor_min = 1000
                floor_mid = 1500
            
            # Calculate price (in millimes)
            if duration_minutes <= threshold_mins:
                time_price = duration_minutes * rate_base
            else:
                time_price = (threshold_mins * rate_base) + ((duration_minutes - threshold_mins) * rate_reduced)
            
            # Apply floor rules
            if time_price < floor_min:
                final_price = floor_min
            elif floor_min <= time_price < floor_mid:
                final_price = floor_mid
            else:
                final_price = time_price
            
            # Update session
            session.stop_time = now
            session.duration_minutes = duration_minutes
            session.price = final_price
            session.save()
            
            return Response(
                BilliardSessionSerializer(session).data
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active sessions (no stop_time)"""
        active_sessions = BilliardSession.objects.filter(stop_time__isnull=True)
        return Response(
            BilliardSessionSerializer(active_sessions, many=True).data
        )
    
    @action(detail=True, methods=['delete'])
    def delete_session(self, request, pk=None):
        """Delete a specific session"""
        session = self.get_object()
        session.delete()
        return Response({'success': True}, status=status.HTTP_204_NO_CONTENT)


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


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search clients by name"""
        query = request.query_params.get('q', '')
        clients = Client.objects.filter(name__icontains=query)[:10]
        return Response(ClientSerializer(clients, many=True).data)
    
    @action(detail=True, methods=['post'])
    def add_loyalty_points(self, request, pk=None):
        """Add loyalty points to a client"""
        client = self.get_object()
        points = request.data.get('points', 0)
        client.loyalty_points += int(points)
        # Auto upgrade to VIP at 1000 points
        if client.loyalty_points >= 1000:
            client.is_vip = True
        client.save()
        return Response(ClientSerializer(client).data)
    
    @action(detail=True, methods=['post'])
    def record_session(self, request, pk=None):
        """Record a session for a client and update stats"""
        client = self.get_object()
        price = request.data.get('price', 0)
        
        client.total_spent += float(price)
        client.total_sessions += 1
        
        # Add loyalty points (1 point per 1 DT spent)
        client.loyalty_points += int(float(price))
        
        # Auto upgrade to VIP at 1000 points
        if client.loyalty_points >= 1000:
            client.is_vip = True
        
        client.save()
        return Response(ClientSerializer(client).data)
