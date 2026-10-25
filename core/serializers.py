from rest_framework import serializers

from .models import Contenido, Episodio, Visualizacion
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


class EpisodioSerializer(serializers.ModelSerializer):

    class Meta:
        model = Episodio

        fields = [
            'id',
            'serie',
            'temporada',
            'numero',
            'titulo',
            'descripcion',
            'duracion_min',
            'video_b2_key',
            'video_hls_url',
        ]

        read_only_fields = [
            'id',
        ]


class ContenidoSerializer(serializers.ModelSerializer):

    creador = UserBasicSerializer(
        read_only=True
    )

    episodios = EpisodioSerializer(
        many=True,
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
            'descripcion',
            'video_url',
            'video_public_id',
            'video_hls_url',
            'video_b2_key',
            'portada_url',
            'hero_url',
            'creador',
            'episodios',
        ]

        read_only_fields = [
            'id',
            'video_public_id',
            'creador',
            'episodios',
        ]


class VisualizacionSerializer(serializers.ModelSerializer):

    usuario = UserBasicSerializer(
        read_only=True
    )

    contenido_detalle = ContenidoSerializer(
        source='contenido',
        read_only=True
    )

    episodio_detalle = EpisodioSerializer(
        source='episodio',
        read_only=True
    )

    episodio = serializers.PrimaryKeyRelatedField(
        queryset=Episodio.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Visualizacion

        fields = [
            'id',
            'usuario',
            'contenido',
            'contenido_detalle',
            'episodio',
            'episodio_detalle',
            'progreso_segundos',
            'fecha_visualizacion',
        ]

        read_only_fields = [
            'id',
            'usuario',
            'contenido_detalle',
            'episodio_detalle',
            'fecha_visualizacion',
        ]

    def validate_progreso_segundos(self, value):

        if value < 0:
            raise serializers.ValidationError(
                'El progreso no puede ser negativo.'
            )

        return value

    def validate(self, attrs):

        attrs = super().validate(attrs)

        contenido = attrs.get(
            'contenido',
            getattr(self.instance, 'contenido', None)
        )

        episodio = attrs.get(
            'episodio',
            getattr(self.instance, 'episodio', None)
        )

        if episodio is not None:

            if contenido is None:
                raise serializers.ValidationError({
                    'contenido': (
                        'Debe indicar el contenido al que '
                        'pertenece el episodio.'
                    )
                })

            if episodio.serie_id != contenido.id:
                raise serializers.ValidationError({
                    'episodio': (
                        'El episodio seleccionado no '
                        'pertenece al contenido indicado.'
                    )
                })

        return attrs