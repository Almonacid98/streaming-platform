from rest_framework.permissions import BasePermission, SAFE_METHODS

from users.models import User


# ==========================================
# ADMINISTRADOR O CREADOR
# ==========================================

class IsAdminOrCreator(BasePermission):
    """
    Permite:
    - Lectura pública.
    - Crear contenido a usuarios con rol ADMIN o CREADOR.
    - Los superusuarios de Django también se consideran administradores.
    """

    def has_permission(self, request, view):

        if request.method in SAFE_METHODS:
            return True

        if not request.user.is_authenticated:
            return False

        # Superusuario de Django
        if request.user.is_superuser:
            return True

        # Administrador o creador de nuestra aplicación
        return request.user.rol in [
            User.Roles.ADMIN,
            User.Roles.CREADOR
        ]


# ==========================================
# PROPIETARIO O ADMINISTRADOR
# ==========================================

class IsOwnerOrAdmin(BasePermission):
    """
    Permite modificar o eliminar contenido solamente a:
    - El creador del contenido.
    - Un usuario con rol ADMIN.
    - Un superusuario de Django.
    """

    message = "No tiene permisos para modificar este contenido."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        return request.user.rol in [
            User.Roles.ADMIN,
            User.Roles.CREADOR
        ]

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        if request.user.is_superuser:
            return True

        if request.user.rol == User.Roles.ADMIN:
            return True

        return (
            request.user.rol == User.Roles.CREADOR
            and obj.creador_id == request.user.id
        )


# ==========================================
# CLIENTE AUTENTICADO
# ==========================================

class IsAuthenticatedClient(BasePermission):
    """
    Solo usuarios autenticados pueden
    gestionar sus visualizaciones.
    """

    def has_permission(self, request, view):

        return request.user.is_authenticated

class IsEpisodeOwnerOrAdmin(BasePermission):

    message = "No tiene permisos para administrar este episodio."

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return (
            user.is_superuser
            or user.rol in [
                User.Roles.ADMIN,
                User.Roles.CREADOR
            ]
        )

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.is_superuser or user.rol == User.Roles.ADMIN:
            return True

        return (
            user.rol == User.Roles.CREADOR
            and obj.serie.creador_id == user.id
        )
