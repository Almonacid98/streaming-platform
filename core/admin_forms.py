from django import forms
from django.core.validators import FileExtensionValidator

from .models import Contenido


class ContenidoCloudinaryForm(forms.ModelForm):
    portada_archivo = forms.ImageField(
        label="Subir portada a Cloudinary",
        required=False,
        help_text="JPG, PNG o WEBP. Máximo 10 MB.",
    )

    hero_archivo = forms.ImageField(
        label="Subir imagen del Hero a Cloudinary",
        required=False,
        help_text="JPG, PNG o WEBP. Máximo 10 MB.",
    )

    trailer_archivo = forms.FileField(
        label="Subir tráiler a Cloudinary",
        required=False,
        validators=[FileExtensionValidator(allowed_extensions=["mp4", "webm", "mov"])],
        help_text="Video MP4, WEBM o MOV. Máximo 100 MB.",
    )

    class Meta:
        model = Contenido
        fields = "__all__"

    def clean(self):
        cleaned_data = super().clean()
        for campo in ("portada_archivo", "hero_archivo"):
            archivo = cleaned_data.get(campo)
            if archivo and archivo.size > 10 * 1024 * 1024:
                self.add_error(campo, "La imagen no puede superar los 10 MB.")
        trailer = cleaned_data.get("trailer_archivo")
        if trailer and trailer.size > 100 * 1024 * 1024:
            self.add_error("trailer_archivo", "El tráiler no puede superar los 100 MB.")
        return cleaned_data