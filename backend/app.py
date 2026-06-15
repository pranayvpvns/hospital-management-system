"""
MNH Hospital Management System — FastAPI Application
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from extensions import engine, Base

# Import all models so they register with Base.metadata
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
from models.report import Report
from models.notification import Notification

# Import routers
from routes.auth import auth_router
from routes.patients import patients_router
from routes.appointments import appointments_router
from routes.hospital import hospital_router
from routes.billing import billing_router
from routes.payments import payments_router
from routes.finance import finance_router
from routes.predictions import predictions_router
from routes.agents import agents_router
from routes.dashboard import dashboard_router
from routes.reports import reports_router
from routes.notifications import notifications_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create all tables on startup."""
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="MNH Hospital Management System",
    description="AI-powered Hospital Management System with multi-agent orchestration",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers (same URL prefixes as the Flask app)
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(patients_router, prefix="/api/patients", tags=["Patients"])
app.include_router(appointments_router, prefix="/api/appointments", tags=["Appointments"])
app.include_router(hospital_router, prefix="/api/hospital", tags=["Hospital"])
app.include_router(billing_router, prefix="/api/billing", tags=["Billing"])
app.include_router(payments_router, prefix="/api/payments", tags=["Payments"])
app.include_router(finance_router, prefix="/api/finance", tags=["Finance"])
app.include_router(predictions_router, prefix="/api/predictions", tags=["Predictions"])
app.include_router(agents_router, prefix="/api/agents", tags=["Agents"])
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(reports_router, prefix="/api/reports", tags=["Reports"])
app.include_router(notifications_router, prefix="/api/notifications", tags=["Notifications"])


@app.get("/")
def health_check():
    return {"status": "MNH Hospital API is running", "version": "2.0.0", "framework": "FastAPI"}

@app.get("/api/crash")
def crash_test():
    raise Exception("Testing crash handler")


@app.get("/api/health")
def api_health():
    return {"status": "healthy"}