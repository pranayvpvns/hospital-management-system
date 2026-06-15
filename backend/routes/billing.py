from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import json

from extensions import get_db, get_current_user_id
from models.billing import Billing
from models.patient import Patient
from models.user import User
from decorators import role_required

billing_router = APIRouter()


class BillItem(BaseModel):
    name: str = ''
    rate: float = 0
    quantity: int = 1


class GenerateBillRequest(BaseModel):
    patient_id: int
    items: list[dict] = []
    discount: float = 0


@billing_router.get('/all')
def get_billings_all(user: User = Depends(role_required(['doctor', 'admin'])), db: Session = Depends(get_db)):
    billings = db.query(Billing).order_by(Billing.created_at.desc()).all()
    return {'message': 'All billings fetched', 'data': {'billings': [b.to_dict() for b in billings]}}


@billing_router.get('/')
def get_billings_mine(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter_by(user_id=user_id).first()
    if not patient:
        return {'message': 'Patient profile not found', 'data': {'billings': []}}
    billings = db.query(Billing).filter_by(patient_id=patient.id).order_by(Billing.created_at.desc()).all()
    return {'message': 'My billings fetched', 'data': {'billings': [b.to_dict() for b in billings]}}


@billing_router.post('/generate', status_code=201)
def generate_bill(data: GenerateBillRequest, user: User = Depends(role_required(['doctor', 'admin'])), db: Session = Depends(get_db)):
    if not data.patient_id:
        raise HTTPException(status_code=400, detail='patient_id is required')

    patient = db.query(Patient).get(data.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail='Patient not found')

    subtotal = sum(i.get('rate', 0) * i.get('quantity', 1) for i in data.items)
    tax = subtotal * 0.05
    discount = data.discount
    total = subtotal + tax - discount
    bill = Billing(
        patient_id=data.patient_id,
        items=json.dumps(data.items),
        subtotal=round(subtotal, 2),
        tax=round(tax, 2),
        discount=round(discount, 2),
        total=round(total, 2)
    )
    db.add(bill)
    db.commit()
    return {'message': 'Bill generated successfully', 'data': {'billing': bill.to_dict()}}


@billing_router.get('/{id}')
def get_billing_by_id(id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    bill = db.query(Billing).get(id)
    if not bill:
        raise HTTPException(status_code=404, detail='Billing not found')
    return {'message': 'Billing fetched', 'data': {'billing': bill.to_dict()}}
