from rest_framework import serializers

from .models import Contenido, Visualizacion
from users.models import User


class UserBasicSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'rol',
        ]


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
            'video_url',
            'video_public_id',
            'video_hls_url',
            'portada_url',
            'hero_url',
            'creador',
        ]

        read_only_fields = [
            'id',
            'video_public_id',
            'creador',
        ]


class VisualizacionSerializer(serializers.ModelSerializer):

    usuario = UserBasicSerializer(
        read_only=True
    )

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