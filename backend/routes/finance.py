from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from extensions import get_db, get_current_user_id
from models.finance import FinanceRecord

finance_router = APIRouter()


@finance_router.get('/summary')
def get_summary(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    total_rev = db.query(func.sum(FinanceRecord.amount)).filter_by(record_type='revenue').scalar() or 0
    total_exp = db.query(func.sum(FinanceRecord.amount)).filter_by(record_type='expense').scalar() or 0
    # Monthly data
    records = db.query(
        func.strftime('%Y-%m', FinanceRecord.date).label('month'),
        FinanceRecord.record_type,
        func.sum(FinanceRecord.amount).label('total')
    ).group_by('month', FinanceRecord.record_type).order_by('month').all()
    month_data = {}
    for m, rtype, total in records:
        if m not in month_data:
            month_data[m] = {'month': m, 'revenue': 0, 'expense': 0, 'profit': 0}
        month_data[m][rtype] = round(total, 2)
    for m in month_data.values():
        m['profit'] = round(m['revenue'] - m['expense'], 2)
    monthly = list(month_data.values())[-6:]
    return {'total_revenue': round(total_rev, 2), 'total_expense': round(total_exp, 2),
            'net_profit': round(total_rev - total_exp, 2), 'monthly': monthly}


@finance_router.get('/department-analytics')
def department_analytics(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    results = db.query(
        FinanceRecord.department,
        func.sum(FinanceRecord.amount).label('revenue')
    ).filter_by(record_type='revenue').group_by(FinanceRecord.department).all()
    departments = [{'department': d, 'revenue': round(r, 2)} for d, r in results]
    return {'departments': departments}


@finance_router.get('/records')
def get_records(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    records = db.query(FinanceRecord).order_by(FinanceRecord.date.desc()).all()
    return {'records': [r.to_dict() for r in records]}


@finance_router.post('/records')
def add_record(body: dict, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    record = FinanceRecord(
        record_type=body.get('record_type', 'revenue'),
        category=body.get('category', ''),
        amount=body.get('amount', 0),
        department=body.get('department', ''),
        description=body.get('description', '')
    )
    db.add(record)
    db.commit()
    return {'message': 'Record added', 'data': {'record': record.to_dict()}}
