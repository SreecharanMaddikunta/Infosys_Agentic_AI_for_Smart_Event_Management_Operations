from fastapi import APIRouter
from app.models.schemas import RegistrationData
import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

router = APIRouter()

@router.post("/")
async def validate_data(data: RegistrationData):
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        
        # Fallback to simple regex/validation if no API key is provided
        if not api_key or api_key == "your-gemini-api-key":
            is_valid = "@" in data.email and len(data.phone) >= 10
            return {"valid": is_valid, "reason": "Basic validation passed" if is_valid else "Invalid email or phone"}

        llm = ChatGoogleGenerativeAI(model="gemini-flash-latest", google_api_key=api_key)
        
        prompt = PromptTemplate.from_template("""
        You are an AI validation agent for an event registration system.
        Analyze the following user data and determine if it is valid and realistic.
        
        Name: {name}
        Phone: {phone}
        Email: {email}
        College/Company: {college}
        
        Rules:
        - Name should look like a real human name (not just numbers or random letters).
        - Phone should be a valid format (usually 10+ digits, e.g. 0000000000 is acceptable as a fallback).
        - Email should be a valid format (e.g. user@domain.com).
        - The 'College/Company' field will contain either a university name OR a company name (e.g., Accenture, Google). BOTH ARE PERFECTLY VALID. Do not reject companies.
        
        Respond ONLY with a JSON object in this format:
        {{"valid": true/false, "reason": "Short explanation"}}
        """)
        
        chain = prompt | llm
        response = chain.invoke({
            "name": data.name,
            "phone": data.phone,
            "email": data.email,
            "college": data.college
        })
        
        # Clean up markdown JSON formatting if present
        content_val = response.content
        if isinstance(content_val, list):
            result_text = "".join([c.get("text", "") if isinstance(c, dict) else str(c) for c in content_val])
        else:
            result_text = str(content_val)
            
        result_text = result_text.replace("```json", "").replace("```", "").strip()
        result_json = json.loads(result_text)
        
        return result_json
        
    except Exception as e:
        print("Validation error:", e)
        return {"valid": False, "reason": "Validation service error"}
