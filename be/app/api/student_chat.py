import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.conversation import ConversationCreate, ConversationOut
from app.schemas.message import MessageCreate, MessageOut
from app.models.user import User
from app.api.auth import get_current_user
from app.services.conversation_service import conversation_service

router = APIRouter()


@router.get("/conversations", response_model=list[ConversationOut])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all conversations for the current user"""
    conversations = conversation_service.get_user_conversations(current_user, db)
    return conversations


@router.post("/conversations", response_model=ConversationOut)
def create_conversation(
    conversation_in: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new conversation"""
    conversation = conversation_service.create_conversation(
        conversation_in.title, current_user, db
    )
    return conversation


@router.get("/conversations/{conversation_id}", response_model=ConversationOut)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific conversation"""
    conversation = conversation_service.get_conversation(conversation_id, current_user, db)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found or access denied")
    return conversation

@router.post("/conversations/{conversation_id}/messages/stream")
async def stream_message(
    conversation_id: int,
    message_in: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a message to a conversation and stream the AI response via"""
    async def event_stream():
        async for event in conversation_service.stream_message_with_reply(
            conversation_id, message_in.content, current_user, db
        ):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
def get_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all messages in a conversation"""
    result, status_code = conversation_service.get_conversation_messages(
        conversation_id, current_user, db
    )
    
    if status_code != 200:
        raise HTTPException(status_code=status_code, detail=result.get("error"))
    
    return result.get("messages")