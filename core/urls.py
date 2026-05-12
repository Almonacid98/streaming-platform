from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ContenidoViewSet, VisualizacionViewSet

router = DefaultRouter()

router.register(r'contenidos', ContenidoViewSet)
router.register(r'visualizaciones', VisualizacionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]