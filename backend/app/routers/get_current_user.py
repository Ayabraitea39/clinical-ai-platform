from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    if not token:
        raise credentials_error

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise credentials_error

    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise credentials_error

    return user