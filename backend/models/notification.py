from extensions import Base
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship


class Notification(Base):
    __tablename__ = 'notifications'
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    type = Column(String(20), default='info')  # info, success, warning
    title = Column(String(120), nullable=False)
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship('User', backref='notifications')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'read': self.read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
