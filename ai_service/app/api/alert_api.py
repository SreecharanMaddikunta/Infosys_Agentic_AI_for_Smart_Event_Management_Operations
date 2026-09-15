from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class TelemetryData(BaseModel):
    venueCapacity: int
    currentAttendance: int
    registrationVelocity: float
    recentIncidents: int

@router.post('/predict')
def generate_predictive_alerts(data: TelemetryData):
    alerts = []
    
    capacity_pct = (data.currentAttendance / data.venueCapacity) * 100 if data.venueCapacity > 0 else 0
    
    if capacity_pct > 80 and data.registrationVelocity > 20:
        alerts.append({
            'type': 'HIGH',
            'message': f'Hall B currently has {capacity_pct:.0f}% of its capacity, and attendee entry has increased significantly. Consider deploying additional registration staff.'
        })
    elif capacity_pct > 95:
        alerts.append({
            'type': 'CRITICAL',
            'message': 'Venue is nearing absolute maximum capacity. Prepare overflow areas immediately.'
        })
        
    if data.recentIncidents > 3:
        alerts.append({
            'type': 'HIGH',
            'message': 'Unusual spike in incidents detected in the last hour. Suggest increasing security patrols.'
        })
        
    return {'alerts': alerts}
