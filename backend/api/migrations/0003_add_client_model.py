from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_convert_datetime_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='Client',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('phone', models.CharField(blank=True, max_length=20, null=True)),
                ('loyalty_points', models.IntegerField(default=0)),
                ('total_spent', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('total_sessions', models.IntegerField(default=0)),
                ('is_vip', models.BooleanField(default=False)),
                ('notes', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['-total_spent'],
            },
        ),
        migrations.AddIndex(
            model_name='client',
            index=models.Index(fields=['name'], name='api_client_name_idx'),
        ),
        migrations.AddIndex(
            model_name='client',
            index=models.Index(fields=['is_vip'], name='api_client_is_vip_idx'),
        ),
    ]
