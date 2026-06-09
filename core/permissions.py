from rest_framework.permissions import BasePermission, SAFE_METHODS
from users.models import User


class IsAdminOrCreator(BasePermission):
    """
    Permite:
    - Lectura pública
    - Crear contenido solo a ADMIN o CREADOR
    """

    def has_permission(self, request, view):

        if request.method in SAFE_METHODS:
            return True

        if not request.user.is_authenticated:
            return False

        return request.user.rol in [
            User.Roles.ADMIN,
            User.Roles.CREADOR
        ]


class IsOwnerOrAdmin(BasePermission):
    """
    Solo el dueño del contenido o un ADMIN
    puede modificar o eliminar.
    """

    def has_object_permission(self, request, view, obj):

        if request.method in SAFE_METHODS:
            return True

        if request.user.rol == User.Roles.ADMIN:
            return True

        return obj.creador == request.user


class IsAuthenticatedClient(BasePermission):
    """
    Solo usuarios autenticados pueden
    gestionar visualizaciones.
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated