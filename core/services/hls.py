
from pathlib import PurePosixPath
from urllib.parse import urlsplit
import re

import boto3
from django.conf import settings
from django.core import signing
from django.urls import reverse


DURACION_HLS = 14400
DURACION_TOKEN_HLS = 14400
SAL_HLS = "streaming-platform-hls"


def obtener_cliente_b2():
    return boto3.client(
        "s3",
        endpoint_url=settings.B2_ENDPOINT,
        aws_access_key_id=settings.B2_KEY_ID,
        aws_secret_access_key=settings.B2_APPLICATION_KEY,
        region_name=settings.B2_REGION,
    )


def generar_url_firmada(s3, key, duracion=DURACION_HLS):
    return s3.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": settings.B2_BUCKET_NAME,
            "Key": key,
        },
        ExpiresIn=duracion,
    )


def resolver_key_hls(carpeta, referencia):
    """
    Resuelve una referencia relativa de HLS
    sin permitir rutas externas ni traversal.
    """
    referencia = referencia.strip()
    url = urlsplit(referencia)

    if (
        not referencia
        or url.scheme
        or url.netloc
        or url.query
        or url.fragment
        or referencia.startswith("/")
        or "\\" in referencia
    ):
        raise ValueError("Referencia HLS no permitida")

    partes = PurePosixPath(referencia).parts

    if ".." in partes:
        raise ValueError("Referencia HLS no permitida")

    return str(PurePosixPath(carpeta) / referencia)


def generar_token_manifiesto(key, raiz):
    return signing.dumps(
        {"key": key, "raiz": raiz},
        salt=SAL_HLS,
    )


def validar_token_manifiesto(token):
    datos = signing.loads(
        token,
        salt=SAL_HLS,
        max_age=DURACION_TOKEN_HLS,
    )

    key = datos["key"]
    raiz = datos["raiz"]

    if (
        not isinstance(key, str)
        or not isinstance(raiz, str)
        or not key.endswith(".m3u8")
        or not raiz.endswith("/")
        or not key.startswith(raiz)
        or ".." in PurePosixPath(key).parts
    ):
        raise ValueError("Token HLS no válido")

    return key, raiz


def generar_manifiesto_hls(video_b2_key, request=None,
                           raiz=None):
    """
    Procesa manifiestos HLS tradicionales y multiaudio.

    - Firma segmentos TS y archivos VTT.
    - Reescribe playlists hijas a un endpoint
      temporal firmado de Django.
    """
    s3 = obtener_cliente_b2()

    if raiz is None:
        raiz = str(PurePosixPath(video_b2_key).parent) + "/"

    if (
        not video_b2_key.startswith(raiz)
        or ".." in PurePosixPath(video_b2_key).parts
    ):
        raise ValueError("Manifiesto fuera de la carpeta permitida")

    respuesta = s3.get_object(
        Bucket=settings.B2_BUCKET_NAME,
        Key=video_b2_key,
    )

    manifiesto = respuesta["Body"].read().decode("utf-8")
    carpeta = str(PurePosixPath(video_b2_key).parent)

    def transformar_referencia(referencia):
        key = resolver_key_hls(carpeta, referencia)

        if not key.startswith(raiz):
            raise ValueError("Referencia fuera de la carpeta HLS")

        if key.lower().endswith(".m3u8"):
            if request is None:
                raise ValueError(
                    "Se requiere request para playlists secundarias"
                )

            token = generar_token_manifiesto(key, raiz)

            ruta = reverse(
                "hls-manifiesto",
                kwargs={"token": token},
            )

            return request.build_absolute_uri(ruta)

        return generar_url_firmada(s3, key)

    lineas = []

    for linea in manifiesto.splitlines():
        referencia = linea.strip()

        if not referencia:
            lineas.append(linea)
            continue

        if referencia.startswith("#"):
            def reemplazar_uri(coincidencia):
                ruta = coincidencia.group(1)
                url = transformar_referencia(ruta)
                return f'URI="{url}"'

            linea = re.sub(
                r'URI="([^"]+)"',
                reemplazar_uri,
                linea,
            )

            lineas.append(linea)
            continue

        lineas.append(transformar_referencia(referencia))

    return "\n".join(lineas) + "\n"
