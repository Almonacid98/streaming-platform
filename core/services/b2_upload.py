
import logging
import posixpath
import uuid

from pathlib import PurePosixPath

from django.conf import settings

from .hls import obtener_cliente_b2


# ==========================================
# CONFIGURACIÓN
# ==========================================

logger = logging.getLogger(__name__)

EXTENSIONES_PERMITIDAS = {
    ".m3u8",
    ".ts",
    ".vtt",
}

TIPOS_MIME = {
    ".m3u8": "application/vnd.apple.mpegurl",
    ".ts": "video/mp2t",
    ".vtt": "text/vtt",
}

MAX_ARCHIVOS = 2000
MAX_TAMANO_TOTAL = 5 * 1024 * 1024 * 1024

# Limitar la concurrencia de transferencias.
# Útil para diagnosticar problemas con Backblaze B2.
from boto3.s3.transfer import TransferConfig

CONFIG_TRANSFERENCIA = TransferConfig(
    multipart_threshold=8 * 1024 * 1024,
    multipart_chunksize=8 * 1024 * 1024,
    max_concurrency=2,
    use_threads=False,
)


# ==========================================
# EXCEPCIÓN PERSONALIZADA
# ==========================================

class ErrorSubidaHLS(Exception):
    pass


# ==========================================
# VALIDAR RUTAS
# ==========================================

def validar_ruta(ruta):

    if not ruta or "\\" in ruta:
        raise ErrorSubidaHLS(
            "Ruta de archivo inválida."
        )

    if ruta.startswith("/"):
        raise ErrorSubidaHLS(
            "No se permiten rutas absolutas."
        )

    partes = ruta.split("/")

    if any(
        parte in ("", ".", "..")
        for parte in partes
    ):
        raise ErrorSubidaHLS(
            f"Ruta no permitida: {ruta}"
        )

    extension = PurePosixPath(ruta).suffix.lower()

    if extension not in EXTENSIONES_PERMITIDAS:
        raise ErrorSubidaHLS(
            f"Extensión no permitida: {ruta}"
        )

    return ruta


# ==========================================
# VALIDAR ARCHIVOS
# ==========================================

def validar_archivos(archivos, rutas):

    if not archivos:
        raise ErrorSubidaHLS(
            "No se seleccionaron archivos."
        )

    if len(archivos) != len(rutas):
        raise ErrorSubidaHLS(
            "La cantidad de archivos y rutas no coincide."
        )

    if len(archivos) > MAX_ARCHIVOS:
        raise ErrorSubidaHLS(
            "Se superó el máximo de archivos."
        )

    tamano_total = sum(
        archivo.size
        for archivo in archivos
    )

    if tamano_total > MAX_TAMANO_TOTAL:
        raise ErrorSubidaHLS(
            "La carpeta supera el tamaño máximo."
        )

    validados = []
    rutas_vistas = set()
    carpeta_raiz = None

    for archivo, ruta_original in zip(
        archivos,
        rutas
    ):

        ruta = validar_ruta(ruta_original)
        partes = ruta.split("/")

        if len(partes) < 2:
            raise ErrorSubidaHLS(
                "Los archivos deben estar "
                "dentro de una carpeta."
            )

        if carpeta_raiz is None:
            carpeta_raiz = partes[0]

        if partes[0] != carpeta_raiz:
            raise ErrorSubidaHLS(
                "Todos los archivos deben pertenecer "
                "a la misma carpeta."
            )

        ruta_relativa = "/".join(partes[1:])

        if ruta_relativa in rutas_vistas:
            raise ErrorSubidaHLS(
                f"Archivo duplicado: {ruta_relativa}"
            )

        if partes[-1] != archivo.name:
            raise ErrorSubidaHLS(
                f"Nombre inconsistente: {ruta}"
            )

        rutas_vistas.add(ruta_relativa)

        validados.append(
            (archivo, ruta_relativa)
        )

    if "index.m3u8" not in rutas_vistas:
        raise ErrorSubidaHLS(
            "No se encontró index.m3u8."
        )

    if not any(
        ruta.endswith(".ts")
        for ruta in rutas_vistas
    ):
        raise ErrorSubidaHLS(
            "No se encontraron segmentos .ts."
        )

    logger.info(
        "Validación HLS correcta: %s archivos, %.2f MB",
        len(validados),
        tamano_total / (1024 * 1024),
    )

    return validados


# ==========================================
# VALIDAR MANIFIESTOS
# ==========================================

