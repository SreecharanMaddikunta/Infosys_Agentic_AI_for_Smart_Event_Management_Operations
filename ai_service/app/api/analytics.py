from fastapi import APIRouter
import random

router = APIRouter()

@router.get("/venue-utilization")
def get_venue_utilization():
    # Simulated data for frontend charts (e.g., Recharts)
    return [
        {"name": "Hall A", "utilization": 85},
        {"name": "Hall B", "utilization": 45},
        {"name": "Main Auditorium", "utilization": 92},
        {"name": "Conference Room 1", "utilization": 30}
    ]

@router.get("/speaker-popularity")
def get_speaker_popularity():
    # Simulated data for frontend charts
    return [
        {"name": "Dr. Smith", "rating": 4.8, "sessions": 5},
        {"name": "Prof. Johnson", "rating": 4.2, "sessions": 3},
        {"name": "Alice Williams", "rating": 4.9, "sessions": 8},
        {"name": "Bob Brown", "rating": 3.8, "sessions": 2}
    ]
