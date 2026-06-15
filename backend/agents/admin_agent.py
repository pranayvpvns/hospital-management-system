"""
Admin Agent — Executive-level analytics and decision-support functions.

Functions:
  • patient_summary(data)    — Aggregate patient analytics
  • revenue_agent(data)      — Revenue / financial analysis
  • resource_agent(data)     — Bed, equipment, medicine resource status
  • operations_agent(data)   — Day-to-day operational insights
  • full_patient_info(data)  — Complete patient dossier
  • ceo_agent(data)          — CEO-level strategic dashboard
"""

from __future__ import annotations

import json
import logging
from typing import Any

from agents.openai_client import ask_llm
from agents.tools import (
    get_all_patients,
    get_hospital_stats,
    get_finance_records,
    get_bed_status,
    get_equipment,
    get_medicines,
    get_patient_data,
    get_billing_data,
    get_appointments,
    get_patient_reports,
    get_available_doctors,
)

logger = logging.getLogger("agents.admin_agent")


# -----------------------------------------------------------------------
# Helper: run LLM analysis on data
# -----------------------------------------------------------------------
def _analyse(role_description: str, data: Any, output_spec: str) -> dict:
    """Generic pattern: feed data + instructions to LLM, parse JSON result."""
    prompt = f"""{role_description}

**STRICT GROUNDING RULES:**
1. Use ONLY the data provided in the section below.
2. If the data is empty, null, or does not contain the requested information, state "Data not available in database".
3. Do NOT invent names, statistics, or reports.
4. Do NOT assume trends unless they are explicitly visible in the data.

**Data:**
{json.dumps(data, default=str, indent=2)[:6000]}

Return **valid JSON** matching this structure:
{output_spec}
"""
    raw = ask_llm(prompt, response_format={"type": "json_object"}, max_tokens=2048)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"analysis": "The internal analysis engine could not process the data correctly.", "error": raw}


# ========================================================================
# 1. Patient Summary
# ========================================================================
def patient_summary(data: dict | None = None) -> dict:
    """Generate an executive summary of all patient data."""
    patients = data or get_all_patients()
    stats = get_hospital_stats()

    result = _analyse(
        role_description=(
            "You are a hospital analytics AI. Summarise the patient population "
            "for an administrator — demographics, top conditions, risk groups."
        ),
        data={"patients": patients, "stats": stats},
        output_spec="""{
  "total_patients": <int>,
  "demographics": {"avg_age": ..., "gender_split": {...}, "blood_group_distribution": {...}},
  "top_conditions": ["..."],
  "high_risk_count": <int>,
  "insights": ["<insight 1>", "<insight 2>"],
  "recommendations": ["<rec 1>"]
}""",
    )
    result["action"] = "show_patient_summary"
    result["data"] = {"patient_count": len(patients) if isinstance(patients, list) else 0}
    result["message"] = f"Patient summary: {result.get('total_patients', '?')} patients analysed."
    return result


# ========================================================================
# 2. Revenue Agent
# ========================================================================
def revenue_agent(data: dict | None = None) -> dict:
    """Analyse hospital revenue and expenses."""
    finance = data or get_finance_records()
    stats = get_hospital_stats()

    result = _analyse(
        role_description=(
            "You are a hospital CFO AI. Analyse revenue streams, expenses, "
            "and profitability. Identify trends and cost-saving opportunities."
        ),
        data={"finance_records": finance, "stats": stats},
        output_spec="""{
  "total_revenue": <float>,
  "total_expenses": <float>,
  "net_income": <float>,
  "profit_margin": "<percentage>",
  "top_revenue_sources": [{"source": "...", "amount": ...}],
  "top_expense_categories": [{"category": "...", "amount": ...}],
  "insights": ["..."],
  "cost_saving_opportunities": ["..."]
}""",
    )
    result["action"] = "show_revenue_report"
    result["data"] = {"net_income": result.get("net_income", 0)}
    result["message"] = f"Revenue report generated — Net income: ₹{result.get('net_income', '?')}"
    return result


# ========================================================================
# 3. Resource Agent
# ========================================================================
def resource_agent(data: dict | None = None) -> dict:
    """Assess beds, equipment, and medicine stock."""
    beds = get_bed_status()
    equipment = get_equipment()
    medicines = get_medicines()

    result = _analyse(
        role_description=(
            "You are a hospital resource-management AI. Assess capacity, "
            "identify shortages, and recommend actions."
        ),
        data={"beds": beds, "equipment": equipment, "medicines": medicines},
        output_spec="""{
  "bed_summary": {"total": ..., "available": ..., "occupancy_rate": "..."},
  "equipment_alerts": [{"item": "...", "issue": "..."}],
  "medicine_alerts": [{"medicine": "...", "stock": ..., "action_needed": "..."}],
  "critical_shortages": ["..."],
  "recommendations": ["..."]
}""",
    )
    result["action"] = "show_resource_status"
    result["data"] = {
        "bed_count": len(beds),
        "equipment_count": len(equipment),
        "medicine_count": len(medicines),
    }
    result["message"] = "Resource status report ready."
    return result


