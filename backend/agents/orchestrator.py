"""
UFO Orchestrator — Central intelligence router for the MNH Hospital AI system.

This is the **single entry point** for all AI interactions. It:
  1. Understands user intent via LLM
  2. Routes to the correct agent (patient / admin / emergency / voice)
  3. Calls tools for data gathering
  4. Combines results from multiple agents when needed
  5. Returns structured UFO payloads for frontend GUI control

Function:
  • handle_query(user_query, context=None) → dict
"""

from __future__ import annotations

import json
import logging
import re
import time
from datetime import datetime
from typing import Any

from agents.openai_client import ask_llm

# Agent imports
from agents.patient_agent import (
    smart_appointment,
    report_explainer,
    medication_reminder,
    billing_explainer,
)
from agents.emergency_agent import detect_emergency
from agents.voice_agent import process_voice
from agents.admin_agent import (
    patient_summary,
    revenue_agent,
    resource_agent,
    operations_agent,
    full_patient_info,
    ceo_agent,
)

# Tools imports
from agents.tools import (
    get_patient_data,
    get_all_patients,
    get_billing_data,
    get_hospital_stats,
    get_available_doctors,
    get_appointments,
    get_patient_reports,
    get_medicines,
    get_finance_records,
    get_bed_status,
    get_equipment,
)

logger = logging.getLogger("agents.orchestrator")


def _extract_number(text: str) -> int | None:
    match = re.search(r"\b(\d+)\b", text)
    return int(match.group(1)) if match else None


def _extract_float(text: str) -> float | None:
    match = re.search(r"\b(\d+(?:\.\d+)?)\b", text)
    return float(match.group(1)) if match else None


def _extract_email(text: str) -> str | None:
    match = re.search(r"([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)", text)
    return match.group(1).strip() if match else None


def _extract_phone(text: str) -> str | None:
    match = re.search(r"(\+?\d[\d\s-]{7,}\d)", text)
    return match.group(1).strip() if match else None


def _extract_key_value(text: str, key: str) -> str | None:
    pattern = rf"{key}\s*(?:is|=|:)?\s*([A-Za-z0-9 .@+-/]+?)(?=\s+(?:name|role|department|specialization|shift|phone|email|age|gender|blood_group|conditions|allergies|stock|quantity|price|unit_price|expiry|expiry_date|patient|doctor|diagnosis|reason|total|items|$))"
    match = re.search(pattern, text, re.IGNORECASE)
    return match.group(1).strip() if match else None


def _parse_staff_data(query: str) -> dict:
    q = query.lower()
    staff = {
        "name": None,
        "role": None,
        "department": None,
        "specialization": None,
        "shift": None,
        "phone": None,
    }
    if "named" in q:
        match = re.search(r"named\s+([A-Za-z .]+?)(?:\s+in\s+|\s+as\s+|\s+department|\s+phone|\s+specialization|\s+shift|$)", query, re.IGNORECASE)
        if match:
            staff["name"] = match.group(1).strip()
    if not staff["name"]:
        name = _extract_key_value(query, "name")
        staff["name"] = name
    if "doctor" in q:
        staff["role"] = staff["role"] or "doctor"
    if "nurse" in q:
        staff["role"] = staff["role"] or "nurse"
    role = _extract_key_value(query, "role")
    if role:
        staff["role"] = role
    dept = _extract_key_value(query, "department") or _extract_key_value(query, "dept")
    if dept:
        staff["department"] = dept
    spec = _extract_key_value(query, "specialization")
    if spec:
        staff["specialization"] = spec
    shift = _extract_key_value(query, "shift")
    if shift:
        staff["shift"] = shift
    phone = _extract_phone(query)
    if phone:
        staff["phone"] = phone
    return staff


