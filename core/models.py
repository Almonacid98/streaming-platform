from django.db import models
from django.conf import settings


class Contenido(models.Model):
    titulo = models.CharField(max_length=200)
    tipo = models.CharField(max_length=50)
    genero = models.CharField(max_length=100)
    anio = models.IntegerField()
    duracion_min = models.IntegerField()

    creador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    def __str__(self):
        return self.titulo


class Visualizacion(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    contenido = models.ForeignKey(
        Contenido,
        on_delete=models.CASCADE
    )

    fecha_visualizacion = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.usuario} vio {self.contenido}"