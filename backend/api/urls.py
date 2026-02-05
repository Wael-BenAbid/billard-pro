from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView, BilliardSessionViewSet, PS4SessionViewSet, 
    InventoryItemViewSet, PS4GameViewSet, AppSettingsViewSet, AnalyticsView,
    BarOrderViewSet, ClientViewSet
)

router = DefaultRouter()
router.register(r'sessions', BilliardSessionViewSet, basename='session')
router.register(r'ps4-sessions', PS4SessionViewSet, basename='ps4-session')
router.register(r'inventory', InventoryItemViewSet, basename='inventory')
router.register(r'ps4-games', PS4GameViewSet, basename='ps4-game')
router.register(r'settings', AppSettingsViewSet, basename='settings')
router.register(r'bar-orders', BarOrderViewSet, basename='bar-order')
router.register(r'clients', ClientViewSet, basename='client')

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='login'),
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
    path('', include(router.urls)),
]
