"""Basic test for appointment booking using FastAPI TestClient."""
from fastapi.testclient import TestClient
from app import app
from extensions import SessionLocal, Base, engine, create_access_token
from models.user import User
import json

# Create tables
Base.metadata.create_all(bind=engine)

client = TestClient(app)

# Find a patient user
db = SessionLocal()
user = db.query(User).filter_by(role='patient').first()
db.close()

if not user:
    print("No patient user found")
else:
    token = create_access_token(identity=str(user.id))

    # Test book
    res = client.post('/api/appointments/', headers={
        'Authorization': f'Bearer {token}'
    }, json={
        'doctor_name': 'Test Doc',
        'department': 'Cardio',
        'date': '2026-10-10',
        'time_slot': '10:00 AM'
    })
    print("Book Status:", res.status_code)
    print("Book Data:", res.text)

    # Test cancel
    if res.status_code == 201:
        aid = res.json()['data']['appointment']['id']
        res_c = client.put(f'/api/appointments/{aid}/cancel', headers={
            'Authorization': f'Bearer {token}'
        })
        print("Cancel Status:", res_c.status_code)
        print("Cancel Data:", res_c.text)
