from django.conf import settings
from django.db import models


class Exercise(models.Model):
    name = models.CharField(max_length=255, db_index=True)
    met_value = models.DecimalField(
        max_digits=4, decimal_places=1, help_text="Metabolic Equivalent of Task"
    )

    is_verified = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )

    def __str__(self):
        return self.name
