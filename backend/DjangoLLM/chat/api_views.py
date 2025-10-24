from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import User, Chat, Message
from .serializers import UserSerializer, ChatSerializer, ChatListSerializer, MessageSerializer
from .ollama_api import generate_response
import json


@csrf_exempt
@api_view(['POST'])
def api_login(request):
    """API endpoint for login"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    try:
        user = User.objects.get(username=username, password=password)
        request.session['user_id'] = user.id
        return Response({
            'success': True,
            'user': UserSerializer(user).data
        })
    except User.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)


@csrf_exempt
@api_view(['POST'])
def api_register(request):
    """API endpoint for registration"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    if User.objects.filter(username=username).exists():
        return Response({
            'success': False,
            'error': 'Username already exists'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = User.objects.create(username=username, password=password)
    request.session['user_id'] = user.id
    return Response({
        'success': True,
        'user': UserSerializer(user).data
    })


@csrf_exempt
@api_view(['POST'])
def api_logout(request):
    """API endpoint for logout"""
    request.session.flush()
    return Response({'success': True})


@csrf_exempt
@api_view(['GET'])
def api_me(request):
    """Get current user"""
    user_id = request.session.get('user_id')
    if not user_id:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        user = User.objects.get(id=user_id)
        return Response(UserSerializer(user).data)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


@csrf_exempt
@api_view(['GET', 'POST'])
def api_chats(request):
    """List all chats or create a new chat"""
    user_id = request.session.get('user_id')
    if not user_id:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        chats = Chat.objects.filter(user=user)
        serializer = ChatListSerializer(chats, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        title = request.data.get('title', 'New Chat')
        chat = Chat.objects.create(user=user, title=title)
        return Response(ChatSerializer(chat).data, status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(['GET', 'PUT', 'DELETE'])
def api_chat_detail(request, chat_id):
    """Get, update, or delete a specific chat"""
    user_id = request.session.get('user_id')
    if not user_id:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        chat = Chat.objects.get(id=chat_id, user_id=user_id)
    except Chat.DoesNotExist:
        return Response({'error': 'Chat not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = ChatSerializer(chat)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        title = request.data.get('title')
        if title:
            chat.title = title
            chat.save()
        return Response(ChatSerializer(chat).data)
    
    elif request.method == 'DELETE':
        chat.delete()
        return Response({'success': True}, status=status.HTTP_204_NO_CONTENT)


@csrf_exempt
@api_view(['POST'])
def api_chat_message(request, chat_id):
    """Send a message to a chat and get AI response"""
    from django.http import StreamingHttpResponse
    
    user_id = request.session.get('user_id')
    if not user_id:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        chat = Chat.objects.get(id=chat_id, user_id=user_id)
        user = User.objects.get(id=user_id)
    except (Chat.DoesNotExist, User.DoesNotExist):
        return Response({'error': 'Chat or User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    content = request.data.get('content', '')
    image_file = request.FILES.get('image')
    
    # Create message
    message = Message.objects.create(
        chat=chat,
        user=user,
        content=content,
        image=image_file
    )
    
    # Generate AI response
    prompt = f"User: {content}\nAI:"
    image_path = message.image.path if message.image else None
    response_generator = generate_response(prompt, image_path)
    
    # Stream response
    def response_stream():
        full_response = ""
        for chunk in response_generator:
            full_response += chunk
            yield chunk
        
        message.response = full_response
        message.save()
        chat.save()  # Update chat's updated_at
    
    return StreamingHttpResponse(response_stream(), content_type='text/plain')
