import os
import json

class IncidentAgent:
    def __init__(self):
        pass

    def analyze_incident(self, report_text, incident_type=None, incident_time=None, event_id=None):
        """
        Parses natural language incident reports.
        """
        category = incident_type if incident_type else "Technical"
        severity = "Medium"
        priority = "Medium"
        team = "General Staff"
        action = "Investigate further."

        lower_report = report_text.lower()
        lower_type = category.lower() if category else ""

        # Adjust severity based on selected Type
        if "medical" in lower_type or "security" in lower_type or "fire" in lower_type:
            severity = "Critical"
            priority = "High"
            team = "Emergency / Medical Team" if "medical" in lower_type else "Security Team"
            action = f"Dispatch {team} immediately."
        elif "logistics" in lower_type:
            severity = "Low"
            priority = "Low"
            team = "Operations"
        
        # Original text-based logic overrides
        if "microphone" in lower_report or "system" in lower_report:
            category = "Technical"
            team = "AV Team" if "microphone" in lower_report else "IT Team"
            action = "Check hardware and restart system."
            
        if "registration" in lower_report and "stop" in lower_report:
            category = "Registration/Technical"
            severity = "Critical"
            priority = "High"
            team = "IT and Registration Teams"
            action = "Recommend switching to backup/manual check-in immediately."

        return {
            "category": category,
            "severity": severity,
            "priority": priority,
            "affectedArea": "Unknown (Extract via LLM)",
            "responsibleTeam": team,
            "recommendedAction": action,
            "incidentType": incident_type,
            "incidentTime": incident_time,
            "eventId": event_id
        }

    def generate_predictive_alerts(self, telemetry_data):
        """
        Analyzes streams of data points to generate proactive alerts.
        telemetry_data example: { "hallId": "Hall B", "currentCapacity": 85, "entryRateIncrease": 30 }
        """
        capacity = telemetry_data.get('currentCapacity', 0)
        entry_rate = telemetry_data.get('entryRateIncrease', 0)
        hall = telemetry_data.get('hallId', 'Unknown Hall')
        
        alert_msg = None
        
        if capacity > 80 and entry_rate > 25:
            alert_msg = f"{hall} currently has {capacity}% of its capacity, and attendee entry has increased by {entry_rate}% in the last 10 minutes. Consider deploying additional registration staff."

        return {
            "alert": alert_msg
        }

incident_agent = IncidentAgent()
