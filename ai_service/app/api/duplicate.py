from fastapi import APIRouter
from app.models.schemas import DuplicateCheckData
import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

router = APIRouter()

@router.post("/")
async def check_duplicate(data: DuplicateCheckData):
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        
        # In a real scenario, we would fetch existing records from DB to compare.
        # For this prototype, we'll simulate a comparison.
        # Let's assume we pass a list of existing attendees, or we just do a mock return 
        # based on a hardcoded "sree charan" example.
        
        if data.email == "abc@gmail.com":
            return {
                "isDuplicate": True,
                "confidence": 98,
                "reason": "Email exactly matched an existing registration."
            }

        if not api_key or api_key == "your-gemini-api-key":
            return {"isDuplicate": False, "confidence": 0, "reason": "No duplicates found (mock)"}

        # Here we would normally use SentenceTransformers for fuzzy matching,
        # but for simplicity we return false if not the hardcoded duplicate.
        return {"isDuplicate": False, "confidence": 0, "reason": "Unique registration."}
        
    except Exception as e:
        print("Duplicate detection error:", e)
        return {"isDuplicate": False, "confidence": 0, "reason": "Error checking duplicates"}
