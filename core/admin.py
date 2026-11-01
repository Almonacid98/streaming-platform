from django.contrib import admin, messages
from django.conf import settings
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import path, reverse
from django.utils.html import format_html

from .models import Contenido, Episodio, Visualizacion
from .services.hls import obtener_cliente_b2
from .services.b2_upload import (
    ErrorSubidaHLS,
    subir_hls_a_b2,
    limpiar_subida,
)
from users.models import User


# ==========================================
# EPISODIOS DENTRO DE UNA SERIE
# ==========================================

class EpisodioInline(admin.TabularInline):
    model = Episodio
    extra = 0

    fields = (
        "temporada",
        "numero",
        "titulo",
        "descripcion",
        "duracion_min",
        "video_b2_key",
        "video_hls_url",
    )

    ordering = ("temporada", "numero")
    show_change_link = True

    verbose_name = "Episodio"
    verbose_name_plural = "Episodios de la serie"


# ==========================================
# ADMINISTRACIÓN DE CONTENIDOS
# ==========================================

@admin.register(Contenido)
class ContenidoAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "titulo",
        "tipo",
        "genero",
        "anio",
        "duracion_min",
        "creador",
    )

    search_fields = (
        "titulo",
        "genero",
        "tipo",
    )

    list_filter = (
        "tipo",
        "genero",
        "anio",
    )

    # Mostrar episodios solamente en series
    def get_inlines(self, request, obj=None):

        if obj and obj.tipo == "serie":
            return [EpisodioInline]

        return []

    # Solo permitir usuarios con rol creador
    def formfield_for_foreignkey(
        self,
        db_field,
        request,
        **kwargs
    ):

        if db_field.name == "creador":
            kwargs["queryset"] = User.objects.filter(
                rol="creador"
            )

        return super().formfield_for_foreignkey(
            db_field,
            request,
            **kwargs
        )

    # Validación del creador
    def save_model(self, request, obj, form, change):

        if not obj.creador_id or obj.creador.rol != "creador":
            raise ValidationError(
                "Solo usuarios con rol creador "
                "pueden subir contenidos."
            )

        super().save_model(
            request,
            obj,
            form,
            change
        )


# ==========================================
# ADMINISTRACIÓN INDIVIDUAL DE EPISODIOS
# ==========================================

