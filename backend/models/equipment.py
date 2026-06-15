from extensions import Base
from sqlalchemy import Column, Integer, String, Float, DateTime


class Equipment(Base):
    __tablename__ = 'equipment'
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    category = Column(String(80))
    department = Column(String(80))
    status = Column(String(20), default='operational')
    serial_number = Column(String(40))
    purchase_date = Column(DateTime)
    last_maintenance = Column(DateTime)
    next_maintenance = Column(DateTime)
    cost = Column(Float)

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'category': self.category,
                'department': self.department, 'status': self.status,
                'serial_number': self.serial_number,
                'next_maintenance': self.next_maintenance.isoformat() if self.next_maintenance else None,
                'cost': self.cost}
