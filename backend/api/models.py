from django.db import models


class Item(models.Model):
    """Sample model just to prove the DB connection works end-to-end."""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
