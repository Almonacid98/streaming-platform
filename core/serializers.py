from rest_framework import serializers

from .models import Contenido, Visualizacion
from users.models import User


class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'rol']


class ContenidoSerializer(serializers.ModelSerializer):
    creador = UserBasicSerializer(read_only=True)

    creador_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='creador',
        write_only=True
    )

    class Meta:
        model = Contenido
        fields = '__all__'


class VisualizacionSerializer(serializers.ModelSerializer):
    usuario = UserBasicSerializer(read_only=True)
    contenido = ContenidoSerializer(read_only=True)

    usuario_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='usuario',
        write_only=True
    )

    contenido_id = serializers.PrimaryKeyRelatedField(
        queryset=Contenido.objects.all(),
        source='contenido',
        write_only=True
    )

    class Meta:
        model = Visualizacion
        fields = '__all__'