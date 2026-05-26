from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrCreator(BasePermission):
    """
    Permite crear contenido solamente a:
    - ADMIN
    - CREADOR
    """
    def has_permission(self, request, view):

        # Lectura pública
        if request.method in SAFE_METHODS:
            return True

        # Usuario autenticado
        if not request.user.is_authenticated:
            return False

        return request.user.rol in ['admin', 'creador']


class IsOwnerOrAdmin(BasePermission):
    """
    Solo el dueño del contenido o ADMIN
    puede modificarlo.
    """
    def has_object_permission(self, request, view, obj):

        # Lectura pública
        if request.method in SAFE_METHODS:
            return True

        # ADMIN puede todo
        if request.user.rol == 'admin':
            return True

        # El creador del contenido puede editarlo
        return obj.creador == request.user


class IsAuthenticatedClient(BasePermission):
    """
    Solo usuarios autenticados
    pueden gestionar visualizaciones.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated