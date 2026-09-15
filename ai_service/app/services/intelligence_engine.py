from pydantic import BaseModel
from typing import List, Optional

class EventData(BaseModel):
    event_id: int
    context_type: str # "CAPACITY", "REGISTRATION", "QUEUE", "SCHEDULE", "GENERAL"
    data: dict

def generate_insights(event_data: EventData):
    """
    Analyzes the event data and returns actionable insights and recommendations.
    This acts as the core Event Intelligence Engine.
    """
    # Simulate LLM insight generation based on the milestone's example
    if event_data.context_type == "CAPACITY" and event_data.data.get("capacity_percentage", 0) >= 90:
        return {
            "insight": {
                "type": "CAPACITY",
                "description": "Hall capacity has reached 90% and registrations are increasing rapidly.",
                "severity": "WARNING"
            },
            "recommendation": {
                "message": "High crowd density is expected at Hall A. Consider deploying additional check-in staff and opening an alternative entry point.",
                "sourceAgent": "VenueAgent"
            }
        }
    
    # Default response for other events
    return {
        "insight": {
            "type": "GENERAL",
            "description": f"Processed event data for {event_data.context_type}.",
            "severity": "INFO"
        },
        "recommendation": None
    }
