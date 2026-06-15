from extensions import Base
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship


class Report(Base):
    __tablename__ = 'reports'
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    doctor_name = Column(String(120), nullable=False)
    visit_date = Column(DateTime, nullable=False)
    diagnosis = Column(Text, nullable=False)
    suggestions = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    patient = relationship('Patient', backref='reports')

    def to_dict(self):
        patient_name = None
        if self.patient and self.patient.user:
            patient_name = self.patient.user.name
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'patient_name': patient_name,
            'doctor_name': self.doctor_name,
            'visit_date': self.visit_date.strftime('%Y-%m-%d') if self.visit_date else None,
            'diagnosis': self.diagnosis,
            'suggestions': self.suggestions
        }
