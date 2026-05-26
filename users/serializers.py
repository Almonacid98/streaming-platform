from rest_framework import serializers
from .models import User

# SERIALIZER GENERAL
class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = '__all__'

# REGISTRO DE USUARIOS
class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True)

    class Meta:
        model = User

        fields = (
            'id',
            'username',
            'email',
            'password',
            'edad',
            'genero',
        )

    def create(self, validated_data):

        password = validated_data.pop('password')
        user = User(**validated_data)
        # Hashea contraseña
        user.set_password(password)
        # Rol por defecto
        user.rol = 'usuario'
        user.save()
        return user

# PERFIL DEL USUARIO
class ProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'edad',
            'genero',
            'rol',
            'fecha_creacion',
        )