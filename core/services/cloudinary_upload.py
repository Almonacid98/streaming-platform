"""Servicio de subida de portadas, imágenes Hero y tráilers a Cloudinary.

No modifica modelos ni registros de la base de datos. Quien llama debe guardar
las URLs y, cuando corresponda, compensar una subida si falla el guardado.
"""

import logging
from pathlib import Path

import cloudinary.uploader
from django.core.exceptions import ValidationError
from PIL import Image, UnidentifiedImageError

logger = logging.getLogger(__name__)

MB = 1024 * 1024

TIPOS = {
    "portada": {
        "extensiones": {".jpg", ".jpeg", ".png", ".webp"},
        "formatos": {"JPEG", "PNG", "WEBP"},
        "max_bytes": 10 * MB,
        "resource_type": "image",
        "folder": "streaming-platform/portadas",
    },
    "hero": {
        "extensiones": {".jpg", ".jpeg", ".png", ".webp"},
        "formatos": {"JPEG", "PNG", "WEBP"},
        "max_bytes": 10 * MB,
        "resource_type": "image",
        "folder": "streaming-platform/heroes",
    },
    "trailer": {
        "extensiones": {".mp4", ".webm", ".mov"},
        "max_bytes": 100 * MB,
        "resource_type": "video",
        "folder": "streaming-platform/trailers",
    },
}


class ErrorArchivoCloudinary(ValueError):
    """Archivo faltante, inválido o demasiado grande."""


class ErrorSubidaCloudinary(RuntimeError):
    """Falló la subida al proveedor."""


def _validar_archivo(archivo, tipo):
    if tipo not in TIPOS:
        raise ValueError("Tipo de archivo no admitido.")

    if archivo is None:
        raise ErrorArchivoCloudinary("Debés seleccionar un archivo.")

    config = TIPOS[tipo]
    extension = Path(getattr(archivo, "name", "")).suffix.lower()

    if extension not in config["extensiones"]:
        raise ErrorArchivoCloudinary("La extensión del archivo no está permitida.")

    tamaño = getattr(archivo, "size", None)
    if tamaño is None or tamaño <= 0:
        raise ErrorArchivoCloudinary("El archivo está vacío o no se pudo medir.")
    if tamaño > config["max_bytes"]:
        limite_mb = config["max_bytes"] // MB
        raise ErrorArchivoCloudinary(f"El archivo supera el límite de {limite_mb} MB.")

    try:
        archivo.seek(0)
        if tipo in {"portada", "hero"}:
            with Image.open(archivo) as imagen:
                formato = imagen.format
                imagen.verify()
            if formato not in config["formatos"]:
                raise ErrorArchivoCloudinary("El archivo no es una imagen JPG, PNG o WEBP válida.")
            formato_extension = {
                ".jpg": "JPEG", ".jpeg": "JPEG", ".png": "PNG", ".webp": "WEBP"
            }
            if formato_extension[extension] != formato:
                raise ErrorArchivoCloudinary("La extensión no coincide con el formato de imagen.")
        else:
            encabezado = archivo.read(16)
            # WebM usa la firma EBML. MP4/MOV modernos utilizan un box 'ftyp'.
            if extension == ".webm":
                valido = encabezado.startswith(b"\x1a\x45\xdf\xa3")
            else:
                valido = len(encabezado) >= 8 and encabezado[4:8] == b"ftyp"
            if not valido:
                raise ErrorArchivoCloudinary("El archivo no parece ser un vídeo compatible válido.")
    except (UnidentifiedImageError, OSError, SyntaxError, ValidationError, ValueError) as exc:
        if isinstance(exc, ErrorArchivoCloudinary):
            raise
        raise ErrorArchivoCloudinary("No se pudo validar el archivo multimedia.") from exc
    finally:
        archivo.seek(0)

    return config


def subir_archivo_cloudinary(archivo, tipo):
    """Devuelve {'secure_url', 'public_id', 'resource_type'}.

    No guarda campos del modelo ni elimina contenido anterior.
    """
    config = _validar_archivo(archivo, tipo)

    try:
        # Para tráilers usamos subida por fragmentos; 100 MiB excede
        # el límite de 100 MB decimales de la subida simple.
        subir = (cloudinary.uploader.upload_large
                 if tipo == "trailer"
                 else cloudinary.uploader.upload)
        respuesta = subir(
            archivo,
            resource_type=config["resource_type"],
            folder=config["folder"],
            **({"chunk_size": 6_000_000} if tipo == "trailer" else {}),
        )
    except Exception as exc:
        logger.exception("Falló la subida a Cloudinary (%s)", tipo)
        raise ErrorSubidaCloudinary("No se pudo subir el archivo a Cloudinary.") from exc

    url = respuesta.get("secure_url")
    public_id = respuesta.get("public_id")
    if not url or not public_id:
        # Si el proveedor devolvió un ID sin URL, intentamos evitar un huérfano.
        if public_id:
            eliminar_archivo_cloudinary(public_id, config["resource_type"])
        raise ErrorSubidaCloudinary("Cloudinary no devolvió una referencia válida.")

    return {
        "secure_url": url,
        "public_id": public_id,
        "resource_type": config["resource_type"],
    }


def eliminar_archivo_cloudinary(public_id, resource_type):
    """Limpieza compensatoria de archivos NUEVOS. Nunca borrar uno antiguo aquí."""
    if not public_id or resource_type not in {"image", "video"}:
        return False
    try:
        respuesta = cloudinary.uploader.destroy(
            public_id,
            resource_type=resource_type,
            invalidate=True,
        )
        return respuesta.get("result") == "ok"
    except Exception:
        logger.exception("No se pudo limpiar el archivo nuevo en Cloudinary")
        return False