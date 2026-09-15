from fastapi import APIRouter
from app.models.schemas import ChatMessage
import os

try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_core.messages import HumanMessage, SystemMessage
    HAS_LANGCHAIN = True
except ImportError:
    HAS_LANGCHAIN = False

router = APIRouter()

@router.post("/")
async def chat_support(data: ChatMessage):
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        
        # Fallback to mock AI for demonstration if no valid API key is found
        if not api_key or api_key == "your-gemini-api-key" or not HAS_LANGCHAIN:
            msg_lower = data.message.lower()
            reply = "I am a virtual assistant. How can I help you with your events?"
            if "register" in msg_lower:
                reply = "To register for an event, simply click the 'Register Now' button on any upcoming event in your dashboard."
            elif "ticket" in msg_lower or "qr" in msg_lower:
                reply = "Your tickets are available in the 'My Tickets' section. Present the QR code to the admin at the venue."
            elif "certificate" in msg_lower:
                reply = "Once an admin scans your ticket and marks you as attended, you can download your certificate from the My Tickets section."
            elif "cancel" in msg_lower:
                reply = "You can manage your registrations directly from the dashboard."
            elif "hello" in msg_lower or "hi" in msg_lower:
                reply = "Hello there! I'm your AI event assistant. What can I help you find today?"
                
            return {"reply": f"[Mock AI] {reply}"}

        llm = ChatGoogleGenerativeAI(model="gemini-flash-latest", google_api_key=api_key)
        
        messages = [
            SystemMessage(content="You are a helpful AI support agent for a student event management platform. You answer questions about registrations, check-ins, and event details. Be concise and helpful.")
        ]
        
        for msg in data.history:
            pass # Skipping history parsing for brevity
            
        messages.append(HumanMessage(content=data.message))
        
        response = llm.invoke(messages)
        return {"reply": response.content}
        
    except Exception as e:
        print("Chat error:", e)
        return {"reply": "Sorry, I am having trouble processing your request right now."}
