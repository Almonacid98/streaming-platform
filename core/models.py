from django.db import models
from django.conf import settings
from django.db.models import Q


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

    descripcion = models.TextField(
        blank=True,
        default=''
    )

    # Trailer / preview de Cloudinary
    video_url = models.URLField(
        max_length=1000,
        blank=True,
        null=True
    )

    video_public_id = models.CharField(
        max_length=500,
        blank=True,
        null=True
    )

    # HLS local
    video_hls_url = models.URLField(
        max_length=1000,
        blank=True,
        null=True
    )

    # Ruta del archivo en Backblaze B2
    video_b2_key = models.CharField(
        max_length=500,
        blank=True,
        null=True
    )

    portada_url = models.URLField(
        max_length=1000,
        blank=True,
        null=True
    )

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


# ==========================================
# EPISODIOS
# ==========================================

class Episodio(models.Model):

    serie = models.ForeignKey(
        Contenido,
        on_delete=models.CASCADE,
        related_name='episodios'
    )

    temporada = models.PositiveIntegerField(
        default=1
    )

    numero = models.PositiveIntegerField()

    titulo = models.CharField(
        max_length=200
    )

    descripcion = models.TextField(
        blank=True,
        default=''
    )

    duracion_min = models.PositiveIntegerField()

    video_b2_key = models.CharField(
        max_length=500,
        blank=True,
        null=True
    )

    video_hls_url = models.URLField(
        max_length=1000,
        blank=True,
        null=True
    )

    class Meta:

        ordering = [
            'temporada',
            'numero'
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    'serie',
                    'temporada',
                    'numero'
                ],
                name='episodio_unico_por_serie_temporada_numero'
            )
        ]

    def __str__(self):
        return (
            f"{self.serie.titulo} - "
            f"T{self.temporada} "
            f"E{self.numero} - "
            f"{self.titulo}"
        )


# ==========================================
# VISUALIZACIONES
# ==========================================

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

    # NULL para películas.
    # Para series identifica el capítulo reproducido.
    episodio = models.ForeignKey(
        Episodio,
        on_delete=models.CASCADE,
        related_name='visualizaciones',
        null=True,
        blank=True
    )

    progreso_segundos = models.PositiveIntegerField(
        default=0
    )

    fecha_visualizacion = models.DateTimeField(
        auto_now=True
    )

    class Meta:

        constraints = [

            # Una visualización por usuario y contenido
            # cuando no se especifica un episodio.
            models.UniqueConstraint(
                fields=[
                    'usuario',
                    'contenido'
                ],
                condition=Q(episodio__isnull=True),
                name='visualizacion_unica_usuario_contenido'
            ),

            # Una visualización independiente por
            # usuario y episodio.
            models.UniqueConstraint(
                fields=[
                    'usuario',
                    'episodio'
                ],
                condition=Q(episodio__isnull=False),
                name='visualizacion_unica_usuario_episodio'
            )

        ]

    def __str__(self):

        if self.episodio:
            return (
                f"{self.usuario} - "
                f"{self.episodio} - "
                f"{self.progreso_segundos}s"
            )

        return (
            f"{self.usuario} - "
            f"{self.contenido} - "
            f"{self.progreso_segundos}s"
        )