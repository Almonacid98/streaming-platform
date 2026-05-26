from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):

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