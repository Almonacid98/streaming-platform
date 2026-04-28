from rest_framework import serializers
from .models import Usuario, Contenido, Visualizacion


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'


class ContenidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contenido
        fields = '__all__'


class VisualizacionSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(read_only=True)
    contenido = ContenidoSerializer(read_only=True)

    usuario_id = serializers.PrimaryKeyRelatedField(
        queryset=Usuario.objects.all(), source='usuario', write_only=True
    )
    contenido_id = serializers.PrimaryKeyRelatedField(
        queryset=Contenido.objects.all(), source='contenido', write_only=True
    )

    class Meta:
        model = Visualizacion
        fields = '__all__'