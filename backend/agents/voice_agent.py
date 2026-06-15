"""
Voice Agent — Natural-language intent classifier and router.

Function:
  • process_voice(text) — Parse natural language into an intent + entities,
    then route to the appropriate agent function and return the result.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from agents.openai_client import ask_llm

logger = logging.getLogger("agents.voice_agent")

# -----------------------------------------------------------------------
# Intent taxonomy (mirrors the agent capabilities)
# -----------------------------------------------------------------------
INTENT_MAP = {
    "book_appointment": "patient_agent.smart_appointment",
    "explain_report": "patient_agent.report_explainer",
    "medication_reminder": "patient_agent.medication_reminder",
    "medicine_inventory": "patient_agent.medicine_inventory",
    "explain_bill": "patient_agent.billing_explainer",
    "emergency": "emergency_agent.detect_emergency",
    "patient_summary": "admin_agent.patient_summary",
    "revenue_report": "admin_agent.revenue_agent",
    "resource_status": "admin_agent.resource_agent",
    "operations_report": "admin_agent.operations_agent",
    "full_patient_info": "admin_agent.full_patient_info",
    "ceo_dashboard": "admin_agent.ceo_agent",
    "general_query": "general",
}


# -----------------------------------------------------------------------
# Main function
# -----------------------------------------------------------------------
def process_voice(text: str) -> dict:
    """Convert natural language into a structured intent and route it.

    Parameters
    ----------
    text : str
        Raw natural-language input (from voice transcription or chat).

    Returns
    -------
    dict with keys:
      intent        — classified intent key
      entities      — extracted entities (patient_id, symptoms, etc.)
      confidence    — 0.0–1.0
      routed_to     — agent.function that will handle this
      result        — the actual result from calling the routed agent
      action / data / message — UFO-compatible payload
    """
    intent_keys = ", ".join(INTENT_MAP.keys())

    prompt = f"""You are a hospital voice-command interpreter.

**User said:** "{text}"

**Available intents:** {intent_keys}

Return **valid JSON**:
{{
  "intent": "<one of the intents above>",
  "confidence": <0.0-1.0>,
  "entities": {{
    "patient_id": <int or null>,
    "symptoms": "<string or null>",
    "medication": "<string or null>",
    "department": "<string or null>",
    "query": "<remaining free text>"
  }},
  "reasoning": "<why this intent>"
}}
"""
    raw = ask_llm(prompt, temperature=0.2, response_format={"type": "json_object"})
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        parsed = {
            "intent": "general_query",
            "confidence": 0.3,
            "entities": {"query": text},
            "reasoning": raw,
        }

    intent = parsed.get("intent", "general_query")
    entities = parsed.get("entities", {})
    confidence = parsed.get("confidence", 0.5)

    # ---- Route to the correct agent ----
    routed_to = INTENT_MAP.get(intent, "general")
    result: dict = {}

    try:
        if intent == "book_appointment":
            from agents.patient_agent import smart_appointment
            symptoms = entities.get("symptoms") or entities.get("query") or text
            result = smart_appointment(symptoms, patient_id=entities.get("patient_id"))

        elif intent == "explain_report":
            from agents.patient_agent import report_explainer
            result = report_explainer(patient_id=entities.get("patient_id"))

        elif intent == "medication_reminder":
            from agents.patient_agent import medication_reminder
            meds = entities.get("medication") or entities.get("query") or text
            result = medication_reminder(meds)

        elif intent == "medicine_inventory":
            from agents.patient_agent import medicine_inventory
            result = medicine_inventory()

        elif intent == "explain_bill":
            from agents.patient_agent import billing_explainer
            result = billing_explainer(patient_id=entities.get("patient_id"))

        elif intent == "emergency":
            from agents.emergency_agent import detect_emergency
            result = detect_emergency(text)

        elif intent == "patient_summary":
            from agents.admin_agent import patient_summary
            result = patient_summary()

        elif intent == "revenue_report":
            from agents.admin_agent import revenue_agent
            result = revenue_agent()

        elif intent == "resource_status":
            from agents.admin_agent import resource_agent
            result = resource_agent()

        elif intent == "operations_report":
            from agents.admin_agent import operations_agent
            result = operations_agent()

        elif intent == "full_patient_info":
            from agents.admin_agent import full_patient_info
            pid = entities.get("patient_id") or 1
            result = full_patient_info(patient_id=pid)

        elif intent == "ceo_dashboard":
            from agents.admin_agent import ceo_agent
            result = ceo_agent()

        else:
            # General query — let LLM answer directly
            answer = ask_llm(
                f"Answer this hospital-related question concisely:\n\n{text}"
            )
            result = {
                "action": "show_message",
                "data": {},
                "message": answer,
            }

    except Exception as exc:
        logger.exception("Voice routing error: %s", exc)
        result = {
            "action": "show_error",
            "data": {},
            "message": f"Error processing your request: {exc}",
        }

    return {
        "intent": intent,
        "entities": entities,
        "confidence": confidence,
        "routed_to": routed_to,
        "reasoning": parsed.get("reasoning", ""),
        "result": result,
        "action": result.get("action", "show_message"),
        "data": result.get("data", {}),
        "message": result.get("message", "Processed."),
    }
