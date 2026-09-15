from fastapi import FastAPI
from app.api import validation, duplicate, chat, analytics, venue_agent, speaker_agent
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Infosys AI Event Management Platform", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(validation.router, prefix="/ai/validate", tags=["Validation"])
app.include_router(duplicate.router, prefix="/ai/duplicate", tags=["Duplicate Detection"])
app.include_router(chat.router, prefix="/ai/chat", tags=["AI Chatbot"])
app.include_router(analytics.router, prefix="/ai/analytics", tags=["Analytics"])
app.include_router(venue_agent.router, prefix="/ai/venue", tags=["Venue Optimization"])
app.include_router(speaker_agent.router, prefix="/ai/speaker", tags=["Speaker Scheduling"])
from app.api import sponsor_api, incident_api, alert_api, intelligence
app.include_router(sponsor_api.router, prefix="/api/sponsor-agent", tags=["Sponsorship Agent"])
app.include_router(incident_api.router, prefix="/api/incident-agent", tags=["Incident Agent"])
app.include_router(alert_api.router, prefix="/api/alert-agent", tags=["Alert Agent"])
app.include_router(intelligence.router, prefix="/api/intelligence", tags=["Event Intelligence Engine"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Service for Event Management Platform"}
