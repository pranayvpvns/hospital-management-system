"""
Tools - Data bridge between agents and the hospital backend.

Every function executes against the real SQLAlchemy database.
Failures trigger logging and return empty structures.

Uses get_db_session() from extensions to get a standalone DB session
for use outside of FastAPI request context (i.e. from agent code).

Model reference (all verified from backend/models/):
  Patient     -> patients       (id, user_id, age, gender, blood_group, dob, bmi, conditions, allergies, lifestyle, emergency_contact)
  Staff       -> staff          (id, name, role, department, specialization, shift, status, phone)
  Appointment -> appointments   (id, patient_id, doctor_name, department, date, time_slot, status, notes)
  Billing     -> billings       (id, patient_id, items, subtotal, tax, discount, total, status)
  Payment     -> payments       (id, billing_id, amount, method, transaction_id, status)
  Bed         -> beds           (id, ward, bed_number, floor, bed_type, status, patient_id, daily_rate, admitted_at)
  Medicine    -> medicines      (id, name, category, manufacturer, stock, unit_price, batch_number, expiry_date, reorder_level, supplier)
  Equipment   -> equipment      (id, name, category, department, status, serial_number, purchase_date, last_maintenance, next_maintenance, cost)
  FinanceRecord -> finance_records (id, record_type, category, amount, department, description, date)
  Report      -> reports        (id, patient_id, doctor_name, visit_date, diagnosis, suggestions)
"""

from __future__ import annotations

import logging
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

# Ensure backend models are loaded from the backend directory consistently,
# regardless of whether the app is run from the root workspace or the backend folder.
_BACKEND_PATH = Path(__file__).resolve().parents[1]
if str(_BACKEND_PATH) not in sys.path:
    sys.path.insert(0, str(_BACKEND_PATH))

logger = logging.getLogger("agents.tools")


# ---------------------------------------------------------------------------
# SESSION HELPER
# ---------------------------------------------------------------------------
def _get_session():
    """Get a standalone DB session for agent tools (outside request context)."""
    from extensions import get_db_session
    return get_db_session()


