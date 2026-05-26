from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):

    class Roles(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        USUARIO = 'usuario', 'Usuario'
        CREADOR = 'creador', 'Creador'

    edad = models.IntegerField(
        null=True,
        blank=True
    )

    genero = models.CharField(
        max_length=50,
        null=True,
        blank=True
    )

    rol = models.CharField(
        max_length=20,
        choices=Roles.choices,
        default=Roles.USUARIO
    )

    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username