from fastapi import APIRouter
from pydantic import BaseModel
from app.services.sponsorship_agent import sponsorship_agent

router = APIRouter()

class SponsorData(BaseModel):
    name: str = "Unknown"
    tier: str = "Silver"
    paymentStatus: str = "Pending"
    boothAllocated: bool = False
    brandingCompleted: bool = False
    passesAllocated: int = 0
    engagementScore: float = 0
    leadsGenerated: int = 0
    deliverablesCompleted: int = 0
    performanceStatus: str = "Good"

@router.post("/insights")
def get_insights(data: SponsorData):
    result = sponsorship_agent.analyze_sponsor_performance(data.dict())
    return result
