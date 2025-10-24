from django.contrib import admin
from .models import User, Chat, Message

# Register your models here.

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'created_at')
    search_fields = ('username',)

@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'created_at', 'updated_at')
    list_filter = ('created_at', 'user')
    search_fields = ('title', 'user__username')

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('user', 'chat', 'content', 'created_at')
    list_filter = ('created_at', 'user', 'chat')
    search_fields = ('content', 'response')
