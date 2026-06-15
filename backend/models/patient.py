from extensions import Base
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship


class Patient(Base):
    __tablename__ = 'patients'
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    age = Column(Integer)
    gender = Column(String(10))
    blood_group = Column(String(5))
    dob = Column(String(20))  # Date of birth as string YYYY-MM-DD
    bmi = Column(Float)
    conditions = Column(Text)  # JSON
    allergies = Column(Text)
    lifestyle = Column(Text)  # JSON
    emergency_contact = Column(String(20))
    created_at = Column(DateTime, server_default=func.now())

    user = relationship('User', backref='patient')

    def to_dict(self):
        import json
        return {'id': self.id, 'user_id': self.user_id,
                'name': self.user.name if self.user else None,
                'email': self.user.email if self.user else None,
                'age': self.age, 'gender': self.gender,
                'blood_group': self.blood_group, 'dob': self.dob, 'bmi': self.bmi,
                'conditions': json.loads(self.conditions) if self.conditions else [],
                'allergies': self.allergies,
                'emergency_contact': self.emergency_contact,
                'lifestyle': json.loads(self.lifestyle) if self.lifestyle else {}}