# ---------------------------------------------------------------------------
# HELPER
# ---------------------------------------------------------------------------
def _safe_query(
    model_cls: Any,
    filters: Optional[Dict] = None,
    first: bool = False,
    order_by: Any = None,
) -> Union[Dict, List[Dict]]:
    """Safely query a SQLAlchemy model. Returns dict (first=True) or list[dict]."""
    session = _get_session()
    try:
        query = session.query(model_cls)
        if filters:
            query = query.filter_by(**filters)
        if order_by is not None:
            query = query.order_by(order_by)

        if first:
            obj = query.first()
            if obj is None:
                logger.info("query %s: returned 0 rows", model_cls.__name__)
                return {}
            logger.info("query %s: returned 1 row", model_cls.__name__)
            if hasattr(obj, "to_dict"):
                return obj.to_dict()
            return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}

        objects = query.all()
        logger.info("query %s: returned %d rows", model_cls.__name__, len(objects))
        result = []
        for obj in objects:
            if hasattr(obj, "to_dict"):
                result.append(obj.to_dict())
            else:
                result.append(
                    {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
                )
        return result

    except Exception as exc:
        logger.warning(
            "query %s failed (%s: %s)", model_cls.__name__, type(exc).__name__, exc
        )
        return {} if first else []
    finally:
        session.close()


# ---------------------------------------------------------------------------
# PATIENTS
# ---------------------------------------------------------------------------
def get_patient_data(patient_id: int) -> dict:
    """Get a single patient by id."""
    from models.patient import Patient

    return _safe_query(Patient, {"id": patient_id}, first=True)


def get_all_patients() -> list:
    """Get every patient record."""
    from models.patient import Patient

    return _safe_query(Patient)


# ---------------------------------------------------------------------------
# BILLING
# ---------------------------------------------------------------------------
def get_billing_data(patient_id: int) -> list:
    """Get billing records for a patient."""
    from models.billing import Billing

    return _safe_query(Billing, {"patient_id": patient_id})


# ---------------------------------------------------------------------------
# DOCTORS / STAFF
# ---------------------------------------------------------------------------
def get_available_doctors() -> list:
    """Get all active doctors."""
    from models.staff import Staff

    return _safe_query(Staff, {"role": "doctor", "status": "active"})


# ---------------------------------------------------------------------------
# APPOINTMENTS
# ---------------------------------------------------------------------------
def get_appointments(patient_id: int) -> list:
    """Get appointments for a patient, newest first."""
    from models.appointment import Appointment

    session = _get_session()
    try:
        appts = (
            session.query(Appointment)
            .filter_by(patient_id=patient_id)
            .order_by(Appointment.date.desc())
            .all()
        )
        logger.info("get_appointments: returned %d rows", len(appts))
        return [a.to_dict() for a in appts]
    except Exception as exc:
        logger.warning("get_appointments failed: %s", exc)
        return []
    finally:
        session.close()


# ---------------------------------------------------------------------------
# HOSPITAL STATS (Admin / CEO)
# ---------------------------------------------------------------------------
def get_hospital_stats() -> dict:
    """Aggregate key stats from every major table."""
    from models.patient import Patient
    from models.appointment import Appointment
    from models.bed import Bed
    from models.staff import Staff
    from models.medicine import Medicine
    from models.equipment import Equipment
    from models.finance import FinanceRecord

    stats = {
        "total_patients": 0,
        "total_appointments": 0,
        "total_beds": 0,
        "occupied_beds": 0,
        "available_beds": 0,
        "total_staff": 0,
        "total_doctors": 0,
        "total_revenue": 0.0,
        "total_expenses": 0.0,
        "low_stock_medicines": [],
        "maintenance_due_equipment": [],
    }

    session = _get_session()
    try:
        # 1. Patients
        try:
            stats["total_patients"] = session.query(Patient).count()
            logger.info("stats: Patient count = %d", stats["total_patients"])
        except Exception as exc:
            logger.warning("stats Patient failed: %s", exc)

        # 2. Appointments
        try:
            stats["total_appointments"] = session.query(Appointment).count()
            logger.info("stats: Appointment count = %d", stats["total_appointments"])
        except Exception as exc:
            logger.warning("stats Appointment failed: %s", exc)

        # 3. Beds
        try:
            beds = session.query(Bed).all()
            stats["total_beds"] = len(beds)
            stats["occupied_beds"] = sum(1 for b in beds if b.status == "occupied")
            stats["available_beds"] = stats["total_beds"] - stats["occupied_beds"]
            logger.info("stats: Beds total=%d occupied=%d", stats["total_beds"], stats["occupied_beds"])
        except Exception as exc:
            logger.warning("stats Bed failed: %s", exc)

        # 4. Staff
        try:
            staff_list = session.query(Staff).all()
            stats["total_staff"] = len(staff_list)
            stats["total_doctors"] = sum(1 for s in staff_list if s.role == "doctor")
            logger.info("stats: Staff total=%d doctors=%d", stats["total_staff"], stats["total_doctors"])
        except Exception as exc:
            logger.warning("stats Staff failed: %s", exc)

        # 5. Finance
        try:
            revenue_rows = session.query(FinanceRecord).filter_by(record_type="revenue").all()
            expense_rows = session.query(FinanceRecord).filter_by(record_type="expense").all()
            stats["total_revenue"] = sum(r.amount for r in revenue_rows)
            stats["total_expenses"] = sum(r.amount for r in expense_rows)
            logger.info(
                "stats: Revenue=%.2f Expenses=%.2f",
                stats["total_revenue"],
                stats["total_expenses"],
            )
        except Exception as exc:
            logger.warning("stats Finance failed: %s", exc)

        # 6. Low-stock medicines (stock <= reorder_level)
        try:
            medicines = session.query(Medicine).all()
            low = [m.to_dict() for m in medicines if m.is_low_stock]
            stats["low_stock_medicines"] = low
            logger.info("stats: Low-stock medicines = %d", len(low))
        except Exception as exc:
            logger.warning("stats Medicine failed: %s", exc)

        # 7. Equipment due for maintenance (within 7 days)
        try:
            equips = session.query(Equipment).all()
            cutoff = datetime.utcnow() + timedelta(days=7)
            due = [
                e.to_dict()
                for e in equips
                if e.next_maintenance and e.next_maintenance <= cutoff
            ]
            stats["maintenance_due_equipment"] = due
            logger.info("stats: Equipment due for maintenance = %d", len(due))
        except Exception as exc:
            logger.warning("stats Equipment failed: %s", exc)

    finally:
        session.close()

    return stats


# ---------------------------------------------------------------------------
# REPORTS
# ---------------------------------------------------------------------------
def get_patient_reports(patient_id: int) -> list:
    """Get medical reports for a patient."""
    from models.report import Report

    return _safe_query(Report, {"patient_id": patient_id})


# ---------------------------------------------------------------------------
# MEDICINES
# ---------------------------------------------------------------------------
def get_medicines() -> list:
    """Get all medicine records."""
    from models.medicine import Medicine

    return _safe_query(Medicine)


def search_medicines(query_text: str) -> list:
    """Search for specific medicines by name or category."""
    from models.medicine import Medicine

    session = _get_session()
    try:
        results = (
            session.query(Medicine).filter(
                Medicine.name.ilike(f"%{query_text}%") | Medicine.category.ilike(f"%{query_text}%")
            ).all()
        )
        logger.info("search_medicines for '%s': returned %d rows", query_text, len(results))
        return [m.to_dict() for m in results]
    except Exception as exc:
        logger.warning("search_medicines for '%s' failed: %s", query_text, exc)
        return []
    finally:
        session.close()


# ---------------------------------------------------------------------------
# FINANCE
# ---------------------------------------------------------------------------
def get_finance_records() -> list:
    """Get all finance records."""
    from models.finance import FinanceRecord

    return _safe_query(FinanceRecord)


# ---------------------------------------------------------------------------
# BEDS
# ---------------------------------------------------------------------------
def get_bed_status() -> list:
    """Get all bed records."""
    from models.bed import Bed

    return _safe_query(Bed)


# ---------------------------------------------------------------------------
# EQUIPMENT
# ---------------------------------------------------------------------------
def get_equipment() -> list:
    """Get all equipment records."""
    from models.equipment import Equipment

    return _safe_query(Equipment)


# ---------------------------------------------------------------------------
# EMERGENCY CASES
# ---------------------------------------------------------------------------
def get_emergency_cases() -> list:
    """Retrieve current emergency cases from available models."""
    from models.patient import Patient
    from models.appointment import Appointment
    from models.bed import Bed

    session = _get_session()
    try:
        # Approach 1: patients with status='emergency'
        try:
            patients = session.query(Patient).filter_by(status="emergency").all()
            if patients:
                logger.info("emergency: %d via Patient.status", len(patients))
                return [p.to_dict() for p in patients]
        except Exception as exc:
            logger.warning("emergency Patient.status failed: %s", exc)

        # Approach 2: appointments with status='emergency'
        try:
            appts = session.query(Appointment).filter_by(status="emergency").all()
            if appts:
                logger.info("emergency: %d via Appointment.status", len(appts))
                return [a.to_dict() for a in appts]
        except Exception as exc:
            logger.warning("emergency Appointment.status failed: %s", exc)

        # Approach 3: ICU beds that are occupied
        try:
            beds = session.query(Bed).filter_by(ward="ICU", status="occupied").all()
            if beds:
                logger.info("emergency: %d via Bed ICU occupied", len(beds))
                return [b.to_dict() for b in beds]
        except Exception as exc:
            logger.warning("emergency Bed ICU failed: %s", exc)

        logger.info("emergency: returned 0 rows")
        return []
    finally:
        session.close()


# ---------------------------------------------------------------------------
# DATABASE OPERATIONS (CREATE/UPDATE/DELETE)
# ---------------------------------------------------------------------------

def cancel_appointment_db(appointment_data: dict, patient_id: int) -> dict:
    """Cancel an appointment for a patient."""
    from models.appointment import Appointment

    session = _get_session()
    try:
        if not appointment_data or not appointment_data.get("id"):
            return {"status": "failure", "details": "Appointment ID required"}

        appt = session.query(Appointment).filter_by(id=appointment_data["id"], patient_id=patient_id).first()
        if not appt:
            return {"status": "failure", "details": "Appointment not found"}

        if appt.status == "cancelled":
            return {"status": "failure", "details": "Appointment already cancelled"}

        appt.status = "cancelled"
        session.commit()

        logger.info("cancel_appointment: cancelled appointment %d", appt.id)
        return {"status": "success", "details": f"Appointment with {appt.doctor_name} cancelled"}

    except Exception as exc:
        logger.error("cancel_appointment failed: %s", exc)
        session.rollback()
        return {"status": "failure", "details": str(exc)}
    finally:
        session.close()


def add_staff_db(staff_data: dict) -> dict:
    """Add a new staff member."""
    from models.staff import Staff

    session = _get_session()
    try:
        required_fields = ["name", "role", "department"]
        for field in required_fields:
            if not staff_data.get(field):
                return {"status": "failure", "details": f"Missing required field: {field}"}

        staff = Staff(
            name=staff_data["name"],
            role=staff_data["role"],
            department=staff_data["department"],
            specialization=staff_data.get("specialization"),
            shift=staff_data.get("shift", "morning"),
            status=staff_data.get("status", "active"),
            phone=staff_data.get("phone")
        )

        session.add(staff)
        session.commit()

        logger.info("add_staff: added staff %s", staff.name)
        return {"status": "success", "details": f"Staff member {staff.name} added successfully", "data": staff.to_dict()}

    except Exception as exc:
        logger.error("add_staff failed: %s", exc)
        session.rollback()
        return {"status": "failure", "details": str(exc)}
    finally:
        session.close()


def add_medicine_db(medicine_data: dict) -> dict:
    """Add a new medicine."""
    from models.medicine import Medicine

    session = _get_session()
    try:
        required_fields = ["name", "category", "stock", "unit_price"]
        for field in required_fields:
            if field not in medicine_data:
                return {"status": "failure", "details": f"Missing required field: {field}"}

        medicine = Medicine(
            name=medicine_data["name"],
            category=medicine_data["category"],
            manufacturer=medicine_data.get("manufacturer", ""),
            stock=medicine_data["stock"],
            unit_price=medicine_data["unit_price"],
            batch_number=medicine_data.get("batch_number", ""),
            expiry_date=medicine_data.get("expiry_date"),
            reorder_level=medicine_data.get("reorder_level", 10),
            supplier=medicine_data.get("supplier", "")
        )

        session.add(medicine)
        session.commit()

        logger.info("add_medicine: added medicine %s", medicine.name)
        return {"status": "success", "details": f"Medicine {medicine.name} added successfully", "data": medicine.to_dict()}

    except Exception as exc:
        logger.error("add_medicine failed: %s", exc)
        session.rollback()
        return {"status": "failure", "details": str(exc)}
    finally:
        session.close()


def update_medicine_db(medicine_id: int, medicine_data: dict) -> dict:
    """Update an existing medicine."""
    from models.medicine import Medicine

    session = _get_session()
    try:
        medicine = session.query(Medicine).get(medicine_id)
        if not medicine:
            return {"status": "failure", "details": "Medicine not found"}

        # Update fields if provided
        for field in ["name", "category", "manufacturer", "stock", "unit_price", "batch_number", "expiry_date", "reorder_level", "supplier"]:
            if field in medicine_data:
                setattr(medicine, field, medicine_data[field])

        session.commit()

        logger.info("update_medicine: updated medicine %s", medicine.name)
        return {"status": "success", "details": f"Medicine {medicine.name} updated successfully", "data": medicine.to_dict()}

    except Exception as exc:
        logger.error("update_medicine failed: %s", exc)
        session.rollback()
        return {"status": "failure", "details": str(exc)}
    finally:
        session.close()


def register_patient_db(patient_data: dict) -> dict:
    """Register a new patient."""
    from models.patient import Patient
    from models.user import User

    session = _get_session()
    try:
        required_fields = ["name", "email", "age", "gender"]
        for field in required_fields:
            if not patient_data.get(field):
                return {"status": "failure", "details": f"Missing required field: {field}"}

        # Create user account
        user = User(
            email=patient_data["email"],
            name=patient_data["name"],
            role="patient"
        )
        user.set_password("default123")  # Should be changed by user

        # Create patient record
        patient = Patient(
            user_id=None,  # Will be set after user is saved
            age=patient_data["age"],
            gender=patient_data["gender"],
            blood_group=patient_data.get("blood_group", "O+"),
            bmi=patient_data.get("bmi"),
            conditions=patient_data.get("conditions", ""),
            allergies=patient_data.get("allergies", ""),
            lifestyle=patient_data.get("lifestyle", ""),
            emergency_contact=patient_data.get("emergency_contact", "")
        )

        session.add(user)
        session.flush()  # Get user ID
        patient.user_id = user.id

        session.add(patient)
        session.commit()

        logger.info("register_patient: registered patient %s", patient_data["name"])
        return {"status": "success", "details": f"Patient {patient_data['name']} registered successfully", "data": {"user": user.to_dict(), "patient": patient.to_dict()}}

    except Exception as exc:
        logger.error("register_patient failed: %s", exc)
        session.rollback()
        return {"status": "failure", "details": str(exc)}
    finally:
        session.close()


def add_report_db(report_data: dict, patient_id: int) -> dict:
    """Add a medical report for a patient."""
    from models.report import Report

    session = _get_session()
    try:
        required_fields = ["doctor_name", "diagnosis"]
        for field in required_fields:
            if not report_data.get(field):
                return {"status": "failure", "details": f"Missing required field: {field}"}

        report = Report(
            patient_id=patient_id,
            doctor_name=report_data["doctor_name"],
            visit_date=report_data.get("visit_date"),
            diagnosis=report_data["diagnosis"],
            suggestions=report_data.get("suggestions", "")
        )

        session.add(report)
        session.commit()

        logger.info("add_report: added report for patient %d", patient_id)
        return {"status": "success", "details": "Medical report added successfully", "data": report.to_dict()}

    except Exception as exc:
        logger.error("add_report failed: %s", exc)
        session.rollback()
        return {"status": "failure", "details": str(exc)}
    finally:
        session.close()


def generate_bill_db(bill_data: dict, patient_id: int) -> dict:
    """Generate a bill for a patient."""
    from models.billing import Billing

    session = _get_session()
    try:
        if not bill_data.get("items"):
            return {"status": "failure", "details": "Bill items required"}

        # Calculate totals
        subtotal = sum(item.get("amount", 0) for item in bill_data["items"])
        tax_rate = bill_data.get("tax_rate", 0.18)  # 18% tax
        tax = subtotal * tax_rate
        discount = bill_data.get("discount", 0)
        total = subtotal + tax - discount

        bill = Billing(
            patient_id=patient_id,
            items=bill_data["items"],
            subtotal=subtotal,
            tax=tax,
            discount=discount,
            total=total,
            status="pending"
        )

        session.add(bill)
        session.commit()

        logger.info("generate_bill: created bill for patient %d, total: %.2f", patient_id, total)
        return {"status": "success", "details": f"Bill generated successfully. Total: ₹{total:.2f}", "data": bill.to_dict()}

    except Exception as exc:
        logger.error("generate_bill failed: %s", exc)
        session.rollback()
        return {"status": "failure", "details": str(exc)}
    finally:
        session.close()


# ---------------------------------------------------------------------------