def _parse_medicine_data(query: str) -> dict:
    medicine = {
        "id": None,
        "name": None,
        "category": None,
        "stock": None,
        "unit_price": None,
        "manufacturer": None,
        "batch_number": None,
        "expiry_date": None,
        "supplier": None,
    }
    match = re.search(r"add\s+(?:new\s+)?([A-Za-z0-9 ]+?)\s+(?:medicine|drug|tablet|capsule|injection)", query, re.IGNORECASE)
    if match:
        medicine["name"] = match.group(1).strip()
    if not medicine["name"]:
        name = _extract_key_value(query, "name")
        medicine["name"] = name
    qty = _extract_key_value(query, "stock") or _extract_key_value(query, "quantity")
    if qty and qty.isdigit():
        medicine["stock"] = int(qty)
    price = _extract_key_value(query, "price") or _extract_key_value(query, "unit_price")
    if price:
        try:
            medicine["unit_price"] = float(re.search(r"\d+(?:\.\d+)?", price).group(0))
        except Exception:
            pass
    expiry = _extract_key_value(query, "expiry_date") or _extract_key_value(query, "expiry")
    if expiry:
        medicine["expiry_date"] = expiry
    category = _extract_key_value(query, "category")
    if category:
        medicine["category"] = category
    return medicine


def _parse_patient_data(query: str) -> dict:
    patient = {
        "name": None,
        "email": None,
        "age": None,
        "gender": None,
        "blood_group": None,
        "conditions": None,
        "allergies": None,
    }
    match = re.search(r"register patient\s+([A-Za-z ]+?)\s+([A-Za-z0-9_.+-]+@[A-Za-z0-9-]+\.[A-Za-z0-9-.]+)", query, re.IGNORECASE)
    if match:
        patient["name"] = match.group(1).strip()
        patient["email"] = match.group(2).strip()
    if not patient["name"]:
        name = _extract_key_value(query, "name")
        patient["name"] = name
    email = _extract_email(query)
    if email:
        patient["email"] = email
    age = _extract_key_value(query, "age") or _extract_key_value(query, "years")
    if age and age.isdigit():
        patient["age"] = int(age)
    if "male" in query.lower():
        patient["gender"] = patient["gender"] or "male"
    if "female" in query.lower():
        patient["gender"] = patient["gender"] or "female"
    if "other" in query.lower():
        patient["gender"] = patient["gender"] or "other"
    patient["blood_group"] = _extract_key_value(query, "blood_group")
    patient["conditions"] = _extract_key_value(query, "conditions") or _extract_key_value(query, "disease")
    patient["allergies"] = _extract_key_value(query, "allergies")
    return patient


def _normalize_patient_registration_data(patient_data: dict) -> dict:
    normalized = {k: v for k, v in patient_data.items() if v is not None and v != ""}
    if "contact" in normalized and not normalized.get("email"):
        contact = normalized["contact"]
        email = _extract_email(contact)
        if email:
            normalized["email"] = email
        else:
            normalized["emergency_contact"] = contact
    return normalized


def _get_missing_patient_registration_fields(patient_data: dict) -> list[str]:
    required = ["name", "email", "age", "gender"]
    return [field for field in required if not patient_data.get(field)]


def _parse_report_data(query: str) -> dict:
    report = {
        "doctor_name": None,
        "diagnosis": None,
        "suggestions": None,
        "visit_date": None,
    }
    if match := re.search(r"patient\s+(?:id\s+)?(\d+)", query, re.IGNORECASE):
        report["patient_id"] = int(match.group(1))
    doctor = _extract_key_value(query, "doctor") or _extract_key_value(query, "doctor_name")
    if doctor:
        report["doctor_name"] = doctor
    diagnosis = _extract_key_value(query, "diagnosis") or _extract_key_value(query, "diagnosed with")
    if diagnosis:
        report["diagnosis"] = diagnosis
    suggestions = _extract_key_value(query, "suggestion") or _extract_key_value(query, "recommendation")
    if suggestions:
        report["suggestions"] = suggestions
    visit_date = _extract_key_value(query, "visit_date") or _extract_key_value(query, "date")
    if visit_date:
        report["visit_date"] = visit_date
    return report


