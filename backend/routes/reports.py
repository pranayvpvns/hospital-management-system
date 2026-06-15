from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func

from extensions import get_db, get_current_user_id
from models.report import Report
from models.user import User
from models.patient import Patient

reports_router = APIRouter()


@reports_router.get('/')
def get_reports(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(User).get(user_id)

    if user.role == 'patient':
        patient = db.query(Patient).filter_by(user_id=user.id).first()
        if not patient:
            return {'message': 'Patient profile not found', 'data': {'reports': []}}
        reports = db.query(Report).filter_by(patient_id=patient.id).all()
    elif user.role in ['doctor', 'admin']:
        reports = db.query(Report).filter_by(doctor_name=user.name).all()
    else:
        reports = db.query(Report).all()

    return {
        'message': 'Reports fetched successfully',
        'data': {'reports': [r.to_dict() for r in reports]}
    }


@reports_router.post('/')
def add_report(body: dict, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    new_report = Report(
        patient_id=body.get('patient_id'),
        doctor_name=body.get('doctor_name'),
        visit_date=sa_func.current_timestamp(),
        diagnosis=body.get('diagnosis'),
        suggestions=body.get('suggestions')
    )
    db.add(new_report)
    db.commit()
    return {
        'message': 'Report added successfully',
        'data': {'report': new_report.to_dict()}
    }


@reports_router.put('/{id}')
def update_report(id: int, body: dict, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(User).get(user_id)
    if user.role == 'patient':
        raise HTTPException(status_code=403, detail='Access forbidden')

    report = db.query(Report).get(id)
    if not report:
        raise HTTPException(status_code=404, detail='Report not found')

    if 'doctor_name' in body:
        report.doctor_name = body['doctor_name']
    if 'diagnosis' in body:
        report.diagnosis = body['diagnosis']
    if 'suggestions' in body:
        report.suggestions = body['suggestions']
    if 'patient_id' in body:
        report.patient_id = body['patient_id']

    db.commit()
    return {
        'message': 'Report updated successfully',
        'data': {'report': report.to_dict()}
    }
