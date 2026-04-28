from django.contrib import admin
from .models import Usuario, Contenido, Visualizacion


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre", "email", "edad", "genero", "rol", "fecha_registro")
    search_fields = ("nombre", "email")
    list_filter = ("rol", "genero", "fecha_registro")


@admin.register(Contenido)
class ContenidoAdmin(admin.ModelAdmin):
    list_display = ("id", "titulo", "tipo", "genero", "anio", "duracion_min", "creador")
    search_fields = ("titulo", "genero", "tipo")
    list_filter = ("tipo", "genero", "anio")


@admin.register(Visualizacion)
class VisualizacionAdmin(admin.ModelAdmin):
    list_display = ("id", "usuario", "contenido", "fecha_visualizacion")
    search_fields = ("usuario__nombre", "contenido__titulo")
    list_filter = ("fecha_visualizacion",)