from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel
import datetime
from app.database import get_db
from app.chatbot.orchestrator import chat_with_patient_context
from app.models.chat_message import ChatMessage
from app.models.chat_session import ChatSession

router = APIRouter(prefix="/patients", tags=["chatbot"])


class ChatRequest(BaseModel):
    message: str


class ChatMessageOut(BaseModel):
    role: str
    content: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    reply: str


class ChatSessionOut(BaseModel):
    id: int
    title: str | None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


def _get_session_or_404(db: Session, patient_id: int, session_id: int) -> ChatSession:
    session = db.get(ChatSession, session_id)
    if session is None or session.patient_id != patient_id:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return session


@router.get("/{patient_id}/chat/sessions", response_model=list[ChatSessionOut])
def list_chat_sessions(patient_id: int, db: Session = Depends(get_db)):
    sessions = db.scalars(
        select(ChatSession)
        .where(ChatSession.patient_id == patient_id)
        .order_by(ChatSession.updated_at.desc())
    ).all()
    return sessions


@router.post("/{patient_id}/chat/sessions", response_model=ChatSessionOut)
def create_chat_session(patient_id: int, db: Session = Depends(get_db)):
    session = ChatSession(patient_id=patient_id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.delete("/{patient_id}/chat/sessions/{session_id}", status_code=204)
def delete_chat_session(patient_id: int, session_id: int, db: Session = Depends(get_db)):
    session = _get_session_or_404(db, patient_id, session_id)
    db.delete(session)
    db.commit()


@router.get("/{patient_id}/chat/sessions/{session_id}/messages", response_model=list[ChatMessageOut])
def get_chat_history(patient_id: int, session_id: int, db: Session = Depends(get_db)):
    _get_session_or_404(db, patient_id, session_id)
    messages = db.scalars(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
    ).all()
    return messages


@router.post("/{patient_id}/chat/sessions/{session_id}/messages", response_model=ChatResponse)
def chat(patient_id: int, session_id: int, request: ChatRequest, db: Session = Depends(get_db)):
    session = _get_session_or_404(db, patient_id, session_id)

    db.add(ChatMessage(session_id=session_id, patient_id=patient_id, role="user", content=request.message))
    if session.title is None:
        session.title = request.message[:80]
    session.updated_at = datetime.datetime.utcnow()
    db.commit()

    reply = chat_with_patient_context(db, patient_id=patient_id, question=request.message)

    db.add(ChatMessage(session_id=session_id, patient_id=patient_id, role="assistant", content=reply))
    session.updated_at = datetime.datetime.utcnow()
    db.commit()

    return ChatResponse(reply=reply)