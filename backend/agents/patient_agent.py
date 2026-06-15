"""
Patient Agent — Autonomous clinical assistant for patients.

Functions:
  • smart_appointment(symptoms)   — Doctor suggestion + urgency + timing
  • report_explainer(report)      — Plain-language medical report explanation
  • medication_reminder(meds)     — Structured medication schedule
  • billing_explainer(bill)       — Itemised bill breakdown + highlights
"""

from __future__ import annotations

import json
import logging
from typing import Any

from agents.openai_client import ask_llm
from agents.tools import get_available_doctors, get_patient_reports, get_billing_data

logger = logging.getLogger("agents.patient_agent")


# -----------------------------------------------------------------------
# 1. Smart Appointment Booking
# -----------------------------------------------------------------------
def smart_appointment(symptoms: str, patient_id: int | None = None) -> dict:
    """Analyse symptoms → recommend doctor, urgency level, and time slot.

    Returns
    -------
    dict with keys: recommended_doctor, department, urgency, suggested_time,
                    reasoning, action, data
    """
    doctors = get_available_doctors()
    doctors_info = json.dumps(doctors, default=str)

    prompt = f"""You are a hospital triage AI. 

**STRICT RULE:** Use ONLY the provided available doctors list. Do NOT invent a doctor name.
If NO suitable doctor is found in the list, return: "No available doctors matching the symptoms in the database."

**Patient symptoms:** {symptoms}

**Available doctors:**
{doctors_info}

Analyse the symptoms and return **valid JSON** with:
{{
  "recommended_doctor": "<doctor name from list or 'NONE'>",
  "department": "<department from list or 'NONE'>",
  "urgency": "critical | high | medium | low",
  "suggested_time": "<time slot today/tomorrow>",
  "reasoning": "<1-2 sentence explanation or 'No data found'>",
  "found": <true/false>
}}
"""
    raw = ask_llm(prompt, response_format={"type": "json_object"})
    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        result = {"recommended_doctor": "NONE",
                  "department": "NONE",
                  "urgency": "medium",
                  "suggested_time": "N/A",
                  "reasoning": "Error parsing AI response.",
                  "found": False}

    # Attach UFO action payload for frontend
    if not result.get("found") or result.get("recommended_doctor") == "NONE":
        result["action"] = "show_message"
        result["data"] = {}
        result["message"] = "I'm sorry, I couldn't find a specific doctor in our database matching your symptoms. Please contact our reception for assistance."
    else:
        result["action"] = "book_appointment"
        result["data"] = {
            "doctor_name": result.get("recommended_doctor"),
            "department": result.get("department"),
            "time_slot": result.get("suggested_time"),
            "notes": f"AI-suggested for symptoms: {symptoms}",
        }
        if patient_id:
            result["data"]["patient_id"] = patient_id

        result["message"] = (
            f"Recommended {result.get('recommended_doctor')} "
            f"({result.get('department')}) — Urgency: {result.get('urgency')}"
        )
    return result


# -----------------------------------------------------------------------
# 2. Medicine Inventory
# -----------------------------------------------------------------------
def medicine_inventory() -> dict:
    """Return the current medicine inventory from the hospital database."""
    from agents.tools import get_medicines

    medicines = get_medicines()
    if not medicines:
        return {
            "action": "show_message",
            "data": {},
            "message": "No medicines are currently available in the medical store.",
        }

    names = [m.get("name", "Unknown") for m in medicines]
    preview_count = min(8, len(names))
    preview_names = ", ".join(names[:preview_count])
    extra_count = len(names) - preview_count
    message = f"Found {len(medicines)} medicines in the medical store."
    if preview_names:
        message += f" Example: {preview_names}"
        if extra_count > 0:
            message += f" and {extra_count} more."

    return {
        "action": "show_medicine_inventory",
        "data": {"medicines": medicines},
        "message": message,
    }


# -----------------------------------------------------------------------
# 3. Report Explainer
# -----------------------------------------------------------------------
def report_explainer(report: dict | None = None, patient_id: int | None = None) -> dict:
    """Take a medical report dict and return a patient-friendly explanation."""
    if report is None and patient_id:
        reports = get_patient_reports(patient_id)
        report = reports[0] if reports else {}

    if not report:
        return {"message": "No medical reports found in the database for this patient.", "action": "none", "data": {}}

    prompt = f"""You are a compassionate medical explainer.

**STRICT RULE:** Use ONLY the facts provided in the medical report below. Do NOT assume any diagnosis, medication or advice that is not mentioned in the text.
If any finding is unclear, say "Information not specified in report".

**Medical Report:**
{json.dumps(report, default=str)}

Provide a **patient-friendly** explanation in JSON:
{{
  "summary": "<2-3 sentence plain-language summary>",
  "key_findings": ["<finding 1>", "<finding 2>"],
  "precautions": ["<precaution 1>", "<precaution 2>"],
  "follow_up": "<recommended next step>"
}}
"""
    raw = ask_llm(prompt, response_format={"type": "json_object"})
    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        result = {"summary": "I could not generate an explanation for this report due to a technical error.", "key_findings": [], "precautions": [], "follow_up": ""}

    result["action"] = "show_report_explanation"
    result["data"] = report
    result["message"] = result.get("summary", "Report explained.")
    return result


