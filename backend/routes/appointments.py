from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from extensions import get_db, get_current_user_id
from models.appointment import Appointment
from models.patient import Patient
from models.user import User
from models.staff import Staff
from models.notification import Notification
from decorators import role_required

appointments_router = APIRouter()


class AppointmentCreateRequest(BaseModel):
    patient_id: Optional[int] = None
    doctor_name: Optional[str] = None
    department: Optional[str] = None
    date: Optional[str] = None
    time_slot: str = '10:00 AM'
    notes: str = ''


@appointments_router.get('/slots')
def get_slots(doctor_id: int, date: str, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not doctor_id or not date:
        raise HTTPException(status_code=400, detail='doctor_id and date are required')

    doctor = db.query(Staff).get(doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail='Doctor not found')

    if doctor.status == 'inactive':
        return {'message': 'Doctor is currently unavailable', 'data': {'slots': []}}
    if doctor.unavailable_date and str(doctor.unavailable_date) == date:
        return {'message': 'Doctor is unavailable on this date', 'data': {'slots': []}}

    all_slots = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM']

    booked = db.query(Appointment).filter(
        or_(
            Appointment.doctor_name == doctor.name,
            Appointment.doctor_name == f"Dr. {doctor.name}",
            Appointment.doctor_name.contains(doctor.name)
        ),
        func.date(Appointment.date) == date,
        Appointment.status != 'cancelled'
    ).all()

    booked_slots = [b.time_slot for b in booked]
    available_slots = [s for s in all_slots if s not in booked_slots]

    return {'message': 'Slots fetched successfully', 'data': {'slots': available_slots}}


@appointments_router.get('/all')
def get_appointments_all(user: User = Depends(role_required(['doctor'])), db: Session = Depends(get_db)):
    appointments = db.query(Appointment).order_by(Appointment.date.desc()).all()
    return {'message': 'Appointments fetched successfully', 'data': {'appointments': [a.to_dict() for a in appointments]}}


@appointments_router.get('/')
def get_appointments_mine(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter_by(user_id=user_id).first()
    if not patient:
        return {'message': 'Patient profile not found', 'data': {'appointments': []}}
    appointments = db.query(Appointment).filter_by(patient_id=patient.id).order_by(Appointment.date.desc()).all()
    return {'message': 'Appointments fetched successfully', 'data': {'appointments': [a.to_dict() for a in appointments]}}


@appointments_router.post('/', status_code=201)
def create_appointment(data: AppointmentCreateRequest, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(User).get(user_id)

    patient_id = data.patient_id
    if user.role == 'patient':
        patient = db.query(Patient).filter_by(user_id=user_id).first()
        if not patient:
            patient = Patient(user_id=user.id)
            db.add(patient)
            db.commit()
        patient_id = patient.id
    elif not patient_id:
        raise HTTPException(status_code=400, detail='patient_id is required')

    date_obj = None
    if data.date:
        date_obj = datetime.strptime(data.date, '%Y-%m-%d').date()

    appt = Appointment(
        patient_id=patient_id,
        doctor_name=data.doctor_name,
        department=data.department,
        date=date_obj,
        time_slot=data.time_slot,
        notes=data.notes
    )
    db.add(appt)

    # Generate notification
    if user.role == 'patient':
        notif = Notification(
            user_id=user.id,
            type='success',
            title='Appointment Confirmed',
            message=f"Your appointment with {data.doctor_name} on {data.date} at {data.time_slot} is confirmed."
        )
        db.add(notif)
    elif patient_id:
        p = db.query(Patient).get(patient_id)
        if p and p.user_id:
            notif = Notification(
                user_id=p.user_id,
                type='success',
                title='Appointment Scheduled',
                message=f"An appointment was scheduled with {data.doctor_name} on {data.date} at {data.time_slot}."
            )
            db.add(notif)

    db.commit()
    return {'message': 'Appointment booked', 'data': {'appointment': appt.to_dict()}}


@appointments_router.put('/{aid}/cancel')
def cancel_appointment(aid: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(User).get(user_id)
    appt = db.query(Appointment).get(aid)
    if not appt:
        raise HTTPException(status_code=404, detail='Appointment not found')

    if user.role == 'patient':
        patient = db.query(Patient).filter_by(user_id=user_id).first()
        if not patient or appt.patient_id != patient.id:
            raise HTTPException(status_code=403, detail='Access forbidden')

        notif = Notification(
            user_id=user.id,
            type='warning',
            title='Appointment Cancelled',
            message=f"Your appointment with {appt.doctor_name} has been cancelled."
        )
        db.add(notif)
    else:
        p = db.query(Patient).get(appt.patient_id)
        if p and p.user_id:
            notif = Notification(
                user_id=p.user_id,
                type='warning',
                title='Appointment Cancelled',
                message=f"Your appointment with {appt.doctor_name} was cancelled by the hospital."
            )
            db.add(notif)

    appt.status = 'cancelled'
    db.commit()
    return {'message': 'Appointment cancelled', 'data': {'appointment': appt.to_dict()}}
