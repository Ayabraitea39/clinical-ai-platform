from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel
import datetime
from app.database import get_db
from app.chatbot.orchestrator import chat_with_patient_context
from app.models.chat_message import ChatMessage

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


@router.get("/{patient_id}/chat", response_model=list[ChatMessageOut])
def get_chat_history(patient_id: int, db: Session = Depends(get_db)):
    messages = db.scalars(
        select(ChatMessage)
        .where(ChatMessage.patient_id == patient_id)
        .order_by(ChatMessage.created_at)
    ).all()
    return messages


@router.post("/{patient_id}/chat", response_model=ChatResponse)
def chat(patient_id: int, request: ChatRequest, db: Session = Depends(get_db)):
    # Save the doctor's question first
    db.add(ChatMessage(patient_id=patient_id, role="user", content=request.message))
    db.commit()

    reply = chat_with_patient_context(db, patient_id=patient_id, question=request.message)

    # Save the assistant's reply
    db.add(ChatMessage(patient_id=patient_id, role="assistant", content=reply))
    db.commit()

    return ChatResponse(reply=reply)