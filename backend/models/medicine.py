from extensions import Base
from sqlalchemy import Column, Integer, String, Float, DateTime, func
from datetime import datetime


class Medicine(Base):
    __tablename__ = 'medicines'
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    category = Column(String(80))
    manufacturer = Column(String(120))
    stock = Column(Integer, default=0)
    unit_price = Column(Float, default=0)
    batch_number = Column(String(40))
    expiry_date = Column(DateTime)
    reorder_level = Column(Integer, default=10)
    supplier = Column(String(120))
    created_at = Column(DateTime, server_default=func.now())

    @property
    def is_low_stock(self):
        return self.stock <= self.reorder_level

    @property
    def is_expired(self):
        return self.expiry_date and self.expiry_date < datetime.utcnow()

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'category': self.category,
                'manufacturer': self.manufacturer, 'stock': self.stock,
                'unit_price': self.unit_price, 'batch_number': self.batch_number,
                'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
                'reorder_level': self.reorder_level, 'supplier': self.supplier,
                'is_low_stock': self.is_low_stock, 'is_expired': self.is_expired}
