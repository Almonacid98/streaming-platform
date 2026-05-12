from django.contrib import admin
from .models import Contenido, Visualizacion
from users.models import User

@admin.register(Contenido)
class ContenidoAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "titulo",
        "tipo",
        "genero",
        "anio",
        "duracion_min",
        "creador"
    )

    search_fields = ("titulo", "genero", "tipo")

    list_filter = ("tipo", "genero", "anio")

    # SOLO usuarios con rol creador
    def formfield_for_foreignkey(self, db_field, request, **kwargs):

        if db_field.name == "creador":
            kwargs["queryset"] = User.objects.filter(rol="creador")

        return super().formfield_for_foreignkey(
            db_field,
            request,
            **kwargs
        )

    # Validación extra de seguridad
    def save_model(self, request, obj, form, change):

        if obj.creador.rol != "creador":
            raise ValueError(
                "Solo usuarios con rol creador pueden subir contenidos."
            )

        super().save_model(request, obj, form, change)


@admin.register(Visualizacion)
class VisualizacionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "usuario",
        "contenido",
        "fecha_visualizacion"
    )

    search_fields = (
        "usuario__username",
        "contenido__titulo"
    )

    list_filter = ("fecha_visualizacion",)