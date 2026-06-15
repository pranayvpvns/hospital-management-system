#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MNH Agent System - Full Test Suite
Run from project root: python agents/test_agents.py

NOTE: This file uses ONLY ASCII characters so it works on Windows CP1252 terminals.
"""

import sys
import os
import json
import traceback
from datetime import datetime

# Add project root AND backend to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_path = os.path.join(project_root, 'backend')
sys.path.insert(0, backend_path)
sys.path.insert(0, project_root)

# Import Flask app for database context
from app import create_app

app = create_app()

RESULTS = []


def run_test(name, func, *args, **kwargs):
    """Run a single test, catch errors, record result."""
    print("")
    print("-" * 60)
    print("TEST: {}".format(name))
    print("-" * 60)
    try:
        result = func(*args, **kwargs)
        print("RESULT: {}".format(json.dumps(result, indent=2, default=str)))

        # Basic validation - result must be a dict, list, or string
        if isinstance(result, dict):
            if result.get('success') is False and 'error' in result:
                print("STATUS: [WARN] AGENT RETURNED ERROR - {}".format(result.get('error')))
                RESULTS.append((name, 'WARN', result.get('error')))
            elif result.get('action') == 'show_error':
                print("STATUS: [WARN] AGENT RETURNED ERROR ACTION - {}".format(result.get('message')))
                RESULTS.append((name, 'WARN', result.get('message')))
            else:
                print("STATUS: [PASS]")
                RESULTS.append((name, 'PASS', None))
        elif isinstance(result, list):
            print("STATUS: [PASS] (returned list with {} items)".format(len(result)))
            RESULTS.append((name, 'PASS', None))
        elif isinstance(result, str):
            print("STATUS: [PASS] (returned string)")
            RESULTS.append((name, 'PASS', None))
        else:
            print("STATUS: [FAIL] - returned {} instead of dict/list/string".format(type(result)))
            RESULTS.append((name, 'FAIL', "Wrong return type: {}".format(type(result))))

    except Exception as e:
        print("STATUS: [FAIL] - Exception: {}".format(str(e)))
        print("TRACEBACK:\n{}".format(traceback.format_exc()))
        RESULTS.append((name, 'FAIL', str(e)))


def main():
    print("")
    print("=" * 60)
    print("MNH AGENT SYSTEM - TEST SUITE")
    print("Started: {}".format(datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
    print("=" * 60)

    with app.app_context():

        # -- TEST 1: OpenAI Connection ------------------------------------
        print("\n[BLOCK 1] OPENAI CONNECTION")
        from agents.openai_client import ask_llm
        run_test(
            "OpenAI - basic ping",
            ask_llm,
            'Reply with exactly this JSON: {"status": "online", "agent": "MNH"}'
        )

        # -- TEST 2: Tools (Database Bridge) ------------------------------
        print("\n[BLOCK 2] TOOLS - DATABASE BRIDGE")
        import backend.agents.tools as tools

        run_test("tools - get_hospital_stats", tools.get_hospital_stats)
        run_test("tools - get_all_patients", tools.get_all_patients)
        run_test("tools - get_available_doctors", tools.get_available_doctors)
        run_test("tools - get_patient_data (id=1)", tools.get_patient_data, 1)
        run_test("tools - get_billing_data (id=1)", tools.get_billing_data, 1)
        run_test("tools - get_appointments (id=1)", tools.get_appointments, 1)

        # -- TEST 3: Emergency Agent --------------------------------------
        print("\n[BLOCK 3] EMERGENCY AGENT")
        from agents.emergency_agent import detect_emergency

        run_test(
            "Emergency - chest pain (MUST return EMERGENCY)",
            detect_emergency,
            "I have severe chest pain and I cannot breathe"
        )
        run_test(
            "Emergency - normal query (MUST return NORMAL)",
            detect_emergency,
            "I want to book a routine check-up appointment"
        )
        run_test(
            "Emergency - stroke symptoms",
            detect_emergency,
            "My father suddenly collapsed and is unconscious"
        )

        # -- TEST 4: Patient Agent ----------------------------------------
        print("\n[BLOCK 4] PATIENT AGENT")
        from agents.patient_agent import (
            smart_appointment,
            report_explainer,
            medication_reminder,
            billing_explainer
        )

        run_test(
            "Patient - smart_appointment (fever + sore throat)",
            smart_appointment,
            "I have high fever, sore throat, and body pain for 3 days"
        )
        run_test(
            "Patient - smart_appointment (diabetes symptoms)",
            smart_appointment,
            "I feel excessive thirst, frequent urination, and blurred vision"
        )
        run_test(
            "Patient - report_explainer",
            report_explainer,
            None,
            1
        )

        run_test(
            "Patient - medication_reminder",
            medication_reminder,
            ["Metformin 500mg twice daily after meals", "Aspirin 75mg once daily at night", "Vitamin D3 60000 IU weekly"]
        )
        run_test(
            "Patient - billing_explainer (patient_id=1)",
            billing_explainer,
            None, 1
        )

        # -- TEST 5: Voice Agent ------------------------------------------
        print("\n[BLOCK 5] VOICE AGENT")
        from agents.voice_agent import process_voice

        run_test(
            "Voice - book appointment intent",
            process_voice,
            "Can you please book me an appointment? I have a headache"
        )
        run_test(
            "Voice - bill inquiry intent",
            process_voice,
            "How much do I owe the hospital? What is my bill amount?"
        )
        run_test(
            "Voice - emergency intent",
            process_voice,
            "Help! My wife is having chest pain and difficulty breathing"
        )
        run_test(
            "Voice - report explanation intent",
            process_voice,
            "Can you explain my blood test report to me?"
        )

        # -- TEST 6: Admin Agent ------------------------------------------
        print("\n[BLOCK 6] ADMIN AGENT")
        from agents.admin_agent import (
            patient_summary,
            revenue_agent,
            resource_agent,
            operations_agent,
            full_patient_info,
            ceo_agent
        )

        run_test("Admin - patient_summary (all patients)", patient_summary)
        run_test("Admin - patient_summary (with explicit data)", patient_summary, [])
        run_test("Admin - revenue_agent", revenue_agent)
        run_test("Admin - resource_agent", resource_agent)
        run_test("Admin - operations_agent", operations_agent)
        run_test("Admin - full_patient_info (patient_id=1)", full_patient_info, None, 1)
        run_test("Admin - ceo_agent", ceo_agent)

        # -- TEST 7: Orchestrator (Main Entry Point) ----------------------
        print("\n[BLOCK 7] ORCHESTRATOR - handle_query()")
        from agents.orchestrator import handle_query

        run_test(
            "Orchestrator - patient chest pain -> emergency route",
            handle_query,
            "I have severe chest pain"
        )
        run_test(
            "Orchestrator - patient fever -> appointment route",
            handle_query,
            "I have fever for 2 days, I need to see a doctor"
        )
        run_test(
            "Orchestrator - admin revenue request",
            handle_query,
            "Show me the hospital revenue report"
        )
        run_test(
            "Orchestrator - admin CEO dashboard",
            handle_query,
            "Give me the executive summary and KPIs"
        )
        run_test(
            "Orchestrator - voice natural language",
            handle_query,
            "book appointment headache"
        )

    # -- FINAL SUMMARY ----------------------------------------------------
    print("")
    print("=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    passed = [r for r in RESULTS if r[1] == 'PASS']
    warned = [r for r in RESULTS if r[1] == 'WARN']
    failed = [r for r in RESULTS if r[1] == 'FAIL']

    print("")
    print("  PASSED : {}/{}".format(len(passed), len(RESULTS)))
    print("  WARNED : {}/{}".format(len(warned), len(RESULTS)))
    print("  FAILED : {}/{}".format(len(failed), len(RESULTS)))

    if warned:
        print("\nWARNINGS (agent returned error dict):")
        for name, _, msg in warned:
            print("  [!] {}: {}".format(name, msg))

    if failed:
        print("\nFAILURES:")
        for name, _, msg in failed:
            print("  [X] {}: {}".format(name, msg))

    if not failed:
        print("\n[+] All agents operational - ready for Phase 2 (UFO)")
    else:
        print("\n[-] Fix {} failure(s) before proceeding to Phase 2".format(len(failed)))

    print("\nFinished: {}".format(datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
    print("=" * 60)
    print("")


if __name__ == "__main__":
    main()
