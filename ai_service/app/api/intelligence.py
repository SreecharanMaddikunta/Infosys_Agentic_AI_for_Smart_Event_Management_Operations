from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from app.services.agent_orchestrator import process_event

router = APIRouter()

class AnalyzeRequest(BaseModel):
    event_id: int
    context_type: str
    data: Dict[str, Any]

@router.post("/analyze")
async def analyze_event(request: AnalyzeRequest):
    """
    Endpoint for the backend to push real-time event data for AI analysis.
    """
    try:
        result = process_event(
            event_id=request.event_id,
            context_type=request.context_type,
            data=request.data
        )
        return {"status": "success", "analysis": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
