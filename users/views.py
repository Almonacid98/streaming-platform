from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import User
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    ProfileSerializer
)


class UserViewSet(viewsets.ModelViewSet):

    queryset = User.objects.all()
    serializer_class = UserSerializer

    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email']

    # ==========================================
    # PERMISOS DINÁMICOS
    # ==========================================
    def get_permissions(self):

        if self.action == 'register':
            permission_classes = [AllowAny]

        elif self.action == 'profile':
            permission_classes = [IsAuthenticated]

        else:
            permission_classes = [IsAuthenticated]

        return [permission() for permission in permission_classes]

    # ==========================================
    # SERIALIZERS DINÁMICOS
    # ==========================================
    def get_serializer_class(self):

        if self.action == 'register':
            return RegisterSerializer

        elif self.action == 'profile':
            return ProfileSerializer

        return UserSerializer

    # ==========================================
    # REGISTRO DE USUARIOS
    # POST /api/users/register/
    # ==========================================
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

    # ==========================================
    # PERFIL DEL USUARIO AUTENTICADO
    # GET /api/users/profile/
    # ==========================================
    @action(
        detail=False,
        methods=['get'],
        permission_classes=[IsAuthenticated]
    )
    def profile(self, request):

        serializer = self.get_serializer(
            request.user
        )

        return Response(
            serializer.data
        )