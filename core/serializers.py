from rest_framework import serializers

from .models import Contenido, Visualizacion
from users.models import User


# ==========================================
# USUARIO BÁSICO
# ==========================================

class UserBasicSerializer(serializers.ModelSerializer):

    class Meta:
        model = User

        fields = [
            'id',
            'username',
            'email',
            'rol',
        ]


# ==========================================
# CONTENIDO
# ==========================================

class ContenidoSerializer(serializers.ModelSerializer):

    creador = UserBasicSerializer(
        read_only=True
    )

    class Meta:
        model = Contenido

        fields = [
            'id',
            'titulo',
            'tipo',
            'genero',
            'anio',
            'duracion_min',

            # Cloudinary
            'video_url',
            'video_public_id',

            # Imagen de portada
            'portada_url',

            'creador',
        ]

        read_only_fields = [
            'id',
            'video_public_id',
            'creador',
        ]


# ==========================================
# VISUALIZACIÓN
# ==========================================

class VisualizacionSerializer(serializers.ModelSerializer):

    usuario = UserBasicSerializer(
        read_only=True
    )

    # Información del contenido para que
    # React pueda mostrar "Continuar viendo".
    contenido_detalle = ContenidoSerializer(
        source='contenido',
        read_only=True
    )

    class Meta:
        model = Visualizacion

        fields = [
            'id',
            'usuario',
            'contenido',
            'contenido_detalle',
            'progreso_segundos',
            'fecha_visualizacion',
        ]

        read_only_fields = [
            'id',
            'usuario',
            'contenido_detalle',
            'fecha_visualizacion',
        ]

    def validate_progreso_segundos(self, value):

        if value < 0:
            raise serializers.ValidationError(
                'El progreso no puede ser negativo.'
            )

        return value