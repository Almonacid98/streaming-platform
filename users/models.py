from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    ROL_CHOICES = (
        ('usuario', 'Usuario'),
        ('creador', 'Creador'),
    )

    edad = models.IntegerField(null=True, blank=True)

    genero = models.CharField(
        max_length=50,
        null=True,
        blank=True
    )

    rol = models.CharField(
        max_length=10,
        choices=ROL_CHOICES,
        default='usuario'
    )

    def __str__(self):
        return self.username