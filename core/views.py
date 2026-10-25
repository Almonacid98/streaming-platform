from django.conf import settings
from django.db.models import Count

import boto3
import cloudinary.uploader

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Contenido, Episodio, Visualizacion

from .serializers import (
    ContenidoSerializer,
    VisualizacionSerializer
)

from .permissions import (
    IsAdminOrCreator,
    IsOwnerOrAdmin,
    IsAuthenticatedClient
)


# ==========================================
# CONTENIDOS
# ==========================================

class ContenidoViewSet(viewsets.ModelViewSet):

    queryset = Contenido.objects.all()
    serializer_class = ContenidoSerializer

    filter_backends = [
        filters.SearchFilter
    ]

    search_fields = [
        'titulo',
        'genero',
        'tipo'
    ]


    # ======================================
    # PERMISOS
    # ======================================

    def get_permissions(self):

        # Listar y consultar contenido
        if self.action in [
            'list',
            'retrieve'
        ]:
            return [AllowAny()]

        # Reproducir contenido
        if self.action == 'play':
            return [IsAuthenticatedClient()]

        # Crear contenido
        if self.action == 'create':
            return [IsAdminOrCreator()]

        # Subir video
        if self.action == 'subir_video':
            return [IsOwnerOrAdmin()]

        # Editar o eliminar
        if self.action in [
            'update',
            'partial_update',
            'destroy'
        ]:
            return [IsOwnerOrAdmin()]

        return [IsAdminOrCreator()]


    # ======================================
    # GUARDAR CREADOR
    # ======================================

    def perform_create(self, serializer):

        serializer.save(
            creador=self.request.user
        )


    # ======================================
    # FILTROS
    # ======================================

    def get_queryset(self):

        queryset = (
            Contenido.objects
            .select_related('creador')
            .all()
        )

        # ----------------------------------
        # FILTRAR POR GÉNERO
        # ----------------------------------

        genero = self.request.query_params.get(
            'genero'
        )

        if genero:

            queryset = queryset.filter(
                genero__iexact=genero
            )

        # ----------------------------------
        # FILTRAR POR TIPO
        # ----------------------------------

        tipo = self.request.query_params.get(
            'tipo'
        )

        if tipo:

            queryset = queryset.filter(
                tipo__iexact=tipo
            )

        # ----------------------------------
        # CONTENIDOS MÁS VISTOS
        # ----------------------------------

        if (
            self.request.query_params.get('top')
            == 'true'
        ):

            queryset = queryset.annotate(
                total_vistas=Count(
                    'visualizaciones'
                )
            ).order_by(
                '-total_vistas'
            )

        return queryset


    # ======================================
    # REPRODUCIR CONTENIDO DESDE B2
    # ======================================

    @action(
        detail=True,
        methods=['get'],
        url_path='play'
    )
    def play(self, request, pk=None):

        contenido = self.get_object()

        # ----------------------------------
        # COMPROBAR VIDEO EN B2
        # ----------------------------------

        if not contenido.video_b2_key:

            return Response(
                {
                    'error':
                        'Este contenido no tiene un '
                        'video almacenado en Backblaze B2.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # ----------------------------------
        # COMPROBAR CONFIGURACIÓN
        # ----------------------------------

        required_settings = [
            settings.B2_KEY_ID,
            settings.B2_APPLICATION_KEY,
            settings.B2_BUCKET_NAME,
            settings.B2_ENDPOINT,
            settings.B2_REGION,
        ]

        if not all(required_settings):

            return Response(
                {
                    'error':
                        'La configuración de Backblaze B2 '
                        'está incompleta.'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:

            # ----------------------------------
            # CLIENTE S3 PARA BACKBLAZE B2
            # ----------------------------------

            s3 = boto3.client(
                's3',
                endpoint_url=settings.B2_ENDPOINT,
                aws_access_key_id=settings.B2_KEY_ID,
                aws_secret_access_key=(
                    settings.B2_APPLICATION_KEY
                ),
                region_name=settings.B2_REGION
            )

            # ----------------------------------
            # URL FIRMADA TEMPORAL
            # ----------------------------------

            video_url = s3.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket':
                        settings.B2_BUCKET_NAME,
                    'Key':
                        contenido.video_b2_key
                },
                ExpiresIn=3600
            )

            return Response(
                {
                    'contenido_id':
                        contenido.id,

                    'titulo':
                        contenido.titulo,

                    'video_url':
                        video_url,

                    'expires_in':
                        3600
                },
                status=status.HTTP_200_OK
            )

        except Exception as error:

            return Response(
                {
                    'error':
                        'No se pudo generar la URL '
                        'de reproducción.',

                    'detalle':
                        str(error)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    # ======================================
    # SUBIR VIDEO A CLOUDINARY
    # ======================================

    @action(
        detail=True,
        methods=['post'],
        url_path='subir-video',
        parser_classes=[
            MultiPartParser,
            FormParser
        ]
    )
    def subir_video(self, request, pk=None):

        contenido = self.get_object()

        archivo_video = request.FILES.get(
            'video'
        )

        # ----------------------------------
        # VALIDAR ARCHIVO
        # ----------------------------------

        if not archivo_video:

            return Response(
                {
                    'error':
                        'Debe enviar un archivo de video '
                        'en el campo "video".'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------
        # VALIDAR TIPO DE ARCHIVO
        # ----------------------------------

        content_type = (
            archivo_video.content_type or ''
        )

        if not content_type.startswith('video/'):

            return Response(
                {
                    'error':
                        'El archivo enviado no es un video.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            # ----------------------------------
            # ELIMINAR VIDEO ANTERIOR
            # ----------------------------------

            if contenido.video_public_id:

                cloudinary.uploader.destroy(
                    contenido.video_public_id,
                    resource_type='video'
                )

            # ----------------------------------
            # SUBIR NUEVO VIDEO
            # ----------------------------------

            resultado = (
                cloudinary.uploader.upload(
                    archivo_video,
                    resource_type='video',
                    folder='streaming-platform/videos'
                )
            )

            # ----------------------------------
            # GUARDAR DATOS EN POSTGRESQL
            # ----------------------------------

            contenido.video_url = (
                resultado['secure_url']
            )

            contenido.video_public_id = (
                resultado['public_id']
            )

            contenido.save(
                update_fields=[
                    'video_url',
                    'video_public_id'
                ]
            )

            serializer = self.get_serializer(
                contenido
            )

            return Response(
                {
                    'message':
                        'Video subido correctamente.',

                    'contenido':
                        serializer.data
                },
                status=status.HTTP_200_OK
            )

        except Exception as error:

            return Response(
                {
                    'error':
                        'No se pudo subir el video '
                        'a Cloudinary.',

                    'detalle':
                        str(error)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ==========================================
# VISUALIZACIONES / PROGRESO
# ==========================================

class VisualizacionViewSet(
    viewsets.ModelViewSet
):

    queryset = Visualizacion.objects.all()

    serializer_class = VisualizacionSerializer

    permission_classes = [
        IsAuthenticatedClient
    ]


    # ======================================
    # VISUALIZACIONES DEL USUARIO ACTUAL
    # ======================================

    def get_queryset(self):

        return (
            Visualizacion.objects
            .filter(
                usuario=self.request.user
            )
            .select_related(
                'usuario',
                'contenido',
                'contenido__creador',
                'episodio'
            )
            .order_by(
                '-fecha_visualizacion'
            )
        )


    # ======================================
    # CREAR O ACTUALIZAR PROGRESO
    # ======================================

    def create(self, request, *args, **kwargs):
        contenido_id = request.data.get('contenido')
        episodio_id = request.data.get('episodio')
        progreso_segundos = request.data.get('progreso_segundos', 0)

        if contenido_id in (None, ''):
            return Response(
                {'error': 'Debe indicar el contenido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            contenido_id = int(contenido_id)
        except (TypeError, ValueError):
            return Response(
                {'error': 'El identificador del contenido no es válido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            contenido = Contenido.objects.get(pk=contenido_id)
        except Contenido.DoesNotExist:
            return Response(
                {'error': 'El contenido no existe.'},
                status=status.HTTP_404_NOT_FOUND
            )

        episodio = None
        if episodio_id not in (None, ''):
            try:
                episodio_id = int(episodio_id)
            except (TypeError, ValueError):
                return Response(
                    {'error': 'El identificador del episodio no es válido.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                episodio = Episodio.objects.get(pk=episodio_id)
            except Episodio.DoesNotExist:
                return Response(
                    {'error': 'El episodio no existe.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            if episodio.serie_id != contenido.id:
                return Response(
                    {'error': 'El episodio no pertenece al contenido indicado.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        try:
            progreso_segundos = int(progreso_segundos)
        except (TypeError, ValueError):
            return Response(
                {'error': 'El progreso debe ser un número entero.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if progreso_segundos < 0:
            return Response(
                {'error': 'El progreso no puede ser negativo.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Para películas, episodio=None. Para series, cada episodio
        # tiene un registro propio sin sobrescribir otros capítulos.
        lookup = {
            'usuario': request.user,
        }
        if episodio is None:
            lookup.update(contenido=contenido, episodio=None)
        else:
            lookup.update(episodio=episodio)

        visualizacion, creada = Visualizacion.objects.update_or_create(
            **lookup,
            defaults={
                'contenido': contenido,
                'progreso_segundos': progreso_segundos,
            }
        )

        serializer = self.get_serializer(visualizacion)
        return Response(
            serializer.data,
            status=(
                status.HTTP_201_CREATED if creada
                else status.HTTP_200_OK
            )
        )