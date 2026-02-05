from django.contrib import admin
from .models import User, BilliardSession, PS4Session, InventoryItem, PS4Game, PS4TimeOption, AppSettings


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'role', 'created_at']
    search_fields = ['username', 'email']
    list_filter = ['role']


@admin.register(BilliardSession)
class BilliardSessionAdmin(admin.ModelAdmin):
    list_display = ['table_id', 'client_name', 'date', 'duration_minutes', 'price', 'is_paid']
    list_filter = ['date', 'table_id', 'is_paid']
    search_fields = ['client_name']


@admin.register(PS4Session)
class PS4SessionAdmin(admin.ModelAdmin):
    list_display = ['game_name', 'players', 'date', 'duration_minutes', 'price']
    list_filter = ['date', 'players']
    search_fields = ['game_name']


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'icon']
    search_fields = ['name']


@admin.register(PS4Game)
class PS4GameAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon']
    filter_horizontal = []


@admin.register(PS4TimeOption)
class PS4TimeOptionAdmin(admin.ModelAdmin):
    list_display = ['game', 'label', 'minutes', 'price', 'players']
    list_filter = ['game', 'players']


@admin.register(AppSettings)
class AppSettingsAdmin(admin.ModelAdmin):
    list_display = ['club_name', 'theme_color', 'rate_base']
