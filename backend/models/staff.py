from extensions import Base
from sqlalchemy import Column, Integer, String, Date, DateTime, func, ForeignKey


class Staff(Base):
    __tablename__ = 'staff'
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    role = Column(String(30))
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    department = Column(String(80))
    specialization = Column(String(120))
    shift = Column(String(20))
    status = Column(String(20), default='active')
    unavailable_date = Column(Date, nullable=True)
    phone = Column(String(20))
    created_at = Column(DateTime, server_default=func.now())

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'role': self.role,
                'department': self.department, 'specialization': self.specialization,
                'shift': self.shift, 'status': self.status,
                'unavailable_date': self.unavailable_date.isoformat() if self.unavailable_date else None}
