from extensions import Base
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import relationship


class Appointment(Base):
    __tablename__ = 'appointments'
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    doctor_name = Column(String(120))
    department = Column(String(80))
    date = Column(DateTime)
    time_slot = Column(String(20))
    status = Column(String(20), default='scheduled')
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    patient = relationship('Patient', backref='appointments')

    def to_dict(self):
        date_str = None
        if self.date:
            date_str = self.date.isoformat() if hasattr(self.date, 'isoformat') else str(self.date)

        patient_name = None
        if self.patient and self.patient.user:
            patient_name = self.patient.user.name

        return {'id': self.id, 'patient_id': self.patient_id,
                'patient_name': patient_name,
                'doctor_name': self.doctor_name, 'department': self.department,
                'date': date_str,
                'time_slot': self.time_slot, 'status': self.status,
                'notes': self.notes}
