# Generated manually

from django.utils import timezone
from django.db import migrations


def populate_null_dates(apps, schema_editor):
    BilliardSession = apps.get_model('api', 'BilliardSession')
    today = timezone.now().date()
    BilliardSession.objects.filter(date__isnull=True).update(date=today)


def reverse_populate(apps, schema_editor):
    pass  # Can't reverse easily


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_add_client_model'),
    ]

    operations = [
        migrations.RunPython(populate_null_dates, reverse_populate),
    ]
