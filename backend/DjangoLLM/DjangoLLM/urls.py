"""
URL configuration for DjangoLLM project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from chat.views import index
from chat.api_views import (
    api_login, api_register, api_logout, api_me,
    api_chats, api_chat_detail, api_chat_message
)

urlpatterns = [
    path('admin/', admin.site.urls),
    # Minimal web view: show README
    path('', index, name='index'),
    
    # API endpoints (for React frontend)
    path('api/auth/login/', api_login, name='api_login'),
    path('api/auth/register/', api_register, name='api_register'),
    path('api/auth/logout/', api_logout, name='api_logout'),
    path('api/auth/me/', api_me, name='api_me'),
    path('api/chats/', api_chats, name='api_chats'),
    path('api/chats/<int:chat_id>/', api_chat_detail, name='api_chat_detail'),
    path('api/chats/<int:chat_id>/message/', api_chat_message, name='api_chat_message'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
