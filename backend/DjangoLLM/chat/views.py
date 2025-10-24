from django.shortcuts import render, redirect
from django.http import StreamingHttpResponse, JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from .models import User, Message
from .ollama_api import generate_response
import json

# Create your views here.

def index(request):
    """Minimal landing that shows project README as plain text (dev helper)."""
    try:
        import os
        root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        readme_path = os.path.join(root, "README.md")
        with open(readme_path, "r", encoding="utf-8") as f:
            content = f.read()
        return HttpResponse(content, content_type="text/plain; charset=utf-8")
    except Exception:
        return HttpResponse("DjangoLLM backend is running. See README.md at project root.")

@csrf_exempt
def login_view(request):
    """Simple login view"""
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        try:
            user = User.objects.get(username=username, password=password)
            request.session['user_id'] = user.id
            return JsonResponse({'success': True, 'redirect': '/chat/'})
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Invalid credentials'})
    
    return render(request, 'login.html')

@csrf_exempt
def register_view(request):
    """Simple registration view"""
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        if User.objects.filter(username=username).exists():
            return JsonResponse({'success': False, 'error': 'Username already exists'})
        
        user = User.objects.create(username=username, password=password)
        request.session['user_id'] = user.id
        return JsonResponse({'success': True, 'redirect': '/chat/'})
    
    return render(request, 'register.html')

def logout_view(request):
    """Logout view"""
    request.session.flush()
    return redirect('/')

@csrf_exempt
def chat_view(request):
    """Main chat interface"""
    user_id = request.session.get('user_id')
    if not user_id:
        return redirect('/login/')
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return redirect('/login/')
    
    if request.method == "POST":
        user_input = request.POST.get("user_input")
        image_file = request.FILES.get("image_input")
        
        # Save the user message
        message = Message.objects.create(user=user, content=user_input, image=image_file)
        
        # Generate AI response with optional image
        prompt = f"User: {user_input}\nAI:"
        image_path = None
        if message.image:
            image_path = message.image.path
        
        response_generator = generate_response(prompt, image_path)
        
        # Stream the response
        def response_stream():
            full_response = ""
            for chunk in response_generator:
                full_response += chunk
                yield chunk
            
            # Save the complete response to database
            message.response = full_response
            message.save()
        
        return StreamingHttpResponse(response_stream(), content_type='text/plain')
    
    # Get chat history
    messages = Message.objects.filter(user=user)[:50]
    return render(request, "chat.html", {'user': user, 'messages': messages})
