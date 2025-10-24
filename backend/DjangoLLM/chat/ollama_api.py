import ollama
import base64

def generate_response(prompt, image_path=None):
    """
    Generate response from Ollama using gemma3n:e2b model
    Supports text and image inputs (multimodal)
    Yields chunks of the response as they arrive
    """
    messages = [{'role': 'user', 'content': prompt}]
    
    # If an image is provided, encode it and add to the message
    if image_path:
        try:
            with open(image_path, 'rb') as image_file:
                image_data = base64.b64encode(image_file.read()).decode('utf-8')
                messages[0]['images'] = [image_data]
        except Exception as e:
            print(f"Error loading image: {e}")
    
    stream = ollama.chat(
        model='gemma3n:e2b',
        messages=messages,
        stream=True,
    )
    for chunk in stream:
        yield chunk['message']['content']
