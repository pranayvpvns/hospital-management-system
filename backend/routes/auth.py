from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from extensions import get_db, create_access_token, get_current_user_id
from models.user import User

auth_router = APIRouter()


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ''
    role: str = 'patient'
    department: Optional[str] = None
    specialization: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class SwitchRoleRequest(BaseModel):
    role: str = 'patient'


@auth_router.post('/register', status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter_by(email=data.email).first():
        raise HTTPException(status_code=400, detail='Email already exists')
    user = User(email=data.email, name=data.name, role=data.role)
    user.set_password(data.password)
    db.add(user)
    db.commit()
    db.refresh(user)

    if user.role == 'patient':
        from models.patient import Patient
        patient = Patient(user_id=user.id)
        db.add(patient)
        db.commit()
    elif user.role in ['doctor', 'admin']:
        from models.staff import Staff
        # Create a staff record linked to this user
        staff = Staff(
            user_id=user.id,
            name=user.name,
            role=user.role,
            department=data.department,
            specialization=data.specialization
        )
        db.add(staff)
        db.commit()

    token = create_access_token(user.id)
    return {'message': 'Registration successful', 'token': token, 'user': user.to_dict(), 'data': {'token': token, 'user': user.to_dict()}}


@auth_router.post('/login')
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(email=data.email).first()
    print(f"DEBUG LOGIN: email={data.email}, user_found={user is not None}")
    if user:
        pwd_check = user.check_password(data.password)
        print(f"DEBUG LOGIN: password_check={pwd_check}")
    
    if not user or not user.check_password(data.password):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    token = create_access_token(identity=str(user.id))

    # Keeping top-level token and user for aggressive frontend compatibility,
    # but adhering to standard format too.
    return {'message': 'Login successful', 'token': token, 'user': user.to_dict(),
            'data': {'token': token, 'user': user.to_dict()}}


@auth_router.get('/me')
def me(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    return {'message': 'User fetched successfully', 'data': {'user': user.to_dict()}}

@auth_router.delete('/me')
def delete_account(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    
    # Delete associated records
    if user.role == 'patient':
        from models.patient import Patient
        from models.hospital import Appointment
        patient = db.query(Patient).filter_by(user_id=user.id).first()
        if patient:
            db.query(Appointment).filter_by(patient_id=patient.id).delete()
            db.delete(patient)
    elif user.role in ['doctor', 'admin']:
        from models.staff import Staff
        from models.hospital import Appointment
        staff = db.query(Staff).filter_by(user_id=user.id).first()
        if staff:
            db.query(Appointment).filter_by(doctor_id=staff.id).delete()
            db.delete(staff)

    db.delete(user)
    db.commit()
    return {'message': 'Account deleted successfully'}


@auth_router.post('/switch-role')
def switch_role(data: SwitchRoleRequest, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    if data.role in ['patient', 'doctor', 'admin']:
        user.role = data.role
        db.commit()
        return {'message': f'Role switched to {data.role}', 'data': {'user': user.to_dict()}}
    raise HTTPException(status_code=400, detail='Invalid role')
