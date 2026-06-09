from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    class Roles(models.TextChoices):
        ADMIN = "admin", "Admin"
        USUARIO = "usuario", "Usuario"
        CREADOR = "creador", "Creador"

    class Generos(models.TextChoices):
        MASCULINO = 'masculino', 'Masculino'
        FEMENINO = 'femenino', 'Femenino'
        OTRO = 'otro', 'Otro'
        PREFIERO_NO_DECIR = 'no_decir', 'Prefiero no decir'

    edad = models.IntegerField(
        null=True,
        blank=True
    )

    genero = models.CharField(
        max_length=20,
        choices=Generos.choices,
        blank=True,
        null=True
    )

    rol = models.CharField(
        max_length=20,
        choices=Roles.choices,
        default=Roles.USUARIO
    )

    fecha_creacion = models.DateTimeField(
        auto_now_add=True
    )

    def es_admin(self):
        return self.rol == self.Roles.ADMIN

    def es_creador(self):
        return self.rol == self.Roles.CREADOR

    def es_usuario(self):
        return self.rol == self.Roles.USUARIO

    def __str__(self):
        return f"{self.username} ({self.rol})"