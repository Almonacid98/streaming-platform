from django.shortcuts import render
from rest_framework import viewsets, filters
from .models import Usuario, Contenido, Visualizacion
from .serializers import UsuarioSerializer, ContenidoSerializer, VisualizacionSerializer


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre', 'email']


class ContenidoViewSet(viewsets.ModelViewSet):
    queryset = Contenido.objects.all()
    serializer_class = ContenidoSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['titulo', 'genero', 'tipo']


class VisualizacionViewSet(viewsets.ModelViewSet):
    queryset = Visualizacion.objects.all()
    serializer_class = VisualizacionSerializer
