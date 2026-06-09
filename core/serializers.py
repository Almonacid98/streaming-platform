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
            'rol'
        ]


class ContenidoSerializer(serializers.ModelSerializer):

    creador = UserBasicSerializer(read_only=True)

    class Meta:
        model = Contenido
        fields = [
            'id',
            'titulo',
            'tipo',
            'genero',
            'anio',
            'duracion_min',
            'creador',
        ]
        read_only_fields = [
            'id',
            'creador',
        ]


class VisualizacionSerializer(serializers.ModelSerializer):

    usuario = UserBasicSerializer(read_only=True)

    class Meta:
        model = Visualizacion
        fields = [
            'id',
            'usuario',
            'contenido',
            'fecha_visualizacion',
        ]
        read_only_fields = [
            'id',
            'usuario',
            'fecha_visualizacion',
        ]