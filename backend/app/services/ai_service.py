import os
from google import genai
from google.genai import types

class AIProvider:
    def generate_response(self, context: dict) -> str:
        pass

class DemoAIProvider(AIProvider):
    def generate_response(self, context: dict) -> str:
        return f"Demo AI Response for {context.get('subject')} topic {context.get('topic')}. Your recent mistake was considered."

class ProductionAIProvider(AIProvider):
    def __init__(self):
        self.client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))

    def generate_response(self, context: dict) -> str:
        prompt = f"You are Rehber, an AI tutor. You are helping {context.get('student', 'a student')} (Grade {context.get('grade', 'unknown')}).\n"
        
        if context.get('subject') and context.get('topic'):
            prompt += f"Subject: {context.get('subject')}, Topic: {context.get('topic')}\n"
            
        if context.get('recent_mistake'):
            prompt += f"The student recently struggled with: {context.get('recent_mistake')}\n"
            
        prompt += f"\nStudent's question: {context.get('question')}\n"
        prompt += "Please provide a helpful, concise, and age-appropriate answer. If this is over SMS, keep it very short (under 160 characters if possible)."

        response = self.client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text

def get_ai_provider() -> AIProvider:
    if os.getenv("GEMINI_API_KEY"):
        return ProductionAIProvider()
    return DemoAIProvider()