def _parse_bill_data(query: str) -> dict:
    bill = {
        "items": [],
        "tax_rate": None,
        "discount": None,
    }
    if match := re.search(r"patient\s+(?:id\s+)?(\d+)", query, re.IGNORECASE):
        bill["patient_id"] = int(match.group(1))
    if match := re.search(r"total\s*(?:amount|due)?\s*[:=]?\s*₹?\s*(\d+(?:\.\d+)?)", query, re.IGNORECASE):
        bill["total_amount"] = float(match.group(1))
    if match := re.search(r"discount\s*[:=]?\s*(\d+(?:\.\d+)?)", query, re.IGNORECASE):
        bill["discount"] = float(match.group(1))
    item_matches = re.findall(r"(\d+)\s*x\s*([A-Za-z0-9 ]+?)\s*(\d+(?:\.\d+)?)", query, re.IGNORECASE)
    for qty, name, amount in item_matches:
        bill["items"].append({"name": name.strip(), "quantity": int(qty), "amount": float(amount)})
    return bill


def _admin_fallback_operation(intent: str, entities: dict, query: str) -> tuple[str, dict]:
    lower = query.lower()
    user_role = entities.get("user_role", "unknown")
    if user_role != "admin":
        return intent, entities
    if any(value in lower for value in ["add staff", "add doctor", "add a new doctor", "add nurse", "add a new nurse", "add receptionist", "hire staff"]):
        new_entities = {**entities, "staff_data": {**entities.get("staff_data", {}), **_parse_staff_data(query)}}
        return "add_staff", new_entities
    if any(value in lower for value in ["add medicine", "add a new medicine", "add drug", "add tablet", "medicine stock", "stock medicine"]):
        new_entities = {**entities, "medicine_data": {**entities.get("medicine_data", {}), **_parse_medicine_data(query)}}
        return "add_medicine", new_entities
    if any(value in lower for value in ["edit medicine", "update medicine", "change medicine", "modify medicine"]):
        medicine_data = {**entities.get("medicine_data", {}), **_parse_medicine_data(query)}
        medicine_id = entities.get("medicine_id") or _extract_number(query)
        if medicine_id:
            medicine_data["id"] = medicine_id
        return "edit_medicine", {**entities, "medicine_data": medicine_data}
    if any(value in lower for value in ["cancel appointment", "cancel the appointment", "cancel appointment id", "cancel appt"]):
        appointment_id = entities.get("appointment_data", {}).get("id") or _extract_number(query)
        appointment_data = {**entities.get("appointment_data", {}), "id": appointment_id}
        if "because" in lower or "due to" in lower:
            reason = query.split("because", 1)[-1].strip() if "because" in lower else query.split("due to", 1)[-1].strip()
            appointment_data["reason"] = reason
        return "cancel_appointment_admin", {**entities, "appointment_data": appointment_data}
    if any(value in lower for value in ["register patient", "new patient", "add patient", "add a new patient"]):
        new_entities = {**entities, "patient_data": {**entities.get("patient_data", {}), **_parse_patient_data(query)}}
        return "register_patient", new_entities
    if any(value in lower for value in ["add report", "medical report", "attach report", "upload report", "add a new report"]):
        report_data = {**entities.get("report_data", {}), **_parse_report_data(query)}
        return "add_report", {**entities, "report_data": report_data}
    if any(value in lower for value in ["generate bill", "create bill", "bill patient", "billing for patient"]):
        bill_data = {**entities.get("bill_data", {}), **_parse_bill_data(query)}
        return "generate_bill", {**entities, "bill_data": bill_data}
    return intent, entities

