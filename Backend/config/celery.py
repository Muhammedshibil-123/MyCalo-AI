import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("mycalo_backend")


app.config_from_object("django.conf:settings", namespace="CELERY")


app.autodiscover_tasks()


app.conf.beat_schedule = {
    "check-unlogged-breakfast-11am": {
        "task": "apps.notifications.tasks.check_missing_meals",
        "schedule": crontab(hour=11, minute=0),
        "args": ("BREAKFAST",),
    },
    "check-unlogged-lunch-3pm": {
        "task": "apps.notifications.tasks.check_missing_meals",
        "schedule": crontab(hour=15, minute=0),
        "args": ("LUNCH",),
    },
    "check-unlogged-dinner-10pm": {
        "task": "apps.notifications.tasks.check_missing_meals",
        "schedule": crontab(hour=22, minute=0),
        "args": ("DINNER",),
    },
}
