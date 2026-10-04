from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.service import get_current_user
from app.db.models import User
from app.db.session import get_db
from app.gmail import service
from app.gmail.schemas import ConnectResponse, StatusResponse

router = APIRouter(prefix="/integrations/gmail", tags=["gmail"])


@router.post("/connect", response_model=ConnectResponse)
def connect(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return ConnectResponse(redirect_url=service.start_connection(db, current_user))


@router.get("/status", response_model=StatusResponse)
def status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return StatusResponse(status=service.get_status(db, current_user))