# -----------------------------------------------------------------------
# Intent → handler mapping
# -----------------------------------------------------------------------
INTENT_HANDLERS = {
    # Patient-facing
    "book_appointment": "patient",
    "cancel_appointment": "patient",
    "appointment_query": "patient",
    "explain_report": "patient",
    "medication_reminder": "patient",
    "medicine_inventory": "patient",
    "explain_bill": "patient",
    "billing_query": "patient",

    # Admin / executive
    "patient_summary": "admin",
    "revenue_report": "admin",
    "resource_status": "admin",
    "operations_report": "admin",
    "full_patient_info": "admin",
    "ceo_dashboard": "admin",
    "hospital_stats": "admin",

    # Admin operations
    "add_staff": "admin",
    "add_medicine": "admin",
    "edit_medicine": "admin",
    "cancel_appointment_admin": "admin",
    "register_patient": "admin",
    "add_report": "admin",
    "generate_bill": "admin",

    # Emergency
    "emergency": "emergency",
    "critical_symptom": "emergency",

    # Voice / natural language
    "voice_command": "voice",

    # Fallback
    "general_query": "general",
    "greeting": "general",
}


# -----------------------------------------------------------------------
# Step 1: Intent classification via LLM
# -----------------------------------------------------------------------
def _classify_intent(query: str, context: dict | None = None) -> dict:
    """Use LLM to classify user intent, extract entities, and detect urgency."""
    intent_list = ", ".join(INTENT_HANDLERS.keys())

    ctx_section = ""
    if context:
        ctx_section = f"\n**Context:** {json.dumps(context, default=str)[:500]}"

    prompt = f"""You are the UFO intent-classification engine for a hospital AI system.

**STRICT RULES:**
- You MUST only classify the query into the available intents.
- Do NOT assume patient IDs, names, or symptoms if not present in the user query.
- If the query asks for available medicines, inventory, or medical store stock, choose "medicine_inventory".
- Use "medication_reminder" only when the user asks for a dosing schedule, prescription advice, or how to take medicines.
- If the query is about medical history or reports, extract "report_data" as an empty object if not provided in context, so agents know to fetch from DB.
- For admin operations like adding staff, medicines, patients, or managing appointments, use the appropriate admin intent.
- Detect user role (admin/patient) from context if available.
- For appointment cancellation, extract appointment ID, date, or doctor name from the query if mentioned (e.g., "cancel appointment 123", "cancel my appointment with Dr. Smith").
- For admin operations, extract relevant data from the query:
  - add_staff: extract name, role, department, specialization, shift, phone from queries like "add doctor Dr. Smith cardiology"
  - add_medicine: extract name, category, stock, unit_price from queries like "add aspirin medicine 100 units 5 rupees"
  - edit_medicine: extract medicine_id and updated fields from queries like "update medicine 12 price 6.5" or "edit ibuprofen stock 200"
  - cancel_appointment_admin: choose this intent when an admin user asks to cancel an appointment generally or mentions an appointment ID, even if patient context is absent
  - register_patient: extract name, email, age, gender, blood_group, conditions, allergies from queries like "register patient John Doe john@email.com 30 male"
  - add_report: extract patient_id, doctor_name, diagnosis, visit_date, and suggestions from queries like "add report for patient 5: doctor Dr. Lee, diagnosis flu"
  - generate_bill: extract patient_id, items, tax_rate, discount, subtotal from queries like "generate bill for patient 5 with 2 x X-ray 500 and consultation 200"
- When context includes "user_role": "admin", prefer admin operation intents for staff, medicine, patient management, appointment management, reporting, and billing requests.
- When context includes "user_role": "patient", prefer patient-facing intents and only use admin operation intents if the query explicitly says the patient wants an admin action.

**User query:** "{query}"{ctx_section}

**Available intents:** {intent_list}

Classify the query and return **valid JSON**:
{{
  "intent": "<one of the intents listed>",
  "confidence": <0.0-1.0>,
  "is_emergency": <true/false>,
  "user_role": "<admin|patient|unknown>",
  "entities": {{
    "patient_id": <int or null>,
    "symptoms": "<string or null>",
    "medication": "<string or null>",
    "department": "<string or null>",
    "report_data": {{
      "doctor_name": "<string or null>",
      "diagnosis": "<string or null>",
      "suggestions": "<string or null>"
    }},
    "bill_data": {{
      "items": [<array of items with name, quantity, amount>],
      "tax_rate": <float>,
      "discount": <float>
    }},
    "staff_data": {{
      "name": "<string or null>",
      "role": "<string or null>",
      "department": "<string or null>",
      "specialization": "<string or null>",
      "shift": "<string or null>",
      "phone": "<string or null>"
    }},
    "medicine_data": {{
      "id": <int or null>,
      "name": "<string or null>",
      "category": "<string or null>",
      "stock": <int or null>,
      "unit_price": <float or null>,
      "manufacturer": "<string or null>",
      "batch_number": "<string or null>",
      "expiry_date": "<string or null>",
      "supplier": "<string or null>"
    }},
    "patient_data": {{
      "name": "<string or null>",
      "email": "<string or null>",
      "age": <int or null>,
      "gender": "<string or null>",
      "blood_group": "<string or null>",
      "conditions": "<string or null>",
      "allergies": "<string or null>"
    }},
    "appointment_data": {{
      "id": <int or null>,
      "doctor_name": "<string or null>",
      "date": "<string or null>",
      "reason": "<string or null>"
    }},
    "query_text": "<remaining free text>"
  }},
  "requires_multiple_agents": <true/false>,
  "agent_chain": ["<agent1>", "<agent2>"]
}}
"""
    raw = ask_llm(prompt, temperature=0.1, response_format={"type": "json_object"})
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {
            "intent": "general_query",
            "confidence": 0.3,
            "is_emergency": False,
            "entities": {"query_text": query},
            "requires_multiple_agents": False,
            "agent_chain": [],
        }


