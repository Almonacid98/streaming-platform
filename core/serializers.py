from rest_framework import serializers
from .models import Contenido, Episodio, Visualizacion, Favorito
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

        read_only_fields = ['id']

    def validate(self, attrs):
        attrs = super().validate(attrs)

        serie = attrs.get(
            'serie',
            getattr(self.instance, 'serie', None)
        )

        if serie and serie.tipo != Contenido.Tipos.SERIE:
            raise serializers.ValidationError({
                'serie': 'Los episodios deben pertenecer a una serie.'
            })

        temporada = attrs.get(
            'temporada',
            getattr(self.instance, 'temporada', 1)
        )

        numero = attrs.get(
            'numero',
            getattr(self.instance, 'numero', None)
        )

        if temporada is not None and temporada < 1:
            raise serializers.ValidationError({
                'temporada': 'La temporada debe ser mayor a cero.'
            })

        if numero is not None and numero < 1:
            raise serializers.ValidationError({
                'numero': 'El número debe ser mayor a cero.'
            })

        if serie and numero is not None:
            existentes = Episodio.objects.filter(
                serie=serie,
                temporada=temporada,
                numero=numero
            )

            if self.instance:
                existentes = existentes.exclude(pk=self.instance.pk)

            if existentes.exists():
                raise serializers.ValidationError({
                    'numero': (
                        'Ya existe un episodio con ese número '
                        'en la temporada seleccionada.'
                    )
                })

        return attrs


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


# ==========================================
# FAVORITOS / MI LISTA
# ==========================================

class FavoritoSerializer(serializers.ModelSerializer):

    contenido_detalle = ContenidoSerializer(
        source='contenido',
        read_only=True
    )

    class Meta:
        model = Favorito

        fields = [
            'id',
            'contenido',
            'contenido_detalle',
            'fecha_agregado',
        ]

        read_only_fields = [
            'id',
            'contenido_detalle',
            'fecha_agregado',
        ]
