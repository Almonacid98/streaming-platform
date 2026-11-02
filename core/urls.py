
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ContenidoViewSet,
    EpisodioViewSet,
    VisualizacionViewSet,
    FavoritoViewSet,
    manifiesto_hls_secundario,
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
    path(
        'hls/manifiesto/<str:token>/',
        manifiesto_hls_secundario,
        name='hls-manifiesto',
    ),
    path('', include(router.urls)),
]
