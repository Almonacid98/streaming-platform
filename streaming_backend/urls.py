"""
URL configuration for streaming_backend project.
"""

from django.contrib import admin
from django.urls import path, include

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [

    # ==========================================
    # ADMIN
    # ==========================================
    path(
        'admin/',
        admin.site.urls
    ),

    # ==========================================
    # API CORE
    # ==========================================
    path(
        'api/',
        include('core.urls')
    ),

    # ==========================================
    # API USERS
    # ==========================================
    path(
        'api/',
        include('users.urls')
    ),

    # ==========================================
    # JWT AUTH
    # ==========================================

    # LOGIN
    path(
        'api/token/',
        TokenObtainPairView.as_view(),
        name='token_obtain_pair'
    ),

    # REFRESH TOKEN
    path(
        'api/token/refresh/',
        TokenRefreshView.as_view(),
        name='token_refresh'
    ),

    # ==========================================
    # SWAGGER / OPENAPI
    # ==========================================
    path(
        'api/schema/',
        SpectacularAPIView.as_view(),
        name='schema'
    ),

    path(
        'api/docs/',
        SpectacularSwaggerView.as_view(
            url_name='schema'
        ),
        name='swagger-ui'
    ),
]