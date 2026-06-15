from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import sys
import os

from extensions import get_db, get_current_user_id, get_optional_user_id

# Add agents folder to path so backend can import it
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

try:
    from agents.orchestrator import handle_query
except ImportError:
    handle_query = None

agents_router = APIRouter()

# In-memory activity log
agent_activities = []

AGENT_PROFILES = {
    'medical': {'name': 'Medical Agent', 'icon': '🩺', 'domain': 'Clinical Operations'},
    'operations': {'name': 'Operations Agent', 'icon': '⚙️', 'domain': 'Hospital Logistics'},
    'finance': {'name': 'Finance Agent', 'icon': '💰', 'domain': 'Financial Management'},
    'ceo': {'name': 'CEO Agent', 'icon': '👔', 'domain': 'Strategic Decisions'},
}

SCENARIOS = {
    'high_patient_load': [
        {'agent': 'medical', 'action': 'Detected 40% surge in ER admissions', 'status': 'alert', 'recommendation': 'Activate overflow protocol'},
        {'agent': 'operations', 'action': 'Reallocating 12 beds from General Ward to ER', 'status': 'executing', 'recommendation': 'Deploy 4 additional nurses'},
        {'agent': 'finance', 'action': 'Approved emergency staffing budget ₹2.5L', 'status': 'approved', 'recommendation': 'Track overtime costs'},
        {'agent': 'ceo', 'action': 'Final approval: Emergency protocol activated', 'status': 'final_approval', 'recommendation': 'Monitor situation hourly'},
    ],
    'medicine_shortage': [
        {'agent': 'medical', 'action': 'Critical shortage: Insulin Glargine stock at 5 units', 'status': 'critical', 'recommendation': 'Switch to alternative insulin'},
        {'agent': 'operations', 'action': 'Emergency order placed with Novo Nordisk distributor', 'status': 'executing', 'recommendation': 'ETA 24 hours'},
        {'agent': 'finance', 'action': 'Emergency procurement budget ₹1.8L approved', 'status': 'approved', 'recommendation': 'Update reorder levels'},
        {'agent': 'ceo', 'action': 'Approved vendor fast-track. Review supplier contracts.', 'status': 'final_approval', 'recommendation': 'Negotiate bulk pricing'},
    ],
    'cost_optimization': [
        {'agent': 'finance', 'action': 'Identified 18% overspend in Lab department', 'status': 'alert', 'recommendation': 'Audit lab consumable usage'},
        {'agent': 'operations', 'action': 'Proposing shared reagent procurement across labs', 'status': 'executing', 'recommendation': 'Potential savings ₹4.2L/month'},
        {'agent': 'medical', 'action': 'Validated: No impact on diagnostic quality', 'status': 'approved', 'recommendation': 'Maintain current test protocols'},
        {'agent': 'ceo', 'action': 'Approved cost optimization plan. Implement next quarter.', 'status': 'final_approval', 'recommendation': 'Monthly review scheduled'},
    ],
}


class TriggerRequest(BaseModel):
    scenario: str = 'high_patient_load'


class ChatRequest(BaseModel):
    query: str
    frontend_state: Optional[dict] = None
    patient_id: Optional[int] = None


@agents_router.post('/trigger')
def trigger_agents(data: TriggerRequest, user_id: int = Depends(get_current_user_id)):
    activities = SCENARIOS.get(data.scenario, SCENARIOS['high_patient_load'])
    timestamp = datetime.utcnow().isoformat()
    for a in activities:
        entry = {**a, 'timestamp': timestamp, 'scenario': data.scenario}
        agent_activities.insert(0, entry)
    return {'message': f'Scenario "{data.scenario}" triggered', 'activities': activities}


@agents_router.get('/activity')
def get_activity(limit: int = 30, user_id: int = Depends(get_current_user_id)):
    return {'activities': agent_activities[:limit], 'profiles': AGENT_PROFILES}


@agents_router.get('/profiles')
def get_profiles(user_id: int = Depends(get_current_user_id)):
    return {'profiles': AGENT_PROFILES}


@agents_router.post('/chat')
def ufo_chat(data: ChatRequest, user_id: Optional[int] = Depends(get_optional_user_id), db: Session = Depends(get_db)):
    """Endpoint for the UFO AI Assistant."""
    if not data.query:
        raise HTTPException(status_code=400, detail='No query provided')

    if handle_query:
        # Extract patient_id from JWT if available
        patient_id = None
        user_role = "unknown"

        try:
            if user_id:
                from models.user import User
                from models.patient import Patient
                user = db.query(User).get(user_id)
                if user:
                    user_role = user.role or "unknown"
                    if user.role == 'patient':
                        patient = db.query(Patient).filter_by(user_id=user.id).first()
                        if patient:
                            patient_id = patient.id
        except Exception:
            pass

        # Fallback to request data
        if not patient_id:
            patient_id = data.patient_id or (data.frontend_state or {}).get('patient_id')

        frontend_state = data.frontend_state or {}
        if frontend_state.get('user_role'):
            user_role = frontend_state['user_role']

        context = {
            "endpoint": "/api/agents/chat",
            "frontend_state": frontend_state,
            "patient_id": patient_id,
            "user_role": user_role,
        }
        result = handle_query(data.query, context=context)
        return result
    else:
        raise HTTPException(status_code=500, detail='AI Orchestrator not loaded properly')