# -----------------------------------------------------------------------
# Step 2: Route to the correct agent
# -----------------------------------------------------------------------
def _route_to_agent(intent: str, entities: dict, original_query: str) -> dict:
    """Dispatch to the correct agent function based on classified intent."""
    pid = entities.get("patient_id")
    symptoms = entities.get("symptoms") or entities.get("query_text") or original_query

    try:
        # ---- Emergency (highest priority) ----
        if intent in ("emergency", "critical_symptom"):
            return detect_emergency(original_query)

        # ---- Patient agents ----
        if intent in ("book_appointment", "appointment_query"):
            return smart_appointment(symptoms, patient_id=pid)

        if intent == "cancel_appointment":
            from agents.patient_agent import cancel_appointment_patient
            return cancel_appointment_patient(entities.get("appointment_data"), patient_id=pid)

        if intent == "explain_report":
            return report_explainer(
                report=entities.get("report_data"), patient_id=pid
            )

        if intent == "medicine_inventory":
            from agents.patient_agent import medicine_inventory
            return medicine_inventory()

        if intent == "medication_reminder":
            meds = entities.get("medication") or entities.get("query_text") or original_query
            return medication_reminder(meds)

        if intent in ("explain_bill", "billing_query"):
            return billing_explainer(
                bill=entities.get("bill_data"), patient_id=pid
            )

        # ---- Admin agents ----
        if intent == "patient_summary":
            return patient_summary()

        if intent == "revenue_report":
            return revenue_agent()

        if intent == "resource_status":
            return resource_agent()

        if intent == "operations_report":
            return operations_agent()

        if intent == "full_patient_info":
            return full_patient_info(patient_id=pid or 1)

        if intent in ("ceo_dashboard", "hospital_stats"):
            return ceo_agent()

        # ---- Admin operations ----
        if intent == "add_staff":
            from agents.admin_agent import add_staff_member
            return add_staff_member(entities.get("staff_data"))

        if intent == "add_medicine":
            from agents.admin_agent import add_medicine_item
            return add_medicine_item(entities.get("medicine_data"))

        if intent == "edit_medicine":
            from agents.admin_agent import edit_medicine_item
            medicine_data = entities.get("medicine_data", {})
            medicine_id = medicine_data.get("id") or entities.get("medicine_id")
            return edit_medicine_item(medicine_id, medicine_data)

        if intent == "cancel_appointment_admin":
            from agents.admin_agent import cancel_appointment_admin
            return cancel_appointment_admin(entities.get("appointment_data"))

        if intent == "register_patient":
            from agents.admin_agent import register_new_patient
            return register_new_patient(entities.get("patient_data"))

        if intent == "add_report":
            from agents.admin_agent import add_patient_report
            report_patient_id = entities.get("patient_id") or entities.get("report_data", {}).get("patient_id")
            return add_patient_report(entities.get("report_data"), patient_id=report_patient_id)

        if intent == "generate_bill":
            from agents.admin_agent import generate_patient_bill
            bill_patient_id = entities.get("patient_id") or entities.get("bill_data", {}).get("patient_id")
            return generate_patient_bill(entities.get("bill_data"), patient_id=bill_patient_id)

        # ---- Voice ----
        if intent == "voice_command":
            return process_voice(original_query)

        # ---- General / greeting ----
        answer = ask_llm(
            "You are MNH Hospital AI. Answer helpfully and concisely. "
            "STRICT GROUNDING: Do NOT give medical advice or assume facts. "
            "IMPORTANT: Return your response as PLAIN TEXT only. Do NOT use JSON formatting, no braces {}, and no 'response' keys. "
            f"User Query: {original_query}"
        )
        return {
            "action": "show_message",
            "data": {},
            "message": answer,
        }

    except Exception as exc:
        logger.exception("Agent routing error for intent '%s': %s", intent, exc)
        return {
            "action": "show_error",
            "data": {"error": str(exc)},
            "message": f"An error occurred while processing your request: {exc}",
        }


