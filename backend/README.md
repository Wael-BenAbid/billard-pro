# Billard Backend - Django

## Prerequisites
- Python 3.10+
- PostgreSQL installed and running
- Database: `Billarde-pro`
- Port: 5433

## Database Configuration
Edit `settings.py` or use `.env` file:
```python
DATABASE_URL=postgres://postgres:12345@localhost:5433/Billarde-pro
```

Or in settings.py directly:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'Billarde-pro',
        'USER': 'postgres',
        'PASSWORD': '12345',
        'HOST': 'localhost',
        'PORT': '5433',
    }
}
```

## Setup Commands

1. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Create database:**
```bash
# In PostgreSQL
CREATE DATABASE "Billarde-pro";
```

4. **Run migrations:**
```bash
python manage.py makemigrations
python manage.py migrate
```

5. **Create superuser:**
```bash
python manage.py createsuperuser
# Username: wael
# Email: waelbenabid1@gmail.com
# Password: Abidos$123
```

6. **Start server:**
```bash
python manage.py runserver
```

## API Endpoints

### Authentication
- `POST /api/auth/login/` - Admin login

### Billiard Sessions
- `GET /api/sessions/` - List all sessions
- `POST /api/sessions/` - Create session
- `GET /api/sessions/{id}/` - Get session
- `PUT /api/sessions/{id}/` - Update session
- `DELETE /api/sessions/{id}/` - Delete session

### PS4 Sessions
- `GET /api/ps4-sessions/` - List all PS4 sessions
- `POST /api/ps4-sessions/` - Create PS4 session

### Inventory
- `GET /api/inventory/` - List inventory items
- `POST /api/inventory/` - Create item
- `PUT /api/inventory/{id}/` - Update item
- `DELETE /api/inventory/{id}/` - Delete item

### PS4 Games
- `GET /api/ps4-games/` - List games
- `POST /api/ps4-games/` - Create game
- `PUT /api/ps4-games/{id}/` - Update game
- `DELETE /api/ps4-games/{id}/` - Delete game

### Settings
- `GET /api/settings/` - Get settings
- `PUT /api/settings/` - Update settings

### Analytics
- `GET /api/analytics/?start=2024-01-01&end=2024-12-31` - Get analytics

## Admin Panel
- URL: `/admin/`
- Create users, manage all data
