from extensions import Base
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import relationship
import bcrypt

class User(Base):
    __tablename__ = 'users'
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True)
    email = Column(String(120), unique=True, nullable=False)
    name = Column(String(120), nullable=False)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(20), default='patient')  # patient, doctor, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    def set_password(self, password):
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        self.password_hash = hashed.decode('utf-8')

    def check_password(self, password):
        try:
            return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
        except Exception:
            # Fallback for werkzeug-style hashes in existing DB
            try:
                from werkzeug.security import check_password_hash
                return check_password_hash(self.password_hash, password)
            except ImportError:
                return False

    def to_dict(self):
        return {'id': self.id, 'email': self.email, 'name': self.name,
                'role': self.role, 'is_active': self.is_active}
