from extensions import Base
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey


class Bed(Base):
    __tablename__ = 'beds'
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True)
    ward = Column(String(80))
    bed_number = Column(String(10), unique=True)
    floor = Column(Integer, default=1)
    bed_type = Column(String(20))
    status = Column(String(20), default='available')
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=True)
    daily_rate = Column(Float, default=1000)
    admitted_at = Column(DateTime)

    def to_dict(self):
        return {'id': self.id, 'ward': self.ward, 'bed_number': self.bed_number,
                'floor': self.floor, 'bed_type': self.bed_type,
                'status': self.status, 'patient_id': self.patient_id,
                'daily_rate': self.daily_rate}