@admin.register(Episodio)
class EpisodioAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "serie",
        "temporada",
        "numero",
        "titulo",
        "duracion_min",
        "almacenamiento",
        "boton_subir_hls",
    )

    search_fields = (
        "titulo",
        "serie__titulo",
    )

    list_filter = (
        "temporada",
        "serie",
    )

    ordering = (
        "serie",
        "temporada",
        "numero",
    )

    fields = (
        "serie",
        "temporada",
        "numero",
        "titulo",
        "descripcion",
        "duracion_min",
        "video_b2_key",
        "video_hls_url",
    )

    # ======================================
    # IDENTIFICAR ALMACENAMIENTO
    # ======================================

    @admin.display(description="Almacenamiento")
    def almacenamiento(self, obj):

        if obj.video_b2_key:
            return "Backblaze B2"

        if obj.video_hls_url:
            return "HLS externo/local"

        return "Sin video"

    # ======================================
    # ASOCIAR EPISODIOS SOLO A SERIES
    # ======================================

    def formfield_for_foreignkey(
        self,
        db_field,
        request,
        **kwargs
    ):

        if db_field.name == "serie":
            kwargs["queryset"] = Contenido.objects.filter(
                tipo="serie"
            )

        return super().formfield_for_foreignkey(
            db_field,
            request,
            **kwargs
        )

    # ======================================
    # RUTA PERSONALIZADA DE SUBIDA HLS
    # ======================================

    def get_urls(self):

        urls = super().get_urls()

        custom_urls = [
            path(
                "<int:episodio_id>/subir-hls/",
                self.admin_site.admin_view(
                    self.subir_hls_view
                ),
                name="core_episodio_subir_hls",
            ),
        ]

        return custom_urls + urls

    # ======================================
    # BOTÓN SUBIR HLS
    # ======================================

    @admin.display(description="Subida HLS")
    def boton_subir_hls(self, obj):

        url = reverse(
            "admin:core_episodio_subir_hls",
            args=[obj.pk],
        )

        return format_html(
            '<a href="{}">Subir HLS</a>',
            url,
        )

    # ======================================
    # PROCESAR SUBIDA HLS A BACKBLAZE
    # ======================================

    def subir_hls_view(self, request, episodio_id):

        episodio = get_object_or_404(
            Episodio,
            pk=episodio_id,
        )

        # Verificar permisos administrativos
        if not self.has_change_permission(
            request,
            episodio
        ):
            raise PermissionDenied

        if request.method == "POST":

            archivos = request.FILES.getlist("archivos")
            rutas = request.POST.getlist("rutas")

            video_b2_key = None
            guardado_confirmado = False

            try:

                # ==================================
                # VALIDACIONES INICIALES
                # ==================================

                if not archivos:
                    raise ErrorSubidaHLS(
                        "No se seleccionaron archivos."
                    )

                if len(archivos) != len(rutas):
                    raise ErrorSubidaHLS(
                        "La cantidad de archivos y rutas "
                        "no coincide."
                    )

                # Consultar el estado más reciente
                episodio.refresh_from_db()

                if (
                    episodio.video_b2_key
                    or episodio.video_hls_url
                ):
                    raise ErrorSubidaHLS(
                        "Este episodio ya tiene un "
                        "video asociado."
                    )

                # ==================================
                # SUBIR ARCHIVOS A BACKBLAZE
                # ==================================

                video_b2_key = subir_hls_a_b2(
                    episodio,
                    archivos,
                    rutas,
                )

                # ==================================
                # GUARDAR EN BASE DE DATOS
                # ==================================

                with transaction.atomic():

                    episodio_actual = (
                        Episodio.objects
                        .select_for_update()
                        .get(pk=episodio.pk)
                    )

                    # Comprobar nuevamente para evitar
                    # sobrescribir otro video asociado.
                    if (
                        episodio_actual.video_b2_key
                        or episodio_actual.video_hls_url
                    ):
                        raise ErrorSubidaHLS(
                            "El episodio recibió otro video "
                            "durante la subida."
                        )

                    episodio_actual.video_b2_key = video_b2_key

                    episodio_actual.save(
                        update_fields=["video_b2_key"]
                    )

                guardado_confirmado = True

                # ==================================
                # CONFIRMAR ÉXITO
                # ==================================

                self.message_user(
                    request,
                    "Los archivos HLS se subieron "
                    "correctamente a Backblaze B2 "
                    "y el episodio fue actualizado.",
                    level=messages.SUCCESS,
                )

                return redirect(
                    reverse(
                        "admin:core_episodio_changelist"
                    )
                )

            except Exception as error:

                # ==================================
                # LIMPIAR SUBIDA FALLIDA
                # ==================================

                if video_b2_key and not guardado_confirmado:

                    prefijo = video_b2_key.rsplit("/", 1)[0]

                    try:

                        s3 = obtener_cliente_b2()

                        limpiar_subida(
                            s3,
                            settings.B2_BUCKET_NAME,
                            prefijo,
                        )

                    except Exception:

                        self.message_user(
                            request,
                            "No se pudo limpiar completamente "
                            "la subida fallida de Backblaze. "
                            "Revisá los archivos del bucket.",
                            level=messages.WARNING,
                        )

                # ==================================
                # MOSTRAR MENSAJE DE ERROR
                # ==================================

                if isinstance(error, ErrorSubidaHLS):
                    mensaje = str(error)

                else:
                    mensaje = (
                        "Ocurrió un error inesperado "
                        "durante la subida o al guardar "
                        "el episodio."
                    )

                self.message_user(
                    request,
                    mensaje,
                    level=messages.ERROR,
                )

        # ======================================
        # MOSTRAR FORMULARIO
        # ======================================

        context = {
            **self.admin_site.each_context(request),
            "title": f"Subir HLS - {episodio}",
            "episodio": episodio,
            "opts": self.model._meta,
        }

        return render(
            request,
            "admin/core/episodio/subir_hls.html",
            context,
        )


# ==========================================
# ADMINISTRACIÓN DE VISUALIZACIONES
# ==========================================

@admin.register(Visualizacion)
class VisualizacionAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "usuario",
        "contenido",
        "fecha_visualizacion",
    )

    search_fields = (
        "usuario__username",
        "contenido__titulo",
    )

    list_filter = (
        "fecha_visualizacion",
    )