# ========================================================================
# 4. Operations Agent
# ========================================================================
def operations_agent(data: dict | None = None) -> dict:
    """Day-to-day operational intelligence."""
    stats = data or get_hospital_stats()
    doctors = get_available_doctors()
    beds = get_bed_status()

    result = _analyse(
        role_description=(
            "You are a hospital COO AI. Provide operational insights — "
            "staffing efficiency, appointment throughput, bed turnover, "
            "and workflow bottlenecks."
        ),
        data={"stats": stats, "doctors": doctors, "beds": beds},
        output_spec="""{
  "operational_score": "<A/B/C/D/F>",
  "staffing": {"total_doctors": ..., "shift_coverage": "..."},
  "bed_turnover": "...",
  "bottlenecks": ["..."],
  "efficiency_recommendations": ["..."],
  "action_items": [{"priority": "high|medium|low", "task": "..."}]
}""",
    )
    result["action"] = "show_operations_report"
    result["data"] = {"operational_score": result.get("operational_score", "?")}
    result["message"] = f"Operations score: {result.get('operational_score', '?')}"
    return result


# ========================================================================
# 5. Full Patient Info
# ========================================================================
def full_patient_info(data: dict | None = None, patient_id: int = 1) -> dict:
    """Compile a complete 360° view of a single patient."""
    patient = data or get_patient_data(patient_id)
    bills = get_billing_data(patient_id)
    appts = get_appointments(patient_id)
    reports = get_patient_reports(patient_id)

    result = _analyse(
        role_description=(
            "You are a clinical data analyst AI. Compile a comprehensive "
            "patient profile combining demographics, medical history, "
            "appointments, billing, and reports."
        ),
        data={
            "patient": patient,
            "appointments": appts,
            "billing": bills,
            "reports": reports,
        },
        output_spec="""{
  "patient_overview": {"name": "...", "age": ..., "conditions": [...]},
  "visit_history": [{"date": "...", "doctor": "...", "purpose": "..."}],
  "financial_summary": {"total_billed": ..., "total_paid": ..., "outstanding": ...},
  "clinical_summary": "...",
  "risk_flags": ["..."],
  "recommendations": ["..."]
}""",
    )
    result["action"] = "show_full_patient_info"
    result["data"] = {"patient_id": patient_id}
    result["message"] = f"Full profile compiled for patient #{patient_id}."
    return result


# ========================================================================
# 6. CEO Agent
# ========================================================================
def ceo_agent(data: dict | None = None) -> dict:
    """Strategic CEO-level dashboard with autonomous decision support."""
    stats = data or get_hospital_stats()
    finance = get_finance_records()
    doctors = get_available_doctors()
    medicines = get_medicines()

    result = _analyse(
        role_description=(
            "You are the CEO's strategic AI advisor for a hospital. "
            "Provide a high-level executive briefing with KPIs, risks, "
            "strategic opportunities, and autonomous recommendations."
        ),
        data={
            "hospital_stats": stats,
            "finance": finance,
            "doctors": doctors,
            "medicines": medicines,
        },
        output_spec="""{
  "executive_summary": "<2-3 sentence overview>",
  "kpis": {
    "occupancy_rate": "...",
    "revenue": ...,
    "profit_margin": "...",
    "patient_satisfaction": "..."
  },
  "risk_alerts": [{"risk": "...", "severity": "high|medium|low", "mitigation": "..."}],
  "strategic_opportunities": ["..."],
  "autonomous_decisions": [{"decision": "...", "rationale": "...", "status": "recommended|approved"}],
  "action_items": [{"priority": "...", "task": "...", "owner": "..."}]
}""",
    )
    result["action"] = "show_ceo_dashboard"
    result["data"] = result.get("kpis", {})
    result["message"] = result.get("executive_summary", "CEO dashboard ready.")
    return result


# ========================================================================
# NEW OPERATIONAL FUNCTIONS
# ========================================================================

def add_staff_member(staff_data: dict) -> dict:
    """Add a new staff member to the hospital."""
    from agents.tools import add_staff_db

    result = add_staff_db(staff_data)

    if result["status"] == "success":
        return {
            "Action": "Staff Addition",
            "Status": "Completed",
            "Details": result["details"],
            "Next Steps": [
                "Assign schedule and shift",
                "Provide access credentials",
                "Complete orientation training"
            ]
        }
    else:
        return {
            "Action": "Staff Addition",
            "Status": "Failed",
            "Details": result["details"],
            "Next Steps": [
                "Verify all required fields are provided",
                "Check for duplicate entries",
                "Contact IT support if issue persists"
            ]
        }


