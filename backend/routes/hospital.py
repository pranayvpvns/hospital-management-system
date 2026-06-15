from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from extensions import get_db, get_current_user_id
from models.staff import Staff
from models.bed import Bed
from models.equipment import Equipment
from models.medicine import Medicine
from decorators import role_required
from models.user import User

hospital_router = APIRouter()


class StaffCreateRequest(BaseModel):
    name: str
    role: str = 'doctor'
    department: Optional[str] = None
    specialization: Optional[str] = None
    shift: str = 'Morning'
    phone: Optional[str] = None


class MedicineCreateRequest(BaseModel):
    name: str
    category: Optional[str] = None
    manufacturer: Optional[str] = None
    stock: int = 0
    unit_price: float = 0
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None
    reorder_level: int = 10
    supplier: Optional[str] = None


@hospital_router.get('/staff')
def get_staff(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    staff = db.query(Staff).all()
    return {'message': 'Staff fetched successfully', 'data': {'staff': [s.to_dict() for s in staff]}}


@hospital_router.get('/departments')
def get_departments(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    departments = db.query(Staff.department).filter(Staff.role == 'doctor').distinct().all()
    dept_list = [d[0] for d in departments if d[0]]
    if not dept_list:
        dept_list = ['Cardiology', 'Orthopedics', 'Neurology', 'Pediatrics', 'General Medicine']
    return {'message': 'Departments fetched successfully', 'data': {'departments': dept_list}}


@hospital_router.get('/doctors')
def get_doctors(department: Optional[str] = None, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    query = db.query(Staff).filter_by(role='doctor')
    if department:
        query = query.filter_by(department=department)
    return {'message': 'Doctors fetched successfully', 'data': {'doctors': [d.to_dict() for d in query.all()]}}


@hospital_router.get('/beds')
def get_beds(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    beds = db.query(Bed).all()
    return {'message': 'Beds fetched successfully', 'data': {'beds': [b.to_dict() for b in beds]}}


@hospital_router.post('/beds/assign')
def assign_bed(body: dict, user: User = Depends(role_required(['doctor'])), db: Session = Depends(get_db)):
    bed_id = body.get('bed_id')
    patient_id = body.get('patient_id')

    if not bed_id or not patient_id:
        raise HTTPException(status_code=400, detail='bed_id and patient_id are required')

    bed = db.query(Bed).get(bed_id)
    if not bed:
        raise HTTPException(status_code=404, detail='Bed not found')
    if bed.status != 'Available':
        raise HTTPException(status_code=400, detail='Bed is not available')

    bed.patient_id = patient_id
    bed.status = 'Occupied'
    db.commit()

    return {'message': 'Bed assigned successfully', 'data': {'bed': bed.to_dict()}}


@hospital_router.post('/beds/release')
def release_bed(body: dict, user: User = Depends(role_required(['doctor'])), db: Session = Depends(get_db)):
    bed_id = body.get('bed_id')

    if not bed_id:
        raise HTTPException(status_code=400, detail='bed_id is required')

    bed = db.query(Bed).get(bed_id)
    if not bed:
        raise HTTPException(status_code=404, detail='Bed not found')
    bed.patient_id = None
    bed.status = 'Available'
    db.commit()

    return {'message': 'Bed released successfully', 'data': {'bed': bed.to_dict()}}


@hospital_router.get('/equipment')
def get_equipment(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    equip = db.query(Equipment).all()
    return {'message': 'Equipment fetched successfully', 'data': {'equipment': [e.to_dict() for e in equip]}}


@hospital_router.post('/staff', status_code=201)
def create_staff(data: StaffCreateRequest, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    try:
        new_staff = Staff(
            name=data.name,
            role=data.role,
            department=data.department,
            specialization=data.specialization,
            shift=data.shift,
            phone=data.phone
        )
        db.add(new_staff)
        db.commit()
        return {'message': 'Staff added successfully', 'data': {'staff': new_staff.to_dict()}}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@hospital_router.put('/staff/{id}')
def update_staff(id: int, body: dict, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    staff = db.query(Staff).get(id)
    if not staff:
        raise HTTPException(status_code=404, detail='Staff not found')

    cancel_condition = None

    if 'name' in body: staff.name = body['name']
    if 'role' in body: staff.role = body['role']
    if 'department' in body: staff.department = body['department']
    if 'specialization' in body: staff.specialization = body['specialization']
    if 'shift' in body: staff.shift = body['shift']
    if 'phone' in body: staff.phone = body['phone']

    if 'status' in body:
        staff.status = body['status']
        if staff.status == 'inactive':
            cancel_condition = 'all'

    if 'unavailable_date' in body:
        if body['unavailable_date']:
            try:
                staff.unavailable_date = datetime.strptime(body['unavailable_date'], '%Y-%m-%d').date()
                cancel_condition = 'date'
            except ValueError:
                raise HTTPException(status_code=400, detail='Invalid date format, use YYYY-MM-DD')
        else:
            staff.unavailable_date = None

    if cancel_condition:
        from models.appointment import Appointment
        from models.notification import Notification
        from models.patient import Patient
        from sqlalchemy import func

        query = db.query(Appointment).filter(
            Appointment.status == 'scheduled',
            Appointment.doctor_name.contains(staff.name)
        )
        if cancel_condition == 'date' and staff.unavailable_date:
            query = query.filter(func.date(Appointment.date) == str(staff.unavailable_date))

        appts = query.all()
        for appt in appts:
            appt.status = 'cancelled'
            p = db.query(Patient).get(appt.patient_id)
            if p and p.user_id:
                date_str = str(appt.date)[:10] if appt.date else 'a recent date'
                notif = Notification(
                    user_id=p.user_id,
                    type='warning',
                    title='Appointment Cancelled',
                    message=f"Your appointment with Dr. {staff.name} on {date_str} has been cancelled due to doctor unavailability."
                )
                db.add(notif)

    db.commit()
    return {'message': 'Staff updated successfully', 'data': {'staff': staff.to_dict()}}


@hospital_router.get('/medicines')
def get_medicines(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    meds = db.query(Medicine).all()
    return {'message': 'Medicines fetched successfully', 'data': {'medicines': [m.to_dict() for m in meds]}}


@hospital_router.post('/medicines')
def add_medicine(data: MedicineCreateRequest, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    try:
        expiry_date = None
        if data.expiry_date:
            expiry_date = datetime.fromisoformat(data.expiry_date.replace('Z', '+00:00'))

        med = Medicine(
            name=data.name,
            category=data.category,
            manufacturer=data.manufacturer,
            stock=data.stock,
            unit_price=data.unit_price,
            batch_number=data.batch_number,
            expiry_date=expiry_date,
            reorder_level=data.reorder_level,
            supplier=data.supplier
        )
        db.add(med)
        db.commit()
        return {'message': 'Medicine added successfully', 'data': {'medicine': med.to_dict()}}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@hospital_router.post('/medicines/bulk')
async def bulk_add_medicines(file: UploadFile = File(...), user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail='Please upload a CSV file')

    try:
        import csv
        import io
        content = await file.read()
        stream = io.StringIO(content.decode("UTF8"), newline=None)
        reader = csv.DictReader(stream)

        added_count = 0
        for row in reader:
            expiry_date = None
            if row.get('expiry_date'):
                try:
                    expiry_date = datetime.fromisoformat(row['expiry_date'].replace('Z', '+00:00'))
                except:
                    pass

            med = Medicine(
                name=row.get('name'),
                category=row.get('category'),
                manufacturer=row.get('manufacturer'),
                stock=int(row.get('stock', 0)),
                unit_price=float(row.get('unit_price', 0)),
                batch_number=row.get('batch_number'),
                expiry_date=expiry_date,
                reorder_level=int(row.get('reorder_level', 10)),
                supplier=row.get('supplier')
            )
            db.add(med)
            added_count += 1

        db.commit()
        return {'message': f'Successfully imported {added_count} medicines', 'data': None}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@hospital_router.get('/medicines/low-stock')
def get_low_stock_medicines(user: User = Depends(role_required(['doctor'])), db: Session = Depends(get_db)):
    meds = db.query(Medicine).filter(Medicine.stock < 100).all()
    return {'message': 'Low stock medicines fetched', 'data': {'medicines': [m.to_dict() for m in meds]}}


@hospital_router.put('/medicines/{id}')
def update_medicine(id: int, body: dict, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    med = db.query(Medicine).get(id)
    if not med:
        raise HTTPException(status_code=404, detail='Medicine not found')
    try:
        if 'name' in body: med.name = body['name']
        if 'category' in body: med.category = body['category']
        if 'manufacturer' in body: med.manufacturer = body['manufacturer']
        if 'stock' in body: med.stock = body['stock']
        if 'unit_price' in body: med.unit_price = body['unit_price']
        if 'batch_number' in body: med.batch_number = body['batch_number']
        if 'reorder_level' in body: med.reorder_level = body['reorder_level']
        if 'supplier' in body: med.supplier = body['supplier']
        if 'expiry_date' in body and body['expiry_date']:
            med.expiry_date = datetime.fromisoformat(body['expiry_date'].replace('Z', '+00:00'))

        db.commit()
        return {'message': 'Medicine updated successfully', 'data': {'medicine': med.to_dict()}}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@hospital_router.put('/beds/{id}')
def update_bed(id: int, body: dict, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    bed = db.query(Bed).get(id)
    if not bed:
        raise HTTPException(status_code=404, detail='Bed not found')
    if 'status' in body:
        bed.status = body['status']
    db.commit()
    return {'message': 'Bed updated successfully', 'data': {'bed': bed.to_dict()}}


@hospital_router.put('/equipment/{id}')
def update_equipment(id: int, body: dict, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    equip = db.query(Equipment).get(id)
    if not equip:
        raise HTTPException(status_code=404, detail='Equipment not found')
    if 'status' in body:
        equip.status = body['status']
    db.commit()
    return {'message': 'Equipment updated successfully', 'data': {'equipment': equip.to_dict()}}


@hospital_router.get('/medicines/expiring')
def get_expiring_medicines(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    from datetime import timedelta
    cutoff = datetime.utcnow() + timedelta(days=90)
    meds = db.query(Medicine).filter(
        Medicine.expiry_date != None,
        Medicine.expiry_date <= cutoff
    ).all()
    return {'message': 'Expiring medicines fetched', 'data': {'medicines': [m.to_dict() for m in meds]}}
