from django.db import models
from django.conf import settings


class Contenido(models.Model):

    class Tipos(models.TextChoices):
        PELICULA = 'pelicula', 'Película'
        SERIE = 'serie', 'Serie'

    titulo = models.CharField(
        max_length=200
    )

    tipo = models.CharField(
        max_length=20,
        choices=Tipos.choices
    )

    genero = models.CharField(
        max_length=100
    )

    anio = models.IntegerField()

    duracion_min = models.PositiveIntegerField()

    # URL del video almacenado en Cloudinary.
    # Se deja nullable para no romper los contenidos
    # que ya existen en la base de datos.
    video_url = models.URLField(
        max_length=1000,
        blank=True,
        null=True
    )

    # Identificador del recurso dentro de Cloudinary.
    # Nos permitirá administrar el video posteriormente.
    video_public_id = models.CharField(
        max_length=500,
        blank=True,
        null=True
    )

    # Portada del contenido.
    portada_url = models.URLField(
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

    # Segundo exacto donde quedó el usuario.
    # Ejemplo:
    # 3600 = 1 hora
    # 4654 = 1 h 17 min 34 s
    progreso_segundos = models.PositiveIntegerField(
        default=0
    )

    fecha_visualizacion = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['usuario', 'contenido'],
                name='visualizacion_unica_por_usuario_contenido'
            )
        ]

    def __str__(self):
        return (
            f"{self.usuario} - "
            f"{self.contenido} - "
            f"{self.progreso_segundos}s"
        )