from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):

    list_display = (
        "id",
        "username",
        "email",
        "rol",
        "edad",
        "genero",
        "is_staff",
        "is_superuser",
    )

    search_fields = (
        "username",
        "email",
    )

    list_filter = (
        "rol",
        "is_staff",
        "is_superuser",
    )

    fieldsets = UserAdmin.fieldsets + (
        (
            "Información Streaming",
            {
                "fields": (
                    "rol",
                    "edad",
                    "genero",
                    "fecha_creacion",
                )
            },
        ),
    )

    readonly_fields = (
        "fecha_creacion",
    )