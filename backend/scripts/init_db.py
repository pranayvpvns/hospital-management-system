"""Database initialization and seed script."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import create_app
from extensions import db
from models.user import User
from models.patient import Patient
from models.appointment import Appointment
from models.staff import Staff
from models.bed import Bed
from models.equipment import Equipment
from models.medicine import Medicine
from models.billing import Billing
from models.payment import Payment
from models.finance import FinanceRecord
from datetime import datetime, timedelta
import json
import random


def seed_data():
    app = create_app()
    with app.app_context():
        print("🗑️  Dropping all tables...")
        db.drop_all()
        print("📦 Creating all tables...")
        db.create_all()

        # --- Users ---
        print("👤 Seeding users...")
        admin = User(email='admin@mnh.com', name='Dr. Admin Kumar', role='admin')
        admin.set_password('admin123')
        db.session.add(admin)

        doctor1 = User(email='doctor@mnh.com', name='Dr. Priya Sharma', role='doctor')
        doctor1.set_password('doctor123')
        db.session.add(doctor1)

        patients_data = [
            ('Rahul Verma', 'rahul@email.com', 28, 'male', 'B+', 23.5),
            ('Sneha Patel', 'sneha@email.com', 35, 'female', 'O+', 26.1),
            ('Amit Singh', 'amit@email.com', 45, 'male', 'A+', 29.3),
            ('Priya Reddy', 'priya@email.com', 32, 'female', 'AB+', 22.8),
            ('Vikram Joshi', 'vikram@email.com', 55, 'male', 'O-', 27.6),
        ]

        patient_objs = []
        for name, email, age, gender, bg, bmi in patients_data:
            u = User(email=email, name=name, role='patient')
            u.set_password('patient123')
            db.session.add(u)
            db.session.flush()
            p = Patient(user_id=u.id, age=age, gender=gender, blood_group=bg, bmi=bmi,
                        conditions=json.dumps(random.sample(['Diabetes', 'Hypertension', 'Asthma', 'None'], 2)),
                        lifestyle=json.dumps({'exercise': random.choice(['daily', 'weekly', 'rarely']),
                                              'smoking': random.choice([True, False]),
                                              'alcohol': random.choice(['none', 'occasional', 'regular'])}),
                        emergency_contact=f'+91 98765{random.randint(10000, 99999)}')
            db.session.add(p)
            patient_objs.append(p)

        db.session.flush()

        # --- Staff ---
        print("🏥 Seeding staff...")
        staff_data = [
            ('Dr. Priya Sharma', 'doctor', 'Cardiology', 'Interventional Cardiology', 'morning'),
            ('Dr. Rajesh Gupta', 'doctor', 'Orthopedics', 'Joint Replacement', 'morning'),
            ('Dr. Aishwarya Nair', 'doctor', 'Neurology', 'Neurological Surgery', 'afternoon'),
            ('Dr. Sanjay Mehta', 'doctor', 'Pediatrics', 'Neonatal Care', 'morning'),
            ('Dr. Kavitha Rao', 'doctor', 'General Medicine', 'Internal Medicine', 'afternoon'),
            ('Nurse Anita Kumari', 'nurse', 'Emergency', None, 'morning'),
            ('Nurse Deepak Pandey', 'nurse', 'ICU', None, 'night'),
            ('Nurse Fatima Khan', 'nurse', 'General Ward', None, 'afternoon'),
            ('Nurse Ravi Teja', 'nurse', 'Pediatrics', None, 'morning'),
            ('Tech Suresh Kumar', 'technician', 'Radiology', 'MRI/CT Scan', 'morning'),
            ('Tech Meera Das', 'technician', 'Laboratory', 'Pathology', 'morning'),
            ('Admin Pooja Iyer', 'admin', 'Front Office', None, 'morning'),
        ]
        for name, role, dept, spec, shift in staff_data:
            s = Staff(name=name, role=role, department=dept, specialization=spec, shift=shift)
            db.session.add(s)

        # --- Beds ---
        print("🛏️  Seeding beds...")
        wards = [('General Ward A', 'general', 1), ('General Ward B', 'general', 1),
                 ('ICU', 'icu', 2), ('Private Ward', 'private', 3),
                 ('Semi-Private', 'semi-private', 2), ('Pediatric Ward', 'general', 1)]
        bed_id = 0
        for ward, bed_type, floor in wards:
            for i in range(1, 9):
                bed_id += 1
                status = random.choice(['available', 'available', 'occupied', 'available'])
                patient_id = None
                admitted_at = None
                if status == 'occupied' and patient_objs:
                    p = random.choice(patient_objs)
                    patient_id = p.id
                    admitted_at = datetime.utcnow() - timedelta(days=random.randint(1, 5))
                b = Bed(ward=ward, bed_number=f'BED-{bed_id}', floor=floor,
                        bed_type=bed_type, status=status, patient_id=patient_id,
                        daily_rate=random.choice([500, 1000, 2000, 3500, 5000]),
                        admitted_at=admitted_at)
                db.session.add(b)

        # --- Equipment ---
        print("🔧 Seeding equipment...")
        equipment_data = [
            ('MRI Machine', 'Imaging', 'Radiology', 15000000),
            ('CT Scanner', 'Imaging', 'Radiology', 12000000),
            ('X-Ray Machine', 'Imaging', 'Radiology', 3000000),
            ('Ventilator', 'Life Support', 'ICU', 800000),
            ('Defibrillator', 'Emergency', 'Emergency', 250000),
            ('ECG Machine', 'Diagnostic', 'Cardiology', 150000),
            ('Ultrasound', 'Imaging', 'OB-GYN', 2000000),
            ('Blood Analyzer', 'Laboratory', 'Laboratory', 500000),
            ('Autoclave', 'Sterilization', 'OT', 100000),
            ('Patient Monitor', 'Monitoring', 'ICU', 300000),
        ]
        for name, cat, dept, cost in equipment_data:
            e = Equipment(name=name, category=cat, department=dept,
                          status=random.choice(['operational', 'operational', 'maintenance']),
                          serial_number=f'EQ-{random.randint(10000, 99999)}',
                          purchase_date=datetime.utcnow() - timedelta(days=random.randint(100, 1000)),
                          last_maintenance=datetime.utcnow() - timedelta(days=random.randint(10, 90)),
                          next_maintenance=datetime.utcnow() + timedelta(days=random.randint(30, 180)),
                          cost=cost)
            db.session.add(e)

        # --- Medicines ---
        print("💊 Seeding medicines...")
        medicines_data = [
            ('Paracetamol 500mg', 'Analgesic', 'Sun Pharma', 200, 5.50, 180),
            ('Amoxicillin 250mg', 'Antibiotic', 'Cipla', 150, 12.00, 120),
            ('Metformin 500mg', 'Anti-diabetic', 'Dr. Reddys', 300, 8.00, 240),
            ('Amlodipine 5mg', 'Antihypertensive', 'Lupin', 250, 6.50, 300),
            ('Omeprazole 20mg', 'Antacid', 'Zydus', 180, 9.00, 150),
            ('Cetirizine 10mg', 'Antihistamine', 'Sun Pharma', 100, 4.00, 90),
            ('Azithromycin 500mg', 'Antibiotic', 'Cipla', 80, 25.00, 60),
            ('Insulin Glargine', 'Anti-diabetic', 'Novo Nordisk', 50, 450.00, 45),
            ('Ibuprofen 400mg', 'NSAID', 'Abbott', 300, 7.00, 200),
            ('Clopidogrel 75mg', 'Antiplatelet', 'Torrent', 120, 15.00, 160),
            ('Salbutamol Inhaler', 'Bronchodilator', 'Cipla', 5, 180.00, 20),
            ('Dexamethasone 4mg', 'Steroid', 'Zydus', 90, 12.00, 100),
        ]
        for name, cat, mfg, stock, price, expiry_days in medicines_data:
            m = Medicine(name=name, category=cat, manufacturer=mfg, stock=stock,
                         unit_price=price, batch_number=f'BN-{random.randint(1000, 9999)}',
                         expiry_date=datetime.utcnow() + timedelta(days=expiry_days),
                         reorder_level=random.randint(10, 30), supplier=f'{mfg} Distributors')
            db.session.add(m)

        # --- Appointments ---
        print("📅 Seeding appointments...")
        departments = ['Cardiology', 'Orthopedics', 'Neurology', 'Pediatrics', 'General Medicine']
        doctors = ['Dr. Priya Sharma', 'Dr. Rajesh Gupta', 'Dr. Aishwarya Nair', 'Dr. Sanjay Mehta', 'Dr. Kavitha Rao']
        time_slots = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM']
        for p in patient_objs:
            for _ in range(random.randint(1, 3)):
                idx = random.randint(0, len(departments) - 1)
                a = Appointment(
                    patient_id=p.id,
                    doctor_name=doctors[idx],
                    department=departments[idx],
                    date=datetime.utcnow() + timedelta(days=random.randint(-10, 10)),
                    time_slot=random.choice(time_slots),
                    status=random.choice(['scheduled', 'completed', 'scheduled'])
                )
                db.session.add(a)

        db.session.flush()

        # --- Billing ---
        print("💳 Seeding billing records...")
        service_items = [
            {'name': 'Consultation', 'category': 'consultation', 'rate': 500, 'quantity': 1},
            {'name': 'Blood Test - CBC', 'category': 'test', 'rate': 350, 'quantity': 1},
            {'name': 'X-Ray', 'category': 'test', 'rate': 800, 'quantity': 1},
            {'name': 'ECG', 'category': 'test', 'rate': 600, 'quantity': 1},
            {'name': 'General Ward Bed (per day)', 'category': 'bed', 'rate': 1000, 'quantity': 3},
            {'name': 'Paracetamol 500mg', 'category': 'medicine', 'rate': 5.50, 'quantity': 10},
        ]
        for p in patient_objs:
            items = random.sample(service_items, random.randint(2, 5))
            subtotal = sum(i['rate'] * i['quantity'] for i in items)
            tax = subtotal * 0.05
            total = subtotal + tax
            bill = Billing(patient_id=p.id, items=json.dumps(items),
                           subtotal=round(subtotal, 2), tax=round(tax, 2),
                           total=round(total, 2),
                           status=random.choice(['pending', 'paid', 'paid']))
            db.session.add(bill)

        db.session.flush()

        # --- Finance Records ---
        print("📊 Seeding finance records...")
        rev_cats = ['patient_payment', 'insurance', 'lab_fees', 'pharmacy_sales']
        exp_cats = ['salaries', 'equipment', 'utilities', 'supplies', 'maintenance']
        dept_list = ['Cardiology', 'Orthopedics', 'General Medicine', 'Emergency', 'Laboratory', 'Pharmacy']

        for i in range(60):
            date = datetime.utcnow() - timedelta(days=i)
            # Revenue entries
            for _ in range(random.randint(2, 5)):
                fr = FinanceRecord(
                    record_type='revenue', category=random.choice(rev_cats),
                    amount=round(random.uniform(5000, 50000), 2),
                    department=random.choice(dept_list),
                    description='Auto-generated revenue record', date=date)
                db.session.add(fr)
            # Expense entries
            for _ in range(random.randint(1, 3)):
                fr = FinanceRecord(
                    record_type='expense', category=random.choice(exp_cats),
                    amount=round(random.uniform(2000, 30000), 2),
                    department=random.choice(dept_list),
                    description='Auto-generated expense record', date=date)
                db.session.add(fr)

        db.session.commit()
        print("✅ Database seeded successfully!")
        print(f"   - Users: {User.query.count()}")
        print(f"   - Patients: {Patient.query.count()}")
        print(f"   - Staff: {Staff.query.count()}")
        print(f"   - Beds: {Bed.query.count()}")
        print(f"   - Equipment: {Equipment.query.count()}")
        print(f"   - Medicines: {Medicine.query.count()}")
        print(f"   - Appointments: {Appointment.query.count()}")
        print(f"   - Billings: {Billing.query.count()}")
        print(f"   - Finance Records: {FinanceRecord.query.count()}")


if __name__ == '__main__':
    seed_data()
