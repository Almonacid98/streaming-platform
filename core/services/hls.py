from pathlib import PurePosixPath

import boto3
from django.conf import settings


def obtener_cliente_b2():
    return boto3.client(
        "s3",
        endpoint_url=settings.B2_ENDPOINT,
        aws_access_key_id=settings.B2_KEY_ID,
        aws_secret_access_key=settings.B2_APPLICATION_KEY,
        region_name=settings.B2_REGION,
    )


def generar_url_firmada(s3, key, duracion=14400):
    return s3.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": settings.B2_BUCKET_NAME,
            "Key": key,
        },
        ExpiresIn=duracion,
    )


def generar_manifiesto_hls(video_b2_key):
    s3 = obtener_cliente_b2()

    respuesta = s3.get_object(
        Bucket=settings.B2_BUCKET_NAME,
        Key=video_b2_key,
    )

    manifiesto = respuesta["Body"].read().decode("utf-8")

    carpeta = str(PurePosixPath(video_b2_key).parent)

    lineas = []

    for linea in manifiesto.splitlines():
        referencia = linea.strip()

        if not referencia or referencia.startswith("#"):
            lineas.append(linea)
            continue

        # El manifiesto generado contiene rutas relativas
        # como segment_000.ts.
        if (
            referencia.startswith("/")
            or "://" in referencia
            or ".." in PurePosixPath(referencia).parts
        ):
            raise ValueError("Referencia HLS no permitida")

        key_segmento = str(
            PurePosixPath(carpeta) / referencia
        )

        url_firmada = generar_url_firmada(
            s3,
            key_segmento,
        )

        lineas.append(url_firmada)

    return "\n".join(lineas) + "\n"