def add_medicine_item(medicine_data: dict) -> dict:
    """Add a new medicine to the inventory."""
    from agents.tools import add_medicine_db

    result = add_medicine_db(medicine_data)

    if result["status"] == "success":
        return {
            "Action": "Medicine Addition",
            "Status": "Completed",
            "Details": result["details"],
            "Next Steps": [
                "Verify stock levels",
                "Update reorder alerts if needed",
                "Check expiry date monitoring"
            ]
        }
    else:
        return {
            "Action": "Medicine Addition",
            "Status": "Failed",
            "Details": result["details"],
            "Next Steps": [
                "Ensure all required fields are provided",
                "Verify medicine name and category",
                "Check supplier information"
            ]
        }


def edit_medicine_item(medicine_id: int, medicine_data: dict) -> dict:
    """Update an existing medicine record."""
    from agents.tools import update_medicine_db

    result = update_medicine_db(medicine_id, medicine_data)

    if result["status"] == "success":
        return {
            "Action": "Medicine Update",
            "Status": "Completed",
            "Details": result["details"],
            "Next Steps": [
                "Verify updated information",
                "Check stock levels and reorder alerts",
                "Update any affected prescriptions"
            ]
        }
    else:
        return {
            "Action": "Medicine Update",
            "Status": "Failed",
            "Details": result["details"],
            "Next Steps": [
                "Verify medicine ID exists",
                "Check data format and validity",
                "Ensure proper permissions"
            ]
        }


def cancel_appointment_admin(appointment_data: dict) -> dict:
    """Cancel an appointment (admin version - can cancel any appointment)."""
    from models.appointment import Appointment
    from extensions import db

    try:
        if not appointment_data or not appointment_data.get("id"):
            return {
                "Action": "Appointment Cancellation",
                "Status": "Failed",
                "Details": "Appointment ID required",
                "Next Steps": ["Provide valid appointment ID"]
            }

        appt = Appointment.query.get(appointment_data["id"])
        if not appt:
            return {
                "Action": "Appointment Cancellation",
                "Status": "Failed",
                "Details": "Appointment not found",
                "Next Steps": ["Verify appointment ID", "Check appointment exists"]
            }

        if appt.status == "cancelled":
            return {
                "Action": "Appointment Cancellation",
                "Status": "Failed",
                "Details": "Appointment already cancelled",
                "Next Steps": ["Check appointment status"]
            }

        old_status = appt.status
        appt.status = "cancelled"
        db.session.commit()

        logger.info("cancel_appointment_admin: cancelled appointment %d", appt.id)
        return {
            "Action": "Appointment Cancellation",
            "Status": "Completed",
            "Details": f"Appointment with {appt.doctor_name} cancelled successfully",
            "Next Steps": [
                "Notify patient of cancellation",
                "Reschedule if needed",
                "Update appointment calendar"
            ]
        }

    except Exception as exc:
        logger.error("cancel_appointment_admin failed: %s", exc)
        db.session.rollback()
        return {
            "Action": "Appointment Cancellation",
            "Status": "Failed",
            "Details": str(exc),
            "Next Steps": [
                "Check database connection",
                "Verify appointment data",
                "Contact technical support"
            ]
        }


def register_new_patient(patient_data: dict) -> dict:
    """Register a new patient in the system."""
    from agents.tools import register_patient_db

    result = register_patient_db(patient_data)

    if result["status"] == "success":
        return {
            "Action": "Patient Registration",
            "Status": "Completed",
            "Details": result["details"],
            "Next Steps": [
                "Schedule initial consultation",
                "Create medical record",
                "Provide patient ID and login credentials"
            ]
        }
    else:
        return {
            "Action": "Patient Registration",
            "Status": "Failed",
            "Details": result["details"],
            "Next Steps": [
                "Verify all required fields are provided",
                "Check email uniqueness",
                "Ensure valid contact information"
            ]
        }


def add_patient_report(report_data: dict, patient_id: int) -> dict:
    """Add a medical report for a patient."""
    from agents.tools import add_report_db

    result = add_report_db(report_data, patient_id)

    if result["status"] == "success":
        return {
            "Action": "Medical Report Addition",
            "Status": "Completed",
            "Details": result["details"],
            "Next Steps": [
                "Review report for accuracy",
                "Update patient medical history",
                "Schedule follow-up if needed"
            ]
        }
    else:
        return {
            "Action": "Medical Report Addition",
            "Status": "Failed",
            "Details": result["details"],
            "Next Steps": [
                "Verify patient ID exists",
                "Check report data completeness",
                "Ensure doctor authorization"
            ]
        }


def generate_patient_bill(bill_data: dict, patient_id: int) -> dict:
    """Generate a bill for patient services."""
    from agents.tools import generate_bill_db

    result = generate_bill_db(bill_data, patient_id)

    if result["status"] == "success":
        return {
            "Action": "Bill Generation",
            "Status": "Completed",
            "Details": result["details"],
            "Next Steps": [
                "Send bill to patient",
                "Process payment if received",
                "Update billing records"
            ]
        }
    else:
        return {
            "Action": "Bill Generation",
            "Status": "Failed",
            "Details": result["details"],
            "Next Steps": [
                "Verify bill items and amounts",
                "Check patient ID validity",
                "Ensure proper billing permissions"
            ]
        }
