from django.db.models import Count

import cloudinary.uploader

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Contenido, Visualizacion

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
                'contenido__creador'
            )
            .order_by(
                '-fecha_visualizacion'
            )
        )


    # ======================================
    # CREAR O ACTUALIZAR PROGRESO
    # ======================================

    def create(self, request, *args, **kwargs):

        contenido_id = request.data.get(
            'contenido'
        )

        progreso_segundos = request.data.get(
            'progreso_segundos',
            0
        )

        # ----------------------------------
        # CONTENIDO OBLIGATORIO
        # ----------------------------------

        if not contenido_id:

            return Response(
                {
                    'error':
                        'Debe indicar el contenido.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------
        # COMPROBAR CONTENIDO
        # ----------------------------------

        try:

            contenido = Contenido.objects.get(
                pk=contenido_id
            )

        except Contenido.DoesNotExist:

            return Response(
                {
                    'error':
                        'El contenido no existe.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # ----------------------------------
        # VALIDAR PROGRESO
        # ----------------------------------

        try:

            progreso_segundos = int(
                progreso_segundos
            )

        except (TypeError, ValueError):

            return Response(
                {
                    'error':
                        'El progreso debe ser un número entero.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if progreso_segundos < 0:

            return Response(
                {
                    'error':
                        'El progreso no puede ser negativo.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------
        # CREAR O ACTUALIZAR
        # ----------------------------------

        visualizacion, creada = (
            Visualizacion.objects.update_or_create(

                usuario=request.user,

                contenido=contenido,

                defaults={
                    'progreso_segundos':
                        progreso_segundos
                }
            )
        )

        serializer = self.get_serializer(
            visualizacion
        )

        codigo_estado = (
            status.HTTP_201_CREATED
            if creada
            else status.HTTP_200_OK
        )

        return Response(
            serializer.data,
            status=codigo_estado
        )