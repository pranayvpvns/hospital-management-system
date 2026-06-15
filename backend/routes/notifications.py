from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from extensions import get_db, get_current_user_id
from models.notification import Notification

notifications_router = APIRouter()


@notifications_router.get('/')
def get_notifications(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    notifs = db.query(Notification).filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    return {
        'message': 'Notifications fetched successfully',
        'data': {'notifications': [n.to_dict() for n in notifs]}
    }


@notifications_router.put('/mark-read')
def mark_all_read(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    db.query(Notification).filter_by(user_id=user_id, read=False).update({'read': True})
    db.commit()
    return {'message': 'All notifications marked as read', 'data': None}


@notifications_router.put('/{id}/mark-read')
def mark_one_read(id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    notif = db.query(Notification).get(id)
    if not notif:
        raise HTTPException(status_code=404, detail='Notification not found')
    if notif.user_id != user_id:
        raise HTTPException(status_code=403, detail='Access forbidden')

    notif.read = True
    db.commit()
    return {'message': 'Notification marked as read', 'data': {'notification': notif.to_dict()}}


@notifications_router.post('/')
def create_notification(body: dict, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    new_notif = Notification(
        user_id=body.get('user_id'),
        type=body.get('type', 'info'),
        title=body.get('title'),
        message=body.get('message')
    )
    db.add(new_notif)
    db.commit()
    return {'message': 'Notification created', 'data': {'notification': new_notif.to_dict()}}
