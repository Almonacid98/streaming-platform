from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    UserViewSet,
    LogoutView
)

router = DefaultRouter()

router.register(
    r'users',
    UserViewSet,
    basename='users'
)

urlpatterns = [

    path(
        '',
        include(router.urls)
    ),

    path(
        'logout/',
        LogoutView.as_view(),
        name='logout'
    ),
]