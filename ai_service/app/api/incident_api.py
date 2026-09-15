from fastapi import APIRouter
from pydantic import BaseModel
from app.services.incident_agent import incident_agent

router = APIRouter()

from typing import Optional

class ReportData(BaseModel):
    report_text: str
    eventId: Optional[int] = None
    incidentTime: Optional[str] = None
    incidentType: Optional[str] = None

class TelemetryData(BaseModel):
    hallId: str
    currentCapacity: int
    entryRateIncrease: int

@router.post("/classify")
def classify_incident(data: ReportData):
    result = incident_agent.analyze_incident(data.report_text, data.incidentType, data.incidentTime, data.eventId)
    return result

@router.post("/predict")
def predict_alert(data: TelemetryData):
    result = incident_agent.generate_predictive_alerts(data.dict())
    return result
