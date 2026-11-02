
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import serializers

from drf_spectacular.utils import extend_schema


# ==========================================
# SERIALIZER - HEALTH CHECK
# ==========================================
class HealthCheckSerializer(serializers.Serializer):
    status = serializers.CharField()
    service = serializers.CharField()


# ==========================================
# HEALTH CHECK - TP10
# ==========================================
@extend_schema(
    responses={200: HealthCheckSerializer},
    description="Verifica que la API esté funcionando correctamente."
)
@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """
    Endpoint público para comprobar el estado
    del backend de Streaming Platform.
    """
    return Response({
        "status": "ok",
        "service": "api"
    })
