import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session


from app.gmail.agent import get_email_agent

from app.auth.service import get_current_user
from app.chat import service
from app.chat.schemas import (
    ChatRequest,
    ChatResponse,
    ConversationResponse,
    MessageResponse,
)
from app.db.models import Conversation, User
from app.db.session import get_db
from app.llm.client import LLMClient, get_llm_client

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    llm: LLMClient = Depends(get_llm_client),
):
    conversation_id, reply = service.send_message(
        db, llm, current_user, payload.message, payload.conversation_id
    )
    return ChatResponse(conversation_id=conversation_id, reply=reply)


@router.get("/conversations", response_model=list[ConversationResponse])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.created_at.desc())
    ).all()


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
def get_messages(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.get_owned_conversation(db, current_user, conversation_id).messages


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.delete(service.get_owned_conversation(db, current_user, conversation_id))
    db.commit()


@router.post("/agent", response_model=ChatResponse)
def agent_chat(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    llm: LLMClient = Depends(get_email_agent),
):
    conversation_id, reply = service.send_message(
        db, llm, current_user, payload.message, payload.conversation_id
    )
    return ChatResponse(conversation_id=conversation_id, reply=reply)