# -----------------------------------------------------------------------
# 3. Medication Reminder
# -----------------------------------------------------------------------
def medication_reminder(meds: list[dict] | str) -> dict:
    """Generate a structured medication schedule from a list of medications.

    Will search the database for available medicines if a string query is provided.
    """
    from agents.tools import search_medicines, get_medicines
    db_medicines = []
    is_general_list = any(x in str(meds).lower() for x in ["list", "available", "store", "all", "inventory"])
    
    # If meds is a string query (e.g. "aspirin"), search database for actual stock
    if isinstance(meds, str) and len(meds.strip()) > 0:
        if is_general_list:
            db_medicines = get_medicines()
        else:
            db_medicines = search_medicines(meds)
            # Fallback for broad queries that failed search
            if not db_medicines and len(meds) < 15:
                db_medicines = get_medicines()
    
    meds_info = json.dumps(db_medicines if db_medicines else meds, default=str)

    prompt = f"""You are a pharmacist AI. 

**STRICT RULE:** ONLY include medications that are present in the provided list. 
If the list is empty, say "No matching medicines found in the hospital inventory."
Do NOT invent medicine names or stock availability.

**Available Medicine Information:** {meds_info}

Create a structured daily medication schedule in JSON. If no medicines were found, return an empty schedule and a clear warning.
{{
  "schedule": [
    {{"time": "08:00 AM", "medication": "...", "dosage": "...", "instructions": "..."}}
  ],
  "warnings": ["<drug interaction warnings or 'NONE'>"],
  "tips": ["<helpful health tip>"],
  "found_in_database": <true/false>
}}
"""
    raw = ask_llm(prompt, response_format={"type": "json_object"})
    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        result = {"schedule": [], "warnings": [], "tips": ["Technical error."], "found_in_database": False}

    if not result.get("found_in_database") or not result.get("schedule"):
        result["message"] = f"No medicines matching '{meds}' were found in the hospital database."
        result["action"] = "show_message"
    else:
        result["action"] = "show_medication_schedule"
        result["data"] = {"medications": db_medicines if db_medicines else meds}
        result["message"] = f"Medication schedule generated from database for: {meds}"
    
    return result


# -----------------------------------------------------------------------
# 4. Billing Explainer
# -----------------------------------------------------------------------
def billing_explainer(bill: dict | None = None, patient_id: int | None = None) -> dict:
    """Break down a hospital bill into plain language; flag expensive items."""
    if bill is None and patient_id:
        bills = get_billing_data(patient_id)
        bill = bills[0] if bills else {}

    if not bill:
        return {"message": "No billing records found in the database.", "action": "none", "data": {}}

    prompt = f"""You are a hospital billing advisor AI.

**STRICT RULE:** Use ONLY the provided bill details. Do NOT assume any taxes, discounts, or extra items not listed in raw JSON.
If data is missing, report it as "Not listed".

**Bill Details:**
{json.dumps(bill, default=str)}

Explain the bill in patient-friendly language as JSON:
{{
  "summary": "<total + status in plain words>",
  "item_breakdown": [
    {{"item": "...", "amount": ..., "explanation": "...", "is_expensive": true/false}}
  ],
  "savings_tips": ["<tip to reduce cost>"],
  "payment_advice": "<advice on payment>"
}}
"""
    raw = ask_llm(prompt, response_format={"type": "json_object"})
    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        result = {"summary": "Error parsing billing data.", "item_breakdown": [], "savings_tips": [], "payment_advice": ""}

# -----------------------------------------------------------------------
# 5. Cancel Appointment (Patient)
# -----------------------------------------------------------------------
def cancel_appointment_patient(appointment_data: dict | None = None, patient_id: int | None = None) -> dict:
    """Allow patients to cancel their appointments with confirmation."""
    from agents.tools import get_appointments, cancel_appointment_db

    if not patient_id:
        return {
            "action": "request_patient_id",
            "status": "failure",
            "details": "Please provide your patient ID to cancel an appointment.",
            "next_steps": "Ask user for patient ID"
        }

    appointments = get_appointments(patient_id)
    if not appointments:
        return {
            "action": "cancel_appointment",
            "status": "failure",
            "details": "No appointments found for this patient.",
            "next_steps": None
        }

    # If no specific appointment data provided, handle automatically
    if not appointment_data or not appointment_data.get("id"):
        upcoming = [a for a in appointments if a.get("status") == "scheduled"]
        
        if not upcoming:
            return {
                "action": "cancel_appointment",
                "status": "failure",
                "details": "No upcoming appointments to cancel.",
                "next_steps": None
            }
        
        # If only one upcoming appointment, cancel it automatically
        if len(upcoming) == 1:
            appointment_data = {"id": upcoming[0]["id"]}
        else:
            # Multiple appointments, show them for selection
            return {
                "action": "show_appointments_for_cancellation",
                "status": "pending",
                "details": f"Found {len(upcoming)} upcoming appointments. Please specify which one to cancel by saying 'cancel appointment [ID]' or 'cancel appointment with [doctor name]'.",
                "data": {"appointments": upcoming},
                "next_steps": "Ask user to select specific appointment to cancel"
            }

    # Attempt to cancel the specified appointment
    result = cancel_appointment_db(appointment_data, patient_id)
    if result["status"] == "success":
        return {
            "action": "cancel_appointment",
            "status": "success",
            "details": f"Appointment cancelled successfully. {result['details']}",
            "next_steps": None
        }
    else:
        return {
            "action": "cancel_appointment",
            "status": "failure",
            "details": f"Failed to cancel appointment: {result['details']}",
            "next_steps": "Try again or contact support"
        }
