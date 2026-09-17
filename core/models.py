from django.db import models
from django.conf import settings


class Contenido(models.Model):

    class Tipos(models.TextChoices):
        PELICULA = 'pelicula', 'Película'
        SERIE = 'serie', 'Serie'

    titulo = models.CharField(max_length=200)

    tipo = models.CharField(
        max_length=20,
        choices=Tipos.choices
    )

    genero = models.CharField(max_length=100)

    anio = models.IntegerField()

    duracion_min = models.PositiveIntegerField()

    # Descripción o sinopsis del contenido
    descripcion = models.TextField(
        blank=True,
        default=''
    )

    # Trailer / preview del contenido
    video_url = models.URLField(
        max_length=1000,
        blank=True,
        null=True
    )

    # ID del video almacenado en Cloudinary
    video_public_id = models.CharField(
        max_length=500,
        blank=True,
        null=True
    )

    # URL del contenido completo en formato HLS
    video_hls_url = models.URLField(
        max_length=1000,
        blank=True,
        null=True
    )

    # Imagen vertical utilizada en las tarjetas
    portada_url = models.URLField(
        max_length=1000,
        blank=True,
        null=True
    )

    # Imagen horizontal utilizada en el Hero
    hero_url = models.URLField(
        max_length=1000,
        blank=True,
        null=True
    )

    creador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='contenidos_creados'
    )

    def __str__(self):
        return self.titulo


class Visualizacion(models.Model):

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='visualizaciones'
    )

    contenido = models.ForeignKey(
        Contenido,
        on_delete=models.CASCADE,
        related_name='visualizaciones'
    )

    progreso_segundos = models.PositiveIntegerField(
        default=0
    )

    fecha_visualizacion = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=[
                    'usuario',
                    'contenido'
                ],
                name=(
                    'visualizacion_unica_por_'
                    'usuario_contenido'
                )
            )
        ]

    def __str__(self):
        return (
            f"{self.usuario} - "
            f"{self.contenido} - "
            f"{self.progreso_segundos}s"
        )