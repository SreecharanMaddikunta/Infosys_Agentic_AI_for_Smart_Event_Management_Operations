from fastapi import APIRouter
from pydantic import BaseModel
import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

router = APIRouter()

class SpeakerRequest(BaseModel):
    topic: str
    startTime: str
    endTime: str
    speakers: list

@router.post("/suggest")
async def suggest_speakers(data: SpeakerRequest):
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        
        if not api_key or api_key == "your-gemini-api-key":
            fallback = []
            topic = (data.topic or "").lower()
            
            def speaker_score(s):
                score = 50 # Base score
                if not topic:
                    return score + int(s.get("pastRating", 0) * 5)
                    
                expertise = (s.get("expertise", "") or "").lower()
                bio = (s.get("bio", "") or "").lower()
                
                if topic and topic in expertise:
                    score += 40
                elif topic and topic in bio:
                    score += 20
                    
                # Add past rating bonus
                score += int(s.get("pastRating", 0) * 2)
                return min(score, 100)
                
            sorted_speakers = sorted(data.speakers, key=speaker_score, reverse=True)
            for s in sorted_speakers:
                fallback.append({
                    "speaker": s, 
                    "priority_score": speaker_score(s), 
                    "reasoning": f"Fallback mode: Heuristic priority based on expertise match."
                })
            return fallback

        llm = ChatGoogleGenerativeAI(model="gemini-flash-latest", google_api_key=api_key)
        
        prompt = PromptTemplate.from_template("""
        You are an intelligent Speaker Allocation Agent for an Event Management System.
        Evaluate ALL available speakers based on the session topic, their expertise, past ratings, and availability.
        
        Session Topic: {topic}
        Session Time: {startTime} to {endTime}
        
        Available Speakers:
        {speakers}
        
        Sort ALL suitable speakers by priority. Consider expertise match, pastRating, and schedule fit.
        CRITICAL: Speakers whose expertise directly matches or strongly relates to the Session Topic must be given the HIGHEST priority score (e.g., 90-100).
        Assign a priority score from 1 to 100 (100 being best).
        
        Respond ONLY with a JSON array in this exact format:
        [
          {{"speaker_id": int, "priority_score": int, "reasoning": "Explanation"}}
        ]
        """)
        
        chain = prompt | llm
        response = chain.invoke({
            "topic": data.topic,
            "startTime": data.startTime,
            "endTime": data.endTime,
            "speakers": json.dumps(data.speakers)
        })
        
        content_val = response.content
        if isinstance(content_val, list):
            result_text = "".join([c.get("text", "") if isinstance(c, dict) else str(c) for c in content_val])
        else:
            result_text = str(content_val)
            
        result_text = result_text.replace("```json", "").replace("```", "").strip()
        result_json = json.loads(result_text)
        
        prioritized_speakers = []
        for item in result_json:
            speaker = next((s for s in data.speakers if str(s.get("id")) == str(item.get("speaker_id"))), None)
            if speaker:
                prioritized_speakers.append({
                    "speaker": speaker,
                    "priority_score": item.get("priority_score"),
                    "reasoning": item.get("reasoning")
                })
                
        prioritized_speakers.sort(key=lambda x: x.get("priority_score", 0), reverse=True)
        
        return prioritized_speakers
        
    except Exception as e:
        print("Speaker Agent error:", e)
        return {"error": "Speaker Agent service error"}
