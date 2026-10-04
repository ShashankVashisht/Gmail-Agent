import logging
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Conversation, Message, User
from app.llm.client import LLMClient

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = "You are Echo, a helpful email assistant. Be concise, clear, and polite."
MAX_HISTORY = 20  # only the latest messages are sent to the LLM, which caps cost


def get_owned_conversation(db: Session, user: User, conversation_id: uuid.UUID) -> Conversation:
    """Return the conversation only if it belongs to this user, otherwise 404."""
    conversation = db.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id, Conversation.user_id == user.id
        )
    )
    if conversation is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")
    return conversation


def send_message(
    db: Session,
    llm: LLMClient,
    user: User,
    message: str,
    conversation_id: uuid.UUID | None,
) -> tuple[uuid.UUID, str]:
    # 1. Load previous messages (empty for a new conversation).
    history: list[dict] = []
    conversation = None
    if conversation_id is not None:
        conversation = get_owned_conversation(db, user, conversation_id)
        rows = db.scalars(
            select(Message)
            .where(Message.conversation_id == conversation.id)
            .order_by(Message.id.desc())
            .limit(MAX_HISTORY)
        ).all()
        history = [{"role": m.role, "content": m.content} for m in reversed(rows)]

    history.append({"role": "user", "content": message})

    # 2. Ask the LLM. If it fails, nothing is saved.
    try:
        reply = llm.generate(history, system=SYSTEM_PROMPT)
    except Exception:
        logger.exception("LLM call failed for user %s", user.id)
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            "The AI service is unavailable right now. Try again shortly.",
        )

    # 3. Save both messages (creating the conversation if it's new).
    if conversation is None:
        conversation = Conversation(user_id=user.id, title=message[:50])
        db.add(conversation)
        db.flush()  # gives the conversation its id

    db.add(Message(conversation_id=conversation.id, role="user", content=message))
    db.add(Message(conversation_id=conversation.id, role="assistant", content=reply))
    db.commit()
    return conversation.id, reply