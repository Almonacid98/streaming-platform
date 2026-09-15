from rest_framework import serializers

from .models import User


# ==========================================
# SERIALIZER GENERAL DE USUARIO
# ==========================================

class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = '__all__'


# ==========================================
# REGISTRO DE USUARIO
# ==========================================

class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True
    )

    class Meta:
        model = User

        fields = (
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'password',
            'edad',
            'genero',
        )


    def create(self, validated_data):

        password = validated_data.pop(
            'password'
        )

        user = User(
            **validated_data
        )

        # Guardar la contraseña cifrada
        user.set_password(password)

        # Los usuarios registrados desde
        # la aplicación comienzan como USUARIO
        user.rol = User.Roles.USUARIO

        user.save()

        return user


# ==========================================
# PERFIL DEL USUARIO AUTENTICADO
# ==========================================

class ProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = User

        fields = (
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'edad',
            'genero',
            'rol',
            'fecha_creacion',
        )

        read_only_fields = fields


# ==========================================
# LOGOUT
# ==========================================

class LogoutSerializer(serializers.Serializer):

    refresh = serializers.CharField()