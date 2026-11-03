"""
Django settings for streaming_backend project.

Configuración para desarrollo local y despliegue en Render (TP10).
"""

import os
from pathlib import Path
from datetime import timedelta

import cloudinary
import dj_database_url
from dotenv import load_dotenv


# ==========================================
# BASE DIR
# ==========================================
# Directorio raíz del proyecto.

BASE_DIR = Path(__file__).resolve().parent.parent


# ==========================================
# VARIABLES DE ENTORNO
# ==========================================
# Carga el archivo .env local sin incluirlo en Git.

load_dotenv(BASE_DIR / ".env")


# ==========================================
# SECURITY
# ==========================================
# Clave secreta, modo debug, dominios y protección HTTPS.

SECRET_KEY = os.environ["SECRET_KEY"]

DEBUG = os.getenv("DEBUG", "False").lower() == "true"

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv(
        "ALLOWED_HOSTS",
        "127.0.0.1,localhost"
    ).split(",")
    if host.strip()
]

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CSRF_TRUSTED_ORIGINS",
        ""
    ).split(",")
    if origin.strip()
]

SECURE_PROXY_SSL_HEADER = (
    "HTTP_X_FORWARDED_PROTO",
    "https"
)

SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG


# ==========================================
# HTTPS / HSTS - PRODUCCIÓN
# ==========================================
# Redirige las solicitudes HTTP a HTTPS en producción.
# En desarrollo local permanece desactivado.

SECURE_SSL_REDIRECT = not DEBUG

# Indica al navegador que utilice HTTPS durante 1 hora.

SECURE_HSTS_SECONDS = 3600 if not DEBUG else 0

# No incluimos subdominios hasta confirmar la configuración.

SECURE_HSTS_INCLUDE_SUBDOMAINS = False

# No activamos HSTS Preload durante las pruebas.

SECURE_HSTS_PRELOAD = False


# ==========================================
# APPLICATIONS
# ==========================================
# Aplicaciones de Django, librerías externas y apps propias.

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "rest_framework",
    "corsheaders",
    "drf_spectacular",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "cloudinary",

    "users",
    "core",
]


# ==========================================
# MIDDLEWARE
# ==========================================
# WhiteNoise entrega los archivos estáticos en producción.

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ==========================================
# URLS / WSGI
# ==========================================

ROOT_URLCONF = "streaming_backend.urls"

WSGI_APPLICATION = "streaming_backend.wsgi.application"


# ==========================================
# TEMPLATES
# ==========================================

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# ==========================================
# DATABASE
# ==========================================
# PostgreSQL local por variables.
# Render utiliza DATABASE_URL.

if os.getenv("DATABASE_URL"):

    DATABASES = {
        "default": dj_database_url.config(
            env="DATABASE_URL",
            conn_max_age=600,
            conn_health_checks=True,
        )
    }

else:

    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv(
                "DB_NAME",
                "streaming_db"
            ),
            "USER": os.getenv(
                "DB_USER",
                "postgres"
            ),
            "PASSWORD": os.getenv(
                "DB_PASSWORD",
                ""
            ),
            "HOST": os.getenv(
                "DB_HOST",
                "localhost"
            ),
            "PORT": os.getenv(
                "DB_PORT",
                "5432"
            ),
        }
    }


# ==========================================
# CUSTOM USER MODEL
# ==========================================

AUTH_USER_MODEL = "users.User"


# ==========================================
# PASSWORD VALIDATION
# ==========================================

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        )
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "MinimumLengthValidator"
        )
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator"
        )
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator"
        )
    },
]


# ==========================================
# INTERNATIONALIZATION
# ==========================================

LANGUAGE_CODE = "es-ar"

TIME_ZONE = "America/Argentina/Mendoza"

USE_I18N = True
USE_TZ = True


# ==========================================
# STATIC FILES
# ==========================================
# collectstatic copia archivos a STATIC_ROOT.
# WhiteNoise los sirve en producción.

STATIC_URL = "static/"

STATIC_ROOT = BASE_DIR / "staticfiles"

STORAGES = {
    "default": {
        "BACKEND": (
            "django.core.files.storage.FileSystemStorage"
        )
    },
    "staticfiles": {
        "BACKEND": (
            "whitenoise.storage."
            "CompressedManifestStaticFilesStorage"
        )
    },
}


# ==========================================
# DEFAULT PRIMARY KEY
# ==========================================

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ==========================================
# CORS
# ==========================================
# Orígenes autorizados para llamadas desde React/Vercel.

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:5173"
    ).split(",")
    if origin.strip()
]


# ==========================================
# DJANGO REST FRAMEWORK
# ==========================================
# Swagger/OpenAPI, JWT y permisos globales.

REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": (
        "drf_spectacular.openapi.AutoSchema"
    ),
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication."
        "JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
}


# ==========================================
# SIMPLE JWT
# ==========================================
# Duración, rotación y cabecera de tokens JWT.

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}


# ==========================================
# CLOUDINARY
# ==========================================
# Credenciales para el SDK Cloudinary.
# No se utiliza como almacenamiento por defecto.

CLOUDINARY_STORAGE = {
    "CLOUD_NAME": os.getenv("CLOUDINARY_CLOUD_NAME"),
    "API_KEY": os.getenv("CLOUDINARY_API_KEY"),
    "API_SECRET": os.getenv("CLOUDINARY_API_SECRET"),
}

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)


# ==========================================
# SWAGGER / OPENAPI
# ==========================================

SPECTACULAR_SETTINGS = {
    "TITLE": "Streaming API",
    "DESCRIPTION": (
        "API de usuarios, contenidos y visualizaciones"
    ),
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SWAGGER_UI_SETTINGS": {
        "persistAuthorization": True
    },
}


# ==========================================
# LOGGING
# ==========================================
# Registrar los errores de Django en la consola.
# Permite diagnosticar errores HTTP 500 en Render.
#
# No activa DEBUG y no muestra páginas de error
# detalladas a los visitantes.

LOGGING = {
    "version": 1,

    "disable_existing_loggers": False,

    "formatters": {
        "verbose": {
            "format": (
                "[{levelname}] {asctime} "
                "{name}: {message}"
            ),
            "style": "{",
        },
    },

    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },

    "loggers": {
        "django.request": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
    },
}


# ==========================================
# BACKBLAZE B2
# ==========================================
# Credenciales para películas y segmentos HLS.

B2_KEY_ID = os.getenv("B2_KEY_ID")

B2_APPLICATION_KEY = os.getenv("B2_APPLICATION_KEY")

B2_BUCKET_NAME = os.getenv("B2_BUCKET_NAME")

B2_ENDPOINT = os.getenv("B2_ENDPOINT")

B2_REGION = os.getenv("B2_REGION")


# ==========================================
# LÍMITES DE FORMULARIOS Y ARCHIVOS
# ==========================================
# Máximo de archivos y campos recibidos por solicitud.

DATA_UPLOAD_MAX_NUMBER_FILES = 2000

DATA_UPLOAD_MAX_NUMBER_FIELDS = 3000
