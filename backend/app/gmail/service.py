from functools import lru_cache

from composio import Composio
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from composio_openai import OpenAIProvider

from app.core.config import get_settings
from app.db.models import GmailConnection, User


@lru_cache
def _client() -> Composio:
    """One shared Composio client (the docs recommend a singleton)."""
    settings = get_settings()
    if not settings.composio_api_key or not settings.composio_gmail_auth_config_id:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Gmail integration is not configured")
    return Composio(api_key=settings.composio_api_key, provider=OpenAIProvider())


def _get_row(db: Session, user: User) -> GmailConnection | None:
    return db.scalar(select(GmailConnection).where(GmailConnection.user_id == user.id))


def get_status(db: Session, user: User) -> str:
    """Ask Composio whether this user has an active Gmail connection."""
    row = _get_row(db, user)
    if row is None:
        return "not_connected"

    accounts = _client().connected_accounts.list(
        user_ids=[str(user.id)], toolkit_slugs=["GMAIL"]
    )
    active = next((a for a in accounts.items if a.status == "ACTIVE"), None)
    if active:
        row.composio_connection_id = active.id
        row.status = "active"
    else:
        row.status = "pending"
    db.commit()
    return row.status


def start_connection(db: Session, user: User) -> str:
    """Create a connect link for this user and remember the pending connection."""
    if get_status(db, user) == "active":
        raise HTTPException(status.HTTP_409_CONFLICT, "Gmail is already connected")

    settings = get_settings()
    request = _client().connected_accounts.link(
        user_id=str(user.id),
        auth_config_id=settings.composio_gmail_auth_config_id,
        callback_url=f"{settings.frontend_url}/settings",
    )

    row = _get_row(db, user)
    if row is None:
        row = GmailConnection(user_id=user.id, composio_connection_id=request.id, status="pending")
        db.add(row)
    else:
        row.composio_connection_id = request.id
        row.status = "pending"
    db.commit()
    return request.redirect_url