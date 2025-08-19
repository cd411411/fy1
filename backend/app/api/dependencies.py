from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from ..security import decode_access_token
from ..config.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/admin/token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    if not settings.is_court_mode:
        return {"username": "open_mode_user"}
    token_data = decode_access_token(token)
    if token_data.username != settings.ADMIN_USERNAME:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")
    return {"username": token_data.username}