"""
Auth dependencies — Role-based access control for FastAPI.
Replaces Flask decorators with FastAPI dependency injection.
"""

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from extensions import get_db, get_current_user_id
from models.user import User


def get_current_user(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency: get the full User object for the authenticated user."""
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def role_required(allowed_roles: list[str]):
    """Factory that returns a FastAPI dependency enforcing role-based access.

    Usage in a route:
        @router.get('/admin-only')
        def admin_endpoint(user: User = Depends(role_required(['admin', 'doctor']))):
            ...
    """
    def dependency(
        user_id: int = Depends(get_current_user_id),
        db: Session = Depends(get_db),
    ) -> User:
        user = db.query(User).get(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        if user.role not in allowed_roles and user.role != 'admin':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: insufficient permissions",
            )
        return user
    return dependency
