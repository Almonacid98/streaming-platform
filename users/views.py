from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema

from .models import User
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    ProfileSerializer,
    LogoutSerializer
)


# ==========================================
# PERMISOS DE ADMINISTRACION
# ==========================================

class IsAdminUserRole(BasePermission):

    message = "No tiene permisos para administrar usuarios."

    def has_permission(self, request, view):

        if not request.user or not request.user.is_authenticated:
            return False

        return (
            request.user.is_superuser
            or request.user.rol == User.Roles.ADMIN
        )


# ==========================================
# VISTAS DE USUARIOS
# ==========================================

class UserViewSet(viewsets.ModelViewSet):

    queryset = User.objects.all()
    serializer_class = UserSerializer

    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email']

    # PERMISOS DINAMICOS
    def get_permissions(self):

        if self.action == 'register':
            permission_classes = [AllowAny]

        elif self.action == 'profile':
            permission_classes = [IsAuthenticated]

        else:
            permission_classes = [IsAdminUserRole]

        return [permission() for permission in permission_classes]

    # SERIALIZERS DINAMICOS
    def get_serializer_class(self):

        if self.action == 'register':
            return RegisterSerializer

        elif self.action == 'profile':
            return ProfileSerializer

        return UserSerializer

    # REGISTRO DE USUARIOS
    # POST /api/users/register/
    @action(
        detail=False,
        methods=['post'],
        permission_classes=[AllowAny]
    )
    def register(self, request):

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )

    # PERFIL DEL USUARIO AUTENTICADO
    # GET /api/users/profile/
    # PATCH /api/users/profile/
    @action(
        detail=False,
        methods=['get', 'patch'],
        permission_classes=[IsAuthenticated]
    )
    def profile(self, request):

        if request.method == 'GET':

            serializer = self.get_serializer(
                request.user
            )

            return Response(
                serializer.data
            )

        serializer = self.get_serializer(
            request.user,
            data=request.data,
            partial=True
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )


# ==========================================
# LOGOUT JWT + BLACKLIST
# POST /api/logout/
# ==========================================

@extend_schema(
    request=LogoutSerializer,
    responses={205: None}
)
class LogoutView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        try:

            refresh_token = request.data.get('refresh')

            if not refresh_token:
                return Response(
                    {
                        "error": "Debe enviar el refresh token."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            token = RefreshToken(refresh_token)

            token.blacklist()

            return Response(
                {
                    "message": "Logout exitoso."
                },
                status=status.HTTP_205_RESET_CONTENT
            )

        except Exception:
            return Response(
                {
                    "error": "Token inválido o ya revocado."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
