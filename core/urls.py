
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ContenidoViewSet,
    EpisodioViewSet,
    VisualizacionViewSet,
    FavoritoViewSet,
)

router = DefaultRouter()

router.register(
    r'contenidos',
    ContenidoViewSet,
)

router.register(
    r'episodios',
    EpisodioViewSet,
)

router.register(
    r'visualizaciones',
    VisualizacionViewSet,
)

router.register(
    r'favoritos',
    FavoritoViewSet,
    basename='favorito',
)

urlpatterns = [
    path('', include(router.urls)),
]
