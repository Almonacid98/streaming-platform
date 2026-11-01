
from django import forms


class SubirHLSForm(forms.Form):

    archivos = forms.FileField(
        label="Carpeta HLS",
        required=False,
        widget=forms.ClearableFileInput(
            attrs={
                "id": "id_archivos",
            }
        ),
        help_text=(
            "Seleccioná la carpeta HLS completa, "
            "incluyendo index.m3u8, segmentos .ts "
            "y subtítulos .vtt."
        ),
    )
