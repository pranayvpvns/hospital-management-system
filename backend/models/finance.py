from extensions import Base
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, func


class FinanceRecord(Base):
    __tablename__ = 'finance_records'
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True)
    record_type = Column(String(20))  # revenue, expense
    category = Column(String(60))
    amount = Column(Float, nullable=False)
    department = Column(String(80))
    description = Column(Text)
    date = Column(DateTime, server_default=func.now())

    def to_dict(self):
        return {'id': self.id, 'record_type': self.record_type,
                'category': self.category, 'amount': self.amount,
                'department': self.department, 'description': self.description,
                'date': self.date.isoformat() if self.date else None}