def validar_manifiestos(validados):

    rutas_disponibles = {
        ruta
        for _, ruta in validados
    }

    for archivo, ruta in validados:

        if not ruta.endswith(".m3u8"):
            continue

        archivo.seek(0)

        try:
            contenido = archivo.read().decode(
                "utf-8-sig"
            )

        except UnicodeDecodeError as error:
            raise ErrorSubidaHLS(
                f"Manifiesto no válido UTF-8: {ruta}"
            ) from error

        finally:
            archivo.seek(0)

        if not contenido.lstrip().startswith(
            "#EXTM3U"
        ):
            raise ErrorSubidaHLS(
                f"Manifiesto inválido: {ruta}"
            )

        for linea in contenido.splitlines():

            linea = linea.strip()

            if not linea:
                continue

            if linea.startswith("#"):

                etiquetas_no_admitidas = (
                    "#EXT-X-KEY:",
                    "#EXT-X-MAP:",
                    "#EXT-X-MEDIA:",
                    "#EXT-X-I-FRAME-STREAM-INF:",
                )

                if linea.startswith(
                    etiquetas_no_admitidas
                ):
                    raise ErrorSubidaHLS(
                        f"Etiqueta no admitida en {ruta}: "
                        f"{linea.split(':')[0]}"
                    )

                continue

            if (
                "://" in linea
                or linea.startswith("//")
                or "?" in linea
                or "#" in linea
                or "\\" in linea
            ):
                raise ErrorSubidaHLS(
                    f"Referencia no permitida: {linea}"
                )

            partes = linea.split("/")

            if any(
                parte in ("", ".", "..")
                for parte in partes
            ):
                raise ErrorSubidaHLS(
                    f"Ruta no permitida: {linea}"
                )

            referencia = posixpath.join(
                posixpath.dirname(ruta),
                linea,
            )

            if referencia not in rutas_disponibles:
                raise ErrorSubidaHLS(
                    f"Falta {referencia}, "
                    f"referenciado por {ruta}."
                )

    logger.info(
        "Manifiestos HLS validados correctamente."
    )


# ==========================================
# LIMPIAR SUBIDA INCOMPLETA
# ==========================================

def limpiar_subida(s3, bucket, prefijo):

    logger.warning(
        "Iniciando limpieza del prefijo: %s",
        prefijo,
    )

    paginador = s3.get_paginator(
        "list_objects_v2"
    )

    for pagina in paginador.paginate(
        Bucket=bucket,
        Prefix=f"{prefijo}/",
    ):

        objetos = pagina.get("Contents", [])

        for objeto in objetos:

            s3.delete_object(
                Bucket=bucket,
                Key=objeto["Key"],
            )

    logger.info(
        "Limpieza finalizada para: %s",
        prefijo,
    )


# ==========================================
# SUBIR HLS A BACKBLAZE B2
# ==========================================

def subir_hls_a_b2(episodio, archivos, rutas):

    if (
        episodio.video_b2_key
        or episodio.video_hls_url
    ):
        raise ErrorSubidaHLS(
            "Este episodio ya tiene un video asociado."
        )

    # Validar antes de conectar con Backblaze
    validados = validar_archivos(
        archivos,
        rutas,
    )

    validar_manifiestos(validados)

    identificador = uuid.uuid4().hex

    prefijo = (
        f"series/{episodio.serie_id}/"
        f"temporada_{episodio.temporada}/"
        f"episodio_{episodio.pk}/"
        f"{identificador}"
    )

    s3 = obtener_cliente_b2()
    bucket = settings.B2_BUCKET_NAME

    # Subir index.m3u8 al final
    validados.sort(
        key=lambda elemento: (
            elemento[1] == "index.m3u8",
            elemento[1],
        )
    )

    total = len(validados)
    archivo_actual = None

    logger.info(
        "Iniciando subida HLS. "
        "Episodio ID: %s | Archivos: %s | Prefijo: %s",
        episodio.pk,
        total,
        prefijo,
    )

    try:

        for numero, (archivo, ruta) in enumerate(
            validados,
            start=1
        ):

            archivo_actual = ruta

            key = f"{prefijo}/{ruta}"

            extension = PurePosixPath(
                ruta
            ).suffix.lower()

            archivo.seek(0)

            logger.info(
                "[%s/%s] Subiendo: %s (%.2f MB)",
                numero,
                total,
                ruta,
                archivo.size / (1024 * 1024),
            )

            s3.upload_fileobj(
                archivo,
                bucket,
                key,
                ExtraArgs={
                    "ContentType": TIPOS_MIME[extension],
                },
                Config=CONFIG_TRANSFERENCIA,
            )

        logger.info(
            "Subida HLS completada correctamente. "
            "Episodio ID: %s",
            episodio.pk,
        )

    except Exception as error:

        logger.exception(
            "ERROR AL SUBIR HLS. "
            "Episodio ID: %s | Archivo: %s | Prefijo: %s",
            episodio.pk,
            archivo_actual,
            prefijo,
        )

        try:
            limpiar_subida(
                s3,
                bucket,
                prefijo,
            )

        except Exception:
            logger.exception(
                "No se pudo limpiar completamente "
                "la subida fallida. Prefijo: %s",
                prefijo,
            )

        raise ErrorSubidaHLS(
            "No se pudo completar la subida a Backblaze B2. "
            "Revisá la terminal de Django para identificar "
            "el archivo y el error original."
        ) from error

    return f"{prefijo}/index.m3u8"
