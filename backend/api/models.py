from django.db import models


class User(models.Model):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    role = models.CharField(max_length=50, default='admin')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.username


class Client(models.Model):
    """Client model for loyalty points and history tracking"""
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, null=True, blank=True)
    loyalty_points = models.IntegerField(default=0)
    total_spent = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_sessions = models.IntegerField(default=0)
    is_vip = models.BooleanField(default=False)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-total_spent']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['is_vip']),
        ]

    def __str__(self):
        return self.name


class BilliardSession(models.Model):
    table_id = models.CharField(max_length=1)  # 'A' or 'B'
    start_time = models.DateTimeField()
    stop_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.IntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    client_name = models.CharField(max_length=255, null=True, blank=True)
    is_paid = models.BooleanField(default=False)
    date = models.DateField(null=True, blank=True)
    timestamp = models.BigIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['date']),
            models.Index(fields=['table_id']),
        ]

    def __str__(self):
        return f"Table {self.table_id} - {self.date}"


class PS4Session(models.Model):
    game_id = models.CharField(max_length=100)
    game_name = models.CharField(max_length=255)
    players = models.IntegerField()
    duration_minutes = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.CharField(max_length=10)
    timestamp = models.BigIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['date']),
        ]

    def __str__(self):
        return f"{self.game_name} - {self.date}"


class InventoryItem(models.Model):
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    icon = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class PS4Game(models.Model):
    name = models.CharField(max_length=255)
    icon = models.CharField(max_length=10)
    player_options = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class PS4TimeOption(models.Model):
    game = models.ForeignKey(PS4Game, on_delete=models.CASCADE, related_name='time_options')
    label = models.CharField(max_length=50)
    minutes = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    players = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['game']),
        ]

    def __str__(self):
        return f"{self.game.name} - {self.label}"


class AppSettings(models.Model):
    club_name = models.CharField(max_length=255, default='B-CLUB')
    logo_url = models.URLField(null=True, blank=True)
    theme_color = models.CharField(max_length=20, default='#eab308')
    table_a_color = models.CharField(max_length=20, default='#10b981')
    table_b_color = models.CharField(max_length=20, default='#3b82f6')
    rate_base = models.DecimalField(max_digits=10, decimal_places=2, default=150)
    rate_reduced = models.DecimalField(max_digits=10, decimal_places=2, default=135)
    threshold_mins = models.IntegerField(default=15)
    floor_min = models.DecimalField(max_digits=10, decimal_places=2, default=1000)
    floor_mid = models.DecimalField(max_digits=10, decimal_places=2, default=1500)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.club_name


class BarOrder(models.Model):
    client_name = models.CharField(max_length=255)
    items = models.JSONField()  # List of {id, itemId, name, price, quantity}
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.CharField(max_length=10)
    timestamp = models.BigIntegerField()
    is_paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['date']),
        ]

    def __str__(self):
        return f"Bar Order - {self.client_name} - {self.date}"
