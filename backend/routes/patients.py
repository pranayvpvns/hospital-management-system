from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from extensions import get_db, get_current_user_id
from models.patient import Patient
from models.user import User
from models.notification import Notification
from models.appointment import Appointment
from decorators import role_required, get_current_user

patients_router = APIRouter()


class PatientRegisterRequest(BaseModel):
    email: str
    name: str = ''
    password: str = 'patient123'
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    dob: Optional[str] = None
    bmi: Optional[float] = None
    allergies: Optional[str] = None
    emergency_contact: Optional[str] = None


class PatientUpdateRequest(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    dob: Optional[str] = None
    age: Optional[int] = None
    bmi: Optional[float] = None
    allergies: Optional[str] = None
    emergency_contact: Optional[str] = None


@patients_router.get('/all')
def get_patients(user: User = Depends(role_required(['doctor', 'admin'])), db: Session = Depends(get_db)):
    if user.role in ['doctor', 'admin']:
        patients = db.query(Patient).join(Appointment).filter(Appointment.doctor_name == user.name).distinct().all()
    else:
        patients = db.query(Patient).all()
    return {'message': 'Patients fetched successfully', 'data': {'patients': [p.to_dict() for p in patients]}}


@patients_router.post('/register', status_code=201)
def register_patient(data: PatientRegisterRequest, user: User = Depends(role_required(['doctor'])), db: Session = Depends(get_db)):
    if not data.email:
        raise HTTPException(status_code=400, detail='Email is required')

    if db.query(User).filter_by(email=data.email).first():
        raise HTTPException(status_code=400, detail='Email already exists')

    try:
        new_user = User(email=data.email, name=data.name, role='patient')
        new_user.set_password(data.password)
        db.add(new_user)
        db.flush()  # get user.id

        patient = Patient(
            user_id=new_user.id,
            age=data.age,
            gender=data.gender,
            blood_group=data.blood_group,
            dob=data.dob,
            bmi=data.bmi,
            allergies=data.allergies,
            emergency_contact=data.emergency_contact
        )
        db.add(patient)
        db.commit()
        return {'message': 'Patient registered successfully', 'data': {'patient': patient.to_dict()}}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@patients_router.get('/profile')
def my_profile(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter_by(user_id=user_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail='Profile not found')
    return {'message': 'Profile fetched successfully', 'data': {'patient': patient.to_dict()}}


@patients_router.get('/full-profile')
def my_full_profile(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter_by(user_id=user_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail='Profile not found')
    return {'message': 'Full profile fetched successfully', 'data': {'patient': patient.to_dict()}}


@patients_router.put('/profile')
def update_my_profile(data: PatientUpdateRequest, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter_by(user_id=user_id).first()

    # Auto-create patient record if it doesn't exist
    if not patient:
        patient = Patient(user_id=user_id)
        db.add(patient)

    update_data = data.model_dump(exclude_unset=True)

    # Update allowed fields
    allowed_fields = ['gender', 'blood_group', 'dob', 'age', 'bmi', 'allergies', 'emergency_contact']
    for key in allowed_fields:
        if key in update_data:
            setattr(patient, key, update_data[key])

    # Also allow updating user name
    if 'name' in update_data:
        user = db.query(User).get(user_id)
        if user:
            user.name = update_data['name']

    # Notify user about profile update
    notif = Notification(
        user_id=user_id,
        type='info',
        title='Profile Updated',
        message='Your personal information has been successfully updated.'
    )
    db.add(notif)

    db.commit()
    return {'message': 'Profile updated successfully', 'data': {'patient': patient.to_dict()}}


@patients_router.put('/{id}')
def update_patient(id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db), body: dict = {}):
    patient = db.query(Patient).get(id)
    if not patient:
        raise HTTPException(status_code=404, detail='Patient not found')

    # Check ownership
    user = db.query(User).get(user_id)
    if user.role == 'patient' and patient.user_id != user_id:
        raise HTTPException(status_code=403, detail='Access forbidden')

    # Allow admin/doctor to update user name
    if 'name' in body and patient.user:
        patient.user.name = body['name']

    for key, value in body.items():
        if hasattr(patient, key) and key not in ['id', 'user_id', 'created_at', 'name', 'email']:
            setattr(patient, key, value)

    db.commit()
    return {'message': 'Patient updated successfully', 'data': {'patient': patient.to_dict()}}


@patients_router.delete('/{id}')
def delete_patient(id: int, user: User = Depends(role_required(['admin'])), db: Session = Depends(get_db)):
    patient = db.query(Patient).get(id)
    if not patient:
        raise HTTPException(status_code=404, detail='Patient not found')
    db.delete(patient)
    db.commit()
    return {'message': 'Patient deleted successfully', 'data': None}
