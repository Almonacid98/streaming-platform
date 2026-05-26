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

    # PERMISOS
    def get_permissions(self):

        # Registro público
        if self.action == 'register':
            permission_classes = [AllowAny]

        # Perfil requiere login
        elif self.action == 'profile':
            permission_classes = [IsAuthenticated]

        else:
            permission_classes = [IsAuthenticated]

        return [permission() for permission in permission_classes]

    # SERIALIZERS DINÁMICOS
    def get_serializer_class(self):

        if self.action == 'register':
            return RegisterSerializer

        if self.action == 'profile':
            return ProfileSerializer

        return UserSerializer

    # ENDPOINT REGISTRO
    @action(
        detail=False,
        methods=['post'],
        permission_classes=[AllowAny]
    )
    def register(self, request):

        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    # ENDPOINT PERFIL
    @action(
        detail=False,
        methods=['get'],
        permission_classes=[IsAuthenticated]
    )
    def profile(self, request):

        serializer = ProfileSerializer(request.user)

        return Response(serializer.data)