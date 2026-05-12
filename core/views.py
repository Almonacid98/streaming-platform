from rest_framework import viewsets, filters
from django.db.models import Count
from .models import Contenido, Visualizacion
from .serializers import ContenidoSerializer, VisualizacionSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

class ContenidoViewSet(viewsets.ModelViewSet):
    queryset = Contenido.objects.all()
    serializer_class = ContenidoSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [filters.SearchFilter]
    search_fields = ['titulo', 'genero', 'tipo']

    def perform_create(self, serializer):

        if self.request.user.rol != 'creador':
            raise PermissionDenied(
                "Solo los creadores pueden subir contenidos."
            )

        serializer.save(creador=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()

        genero = self.request.query_params.get('genero')
        if genero:
            queryset = queryset.filter(genero=genero)

        if self.request.query_params.get('top') == 'true':
            queryset = queryset.annotate(
                total_vistas=Count('visualizacion')
            ).order_by('-total_vistas')

        return queryset


class VisualizacionViewSet(viewsets.ModelViewSet):
    queryset = Visualizacion.objects.all()
    serializer_class = VisualizacionSerializer