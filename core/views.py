from rest_framework import viewsets, filters
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import PermissionDenied
from django.db.models import Count

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


class ContenidoViewSet(viewsets.ModelViewSet):

    queryset = Contenido.objects.all()
    serializer_class = ContenidoSerializer

    filter_backends = [filters.SearchFilter]
    search_fields = ['titulo', 'genero', 'tipo']

    def get_permissions(self):

        # Lectura pública
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]

        # Crear contenido
        if self.action == 'create':
            return [IsAdminOrCreator()]

        # Editar o eliminar
        if self.action in [
            'update',
            'partial_update',
            'destroy'
        ]:
            return [IsOwnerOrAdmin()]

        return [IsAdminOrCreator()]

    def perform_create(self, serializer):
        serializer.save(creador=self.request.user)

    def get_queryset(self):

        queryset = super().get_queryset()

        genero = self.request.query_params.get('genero')

        if genero:
            queryset = queryset.filter(
                genero__iexact=genero
            )

        if self.request.query_params.get('top') == 'true':
            queryset = queryset.annotate(
                total_vistas=Count('visualizacion')
            ).order_by('-total_vistas')

        return queryset


class VisualizacionViewSet(viewsets.ModelViewSet):

    queryset = Visualizacion.objects.all()
    serializer_class = VisualizacionSerializer
    permission_classes = [IsAuthenticatedClient]

    def perform_create(self, serializer):
        serializer.save(
            usuario=self.request.user
        )

    def get_queryset(self):

        # Cada usuario ve únicamente sus visualizaciones
        return Visualizacion.objects.filter(
            usuario=self.request.user
        )