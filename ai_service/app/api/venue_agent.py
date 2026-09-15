from fastapi import APIRouter
from pydantic import BaseModel
import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

router = APIRouter()

class VenueRequest(BaseModel):
    requirements: dict
    venues: list

@router.post("/suggest")
async def suggest_venues(data: VenueRequest):
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        
        if not api_key or api_key == "your-gemini-api-key":
            fallback = []
            req_cap = int(data.requirements.get("capacity", 0) or 0)
            
            def venue_score(v):
                v_cap = int(v.get("capacity", 0))
                if req_cap == 0:
                    return 50
                if v_cap == req_cap:
                    return 100
                elif v_cap > req_cap:
                    return max(50, 100 - (v_cap - req_cap) // 5)
                else:
                    return max(0, 50 - (req_cap - v_cap) // 5)
                    
            sorted_venues = sorted(data.venues, key=venue_score, reverse=True)
            for v in sorted_venues:
                fallback.append({
                    "venue": v, 
                    "priority_score": venue_score(v), 
                    "reasoning": f"Fallback mode: Heuristic priority (Capacity: {v.get('capacity')} vs Required: {req_cap})."
                })
            return fallback

        llm = ChatGoogleGenerativeAI(model="gemini-flash-latest", google_api_key=api_key)
        
        prompt = PromptTemplate.from_template("""
        You are an intelligent Venue Recommendation Agent for an Event Management System.
        Evaluate ALL the available venues based on the event requirements.
        
        Event Requirements:
        {requirements}
        
        Available Venues:
        {venues}
        
        Sort ALL suitable venues by priority based on capacity, facilities, and overall fit.
        CRITICAL: Venues with a capacity EXACTLY matching or very close to the requirement must be given the HIGHEST priority score (e.g., 90-100).
        Assign a priority score from 1 to 100 (100 being best).
        
        Respond ONLY with a JSON array in this exact format:
        [
          {{"venue_id": int, "priority_score": int, "reasoning": "Explanation"}}
        ]
        """)
        
        chain = prompt | llm
        response = chain.invoke({
            "requirements": json.dumps(data.requirements),
            "venues": json.dumps(data.venues)
        })
        
        content_val = response.content
        if isinstance(content_val, list):
            result_text = "".join([c.get("text", "") if isinstance(c, dict) else str(c) for c in content_val])
        else:
            result_text = str(content_val)
            
        result_text = result_text.replace("```json", "").replace("```", "").strip()
        result_json = json.loads(result_text)
        
        # Map IDs back to full venue objects and maintain sorting by score
        prioritized_venues = []
        for item in result_json:
            venue = next((v for v in data.venues if str(v.get("id")) == str(item.get("venue_id"))), None)
            if venue:
                prioritized_venues.append({
                    "venue": venue,
                    "priority_score": item.get("priority_score"),
                    "reasoning": item.get("reasoning")
                })
                
        # Sort descending by priority_score
        prioritized_venues.sort(key=lambda x: x.get("priority_score", 0), reverse=True)
        
        return prioritized_venues
        
    except Exception as e:
        print("Venue Agent error:", e)
        return {"error": "Venue Agent service error"}
