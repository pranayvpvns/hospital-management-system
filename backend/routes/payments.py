from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from extensions import get_db, get_current_user_id
from models.payment import Payment
from models.billing import Billing
from models.finance import FinanceRecord
from models.patient import Patient
from models.user import User
from decorators import role_required

payments_router = APIRouter()


class ProcessPaymentRequest(BaseModel):
    billing_id: int
    method: str = 'cash'


@payments_router.post('/process')
def process_payment(data: ProcessPaymentRequest, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    billing = db.query(Billing).get(data.billing_id)
    if not billing:
        raise HTTPException(status_code=404, detail='Billing not found')

    # Ownership Validation
    user = db.query(User).get(user_id)
    if user.role == 'patient':
        patient = db.query(Patient).filter_by(user_id=user_id).first()
        if not patient or billing.patient_id != patient.id:
            raise HTTPException(status_code=403, detail='Access forbidden')

    if billing.status == 'paid':
        raise HTTPException(status_code=400, detail='Bill is already paid')

    payment = Payment(billing_id=billing.id, amount=billing.total, method=data.method)
    billing.status = 'paid'
    # Create finance record
    fr = FinanceRecord(record_type='revenue', category='patient_payment',
                       amount=billing.total, department='Billing',
                       description=f'Payment for bill #{billing.id}')
    db.add(payment)
    db.add(fr)
    db.commit()
    return {'message': 'Payment processed successfully', 'data': {'payment': payment.to_dict()}}


@payments_router.get('/')
def get_payments(user: User = Depends(role_required(['admin'])), db: Session = Depends(get_db)):
    payments = db.query(Payment).order_by(Payment.created_at.desc()).all()
    return {'message': 'Payments fetched successfully', 'data': {'payments': [p.to_dict() for p in payments]}}


@payments_router.get('/{id}')
def get_payment_by_id(id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    payment = db.query(Payment).get(id)
    if not payment:
        raise HTTPException(status_code=404, detail='Payment not found')
    return {'message': 'Payment fetched', 'data': {'payment': payment.to_dict()}}


@payments_router.get('/billing/{billing_id}')
def get_payments_for_bill(billing_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    payments = db.query(Payment).filter_by(billing_id=billing_id).all()
    return {'message': 'Payments fetched', 'data': {'payments': [p.to_dict() for p in payments]}}
