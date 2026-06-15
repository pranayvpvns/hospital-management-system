from extensions import Base
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
import json


class Billing(Base):
    __tablename__ = 'billings'
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    items = Column(Text, nullable=False)  # JSON
    subtotal = Column(Float, default=0)
    tax = Column(Float, default=0)
    discount = Column(Float, default=0)
    total = Column(Float, default=0)
    status = Column(String(20), default='pending')
    created_at = Column(DateTime, server_default=func.now())

    patient = relationship('Patient', backref='billings')

    def to_dict(self):
        patient_name = None
        if self.patient and self.patient.user:
            patient_name = self.patient.user.name
        return {'id': self.id, 'patient_id': self.patient_id,
                'patient_name': patient_name,
                'items': json.loads(self.items) if self.items else [],
                'subtotal': self.subtotal, 'tax': self.tax,
                'discount': self.discount, 'total': self.total,
                'status': self.status,
                'created_at': self.created_at.isoformat() if self.created_at else None}
