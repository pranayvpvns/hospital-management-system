from extensions import Base
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
import uuid


class Payment(Base):
    __tablename__ = 'payments'
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True)
    billing_id = Column(Integer, ForeignKey('billings.id'), nullable=False)
    amount = Column(Float, nullable=False)
    method = Column(String(20), default='cash')
    transaction_id = Column(String(40), default=lambda: f'TXN-{uuid.uuid4().hex[:12].upper()}')
    status = Column(String(20), default='completed')
    created_at = Column(DateTime, server_default=func.now())

    billing = relationship('Billing', backref='payments')

    def to_dict(self):
        return {'id': self.id, 'billing_id': self.billing_id,
                'amount': self.amount, 'method': self.method,
                'transaction_id': self.transaction_id, 'status': self.status,
                'created_at': self.created_at.isoformat() if self.created_at else None}
