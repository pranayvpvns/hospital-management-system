"""
Emergency Agent — Real-time critical-situation detector and responder.

Function:
  • detect_emergency(text) — Classify input as EMERGENCY or NORMAL,
    return structured action plan with auto-triage.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from agents.openai_client import ask_llm
from agents.tools import get_available_doctors, get_bed_status

logger = logging.getLogger("agents.emergency_agent")

# -----------------------------------------------------------------------
# Critical keyword bank (fast pre-filter before hitting LLM)
# -----------------------------------------------------------------------
CRITICAL_KEYWORDS = [
    "chest pain", "heart attack", "cardiac arrest", "stroke",
    "can't breathe", "cannot breathe", "difficulty breathing",
    "shortness of breath", "choking", "seizure", "convulsion",
    "unconscious", "unresponsive", "collapsed", "fainting",
    "severe bleeding", "hemorrhage", "blood loss",
    "anaphylaxis", "allergic reaction", "swelling throat",
    "overdose", "poisoning", "suicide", "self-harm",
    "severe burn", "head injury", "trauma", "accident",
    "gunshot", "stabbing", "drowning",
    "high fever", "104", "105",  # dangerously high temps
]


def _fast_keyword_check(text: str) -> bool:
    """Return True if any critical keyword appears in the text."""
    lower = text.lower()
    return any(kw in lower for kw in CRITICAL_KEYWORDS)


# -----------------------------------------------------------------------
# Main function
# -----------------------------------------------------------------------
def detect_emergency(text: str) -> dict:
    """Analyse free-text input for medical emergencies.

    Returns
    -------
    dict with keys:
      status        — "EMERGENCY" | "URGENT" | "NORMAL"
      severity      — 1-5 (5 = most critical)
      action        — recommended immediate action string
      triage_notes  — clinical reasoning
      auto_actions  — list of autonomous actions taken
      data          — UFO payload for frontend
      message       — human-readable summary
    """
    is_keyword_hit = _fast_keyword_check(text)

    prompt = f"""You are an emergency triage AI in a hospital.

**Patient input:** "{text}"

Evaluate the situation and return **valid JSON**:
{{
  "status": "EMERGENCY" | "URGENT" | "NORMAL",
  "severity": <1-5, 5 = life-threatening>,
  "triage_category": "<Red/Orange/Yellow/Green/Blue>",
  "action": "<immediate recommended action>",
  "triage_notes": "<brief clinical reasoning>",
  "recommended_department": "<department name>",
  "estimated_response_time": "<e.g. Immediate / 5 min / 30 min>"
}}
"""
    raw = ask_llm(prompt, temperature=0.1, response_format={"type": "json_object"})
    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        # Fallback: if keywords matched, treat as emergency
        result = {
            "status": "EMERGENCY" if is_keyword_hit else "NORMAL",
            "severity": 5 if is_keyword_hit else 1,
            "triage_category": "Red" if is_keyword_hit else "Green",
            "action": "Seek immediate medical attention" if is_keyword_hit else "No emergency detected",
            "triage_notes": raw,
            "recommended_department": "Emergency",
            "estimated_response_time": "Immediate" if is_keyword_hit else "N/A",
        }

    # Override with keyword detection if LLM under-classifies
    if is_keyword_hit and result.get("status") == "NORMAL":
        result["status"] = "URGENT"
        result["severity"] = max(result.get("severity", 3), 3)

    # ---- Autonomous actions ----
    auto_actions = []

    if result.get("status") == "EMERGENCY":
        # 1) Find emergency doctor
        doctors = get_available_doctors()
        emergency_docs = [d for d in doctors if d.get("department", "").lower() == "emergency"]
        if not emergency_docs:
            emergency_docs = doctors[:1]  # fallback to first available
        if emergency_docs:
            auto_actions.append({
                "type": "alert_doctor",
                "doctor": emergency_docs[0].get("name"),
                "department": emergency_docs[0].get("department"),
                "message": f"EMERGENCY ALERT: {text[:100]}",
            })

        # 2) Find available emergency bed
        beds = get_bed_status()
        emergency_beds = [b for b in beds
                          if b.get("status") == "available"
                          and b.get("ward", "").lower() in ("emergency", "icu")]
        if emergency_beds:
            auto_actions.append({
                "type": "reserve_bed",
                "bed": emergency_beds[0].get("bed_number"),
                "ward": emergency_beds[0].get("ward"),
            })

        # 3) Auto-book emergency appointment
        auto_actions.append({
            "type": "book_emergency_appointment",
            "department": result.get("recommended_department", "Emergency"),
            "priority": "STAT",
        })

        # 4) Notify admin
        auto_actions.append({
            "type": "notify_admin",
            "message": f"Emergency detected — Severity {result.get('severity', 5)}/5: {text[:120]}",
        })

    result["auto_actions"] = auto_actions

    # UFO payload
    result["action"] = "emergency_protocol" if result["status"] == "EMERGENCY" else "show_triage"
    result["data"] = {
        "status": result.get("status"),
        "severity": result.get("severity"),
        "department": result.get("recommended_department"),
        "auto_actions": auto_actions,
    }
    result["message"] = (
        f"🚨 {result['status']} — Severity {result.get('severity', '?')}/5 | "
        f"{result.get('action', '')} | Dept: {result.get('recommended_department', 'N/A')}"
    )
    return result
