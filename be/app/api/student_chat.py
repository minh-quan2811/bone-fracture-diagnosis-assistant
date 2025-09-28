from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.conversation import ConversationCreate, ConversationOut
from app.schemas.message import MessageCreate, MessageOut
from app.models.user import User
from app.api.auth import get_current_user
from app.services.student_chatbot import chatbot
from app.enums.roles import RoleEnum

router = APIRouter()

@router.get("/conversations", response_model=list[ConversationOut])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversations = db.query(Conversation).filter(Conversation.user_id == current_user.id).all()
    return conversations

@router.post("/conversations", response_model=ConversationOut)
def create_conversation(
    conversation_in: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = Conversation(title=conversation_in.title, user_id=current_user.id)
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation

@router.get("/conversations/{conversation_id}", response_model=ConversationOut)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to view this conversation")
    return conversation

@router.post("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
def add_message(
    conversation_id: int,
    message_in: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if conversation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to add messages to this conversation")

    # Save the human message with the user's role (student or teacher)
    human_msg = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        role=current_user.role,  # Will be RoleEnum.student or RoleEnum.teacher
        content=message_in.content,
    )
    db.add(human_msg)
    db.commit()
    db.refresh(human_msg)

    # Generate chatbot response with assistant role
    ai_response = chatbot.run(message_in.content)
    ai_msg = Message(
        conversation_id=conversation_id,
        sender_id=None,  # AI has no sender_id
        role=RoleEnum.ASSISTANT,  # Always assistant for AI responses
        content=ai_response,
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)

    # Return both messages
    return [human_msg, ai_msg]

@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
def get_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conversation.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to view this conversation")

    return conversation.messages