# -----------------------------------------------------------------------
# Step 3: Multi-agent collaboration (when needed)
# -----------------------------------------------------------------------
def _run_agent_chain(agent_chain: list[str], entities: dict, query: str) -> list[dict]:
    """Execute a chain of agents sequentially, passing context forward."""
    results = []
    for agent_name in agent_chain:
        if agent_name == "emergency":
            results.append(detect_emergency(query))
        elif agent_name == "patient":
            results.append(smart_appointment(
                entities.get("symptoms") or query,
                patient_id=entities.get("patient_id"),
            ))
        elif agent_name == "admin":
            results.append(patient_summary())
        else:
            results.append({
                "action": "show_message",
                "data": {},
                "message": f"Agent '{agent_name}' processed.",
            })
    return results


# -----------------------------------------------------------------------
# Step 4: Combine multi-agent results
# -----------------------------------------------------------------------
def _combine_results(primary: dict, chain_results: list[dict]) -> dict:
    """Merge results from multiple agents into a unified response."""
    if not chain_results:
        return primary

    combined_actions = [primary.get("action", "show_message")]
    combined_messages = [primary.get("message", "")]
    combined_data = dict(primary.get("data", {}))
    auto_actions = list(primary.get("auto_actions", []))

    for r in chain_results:
        combined_actions.append(r.get("action", ""))
        combined_messages.append(r.get("message", ""))
        combined_data.update(r.get("data", {}))
        auto_actions.extend(r.get("auto_actions", []))

    return {
        **primary,
        "action": combined_actions[0],  # primary action leads
        "secondary_actions": combined_actions[1:],
        "data": combined_data,
        "message": " | ".join(filter(None, combined_messages)),
        "auto_actions": auto_actions,
        "agent_results": [primary] + chain_results,
    }


