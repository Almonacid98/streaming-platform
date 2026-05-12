from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "username",
        "email",
        "edad",
        "genero",
        "rol",
    )

    search_fields = ("username", "email")
    list_filter = ("rol", "genero")