# =======================================================================
# PUBLIC API — The single entry point
# =======================================================================
def handle_query(user_query: str, context: dict | None = None) -> dict:
    """UFO Orchestrator entry point.

    Parameters
    ----------
    user_query : str
        The user's natural-language query.
    context : dict | None
        Optional context (frontend_state, user role, page, etc.).

    Returns
    -------
    dict — Structured UFO response with:
      action      — primary frontend action to execute
      data        — payload for the action
      message     — human-readable response
      metadata    — timing, intent, confidence, etc.
    """
    start_time = time.time()

    # 1. Classify intent
    classification = _classify_intent(user_query, context)
    intent = classification.get("intent", "general_query")
    entities = classification.get("entities", {})

    # Merge user_role and patient_id from context if available
    user_role = classification.get("user_role") or (context.get("user_role") if context else None)
    if user_role:
        entities["user_role"] = user_role
    if context and context.get("patient_id") and not entities.get("patient_id"):
        entities["patient_id"] = context["patient_id"]

    intent, entities = _admin_fallback_operation(intent, entities, user_query)

    is_emergency = classification.get("is_emergency", False)
    confidence = classification.get("confidence", 0.5)
    requires_chain = classification.get("requires_multiple_agents", False)
    agent_chain = classification.get("agent_chain", [])

    logger.info(
        "Intent: %s | Confidence: %.2f | Emergency: %s | Chain: %s",
        intent, confidence, is_emergency, agent_chain,
    )

    # 2. Emergency override — always prioritise
    if is_emergency and intent not in ("emergency", "critical_symptom"):
        intent = "emergency"

    # 2a. Patient registration field collection
    if intent == "register_patient":
        pending_data = {}
        if context:
            pending_data = context.get("frontend_state", {}).get("pending_patient_data", {}) or {}
        patient_data = {**pending_data, **entities.get("patient_data", {})}
        patient_data = _normalize_patient_registration_data(patient_data)
        entities["patient_data"] = patient_data

        missing_fields = _get_missing_patient_registration_fields(patient_data)
        if missing_fields:
            final = {
                "action": "request_patient_registration_fields",
                "status": "pending",
                "details": "Missing required patient registration fields.",
                "message": "Please provide the following patient information: " + ", ".join(missing_fields) + ".",
                "data": {"missing_fields": missing_fields, "patient_data": patient_data},
            }
            elapsed = round(time.time() - start_time, 3)
            final["metadata"] = {
                "intent": intent,
                "confidence": confidence,
                "is_emergency": is_emergency,
                "requires_multiple_agents": requires_chain,
                "agent_chain": agent_chain,
                "processing_time_sec": elapsed,
                "timestamp": datetime.utcnow().isoformat(),
                "orchestrator": "UFO-v2",
            }
            return final

    # 3. Route to primary agent
    primary_result = _route_to_agent(intent, entities, user_query)

    # 4. Multi-agent collaboration
    chain_results = []
    if requires_chain and agent_chain:
        # Remove the primary agent from the chain to avoid duplicate work
        handler_type = INTENT_HANDLERS.get(intent, "general")
        remaining = [a for a in agent_chain if a != handler_type]
        if remaining:
            chain_results = _run_agent_chain(remaining, entities, user_query)

    # 5. Autonomous emergency escalation
    if is_emergency or intent in ("emergency", "critical_symptom"):
        emergency_result = primary_result if intent in ("emergency", "critical_symptom") else detect_emergency(user_query)
        if emergency_result.get("status") == "EMERGENCY":
            # Auto-trigger appointment suggestion
            if intent not in ("book_appointment", "appointment_query"):
                appt_result = smart_appointment(
                    entities.get("symptoms") or user_query,
                    patient_id=entities.get("patient_id"),
                )
                chain_results.append(appt_result)

    # 6. Combine everything
    final = _combine_results(primary_result, chain_results)

    # 7. Attach metadata
    elapsed = round(time.time() - start_time, 3)
    final["metadata"] = {
        "intent": intent,
        "confidence": confidence,
        "is_emergency": is_emergency,
        "requires_multiple_agents": requires_chain,
        "agent_chain": agent_chain,
        "processing_time_sec": elapsed,
        "timestamp": datetime.utcnow().isoformat(),
        "orchestrator": "UFO-v2",
    }

    # 8. Final Message Polish: Strip accidental JSON wrappers from messages
    msg = final.get("message", "")
    if isinstance(msg, str) and msg.strip().startswith("{"):
        try:
            parsed = json.loads(msg.strip())
            if isinstance(parsed, dict):
                final["message"] = parsed.get("response") or parsed.get("message") or msg
        except:
            pass

    logger.info("Query processed in %.3fs — action: %s", elapsed, final.get("action"))
    return final
