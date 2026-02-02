from sqlalchemy.orm import Session
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.enums.roles import RoleEnum
from app.services.student_chatbot import chatbot
from typing import List, Dict, Optional, Tuple


class ConversationService:
    """Business logic for conversations and messages"""
    
    @staticmethod
    def get_user_conversations(
        current_user: User,
        db: Session
    ) -> List[Conversation]:
        """
        Get all conversations for the current user
        """
        conversations = db.query(Conversation).filter(
            Conversation.user_id == current_user.id
        ).all()
        return conversations
    
    @staticmethod
    def create_conversation(
        title: str,
        current_user: User,
        db: Session
    ) -> Conversation:
        """
        Create a new conversation for the user
        """
        conversation = Conversation(
            title=title,
            user_id=current_user.id
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        return conversation
    
    @staticmethod
    def get_conversation(
        conversation_id: int,
        current_user: User,
        db: Session
    ) -> Optional[Conversation]:
        """
        Get a specific conversation
        """
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id
        ).first()
        
        if not conversation:
            return None
        
        if conversation.user_id != current_user.id and not current_user.is_admin:
            return None
        
        return conversation
    
    @staticmethod
    def add_message_with_reply(
        conversation_id: int,
        message_content: str,
        current_user: User,
        db: Session
    ) -> Tuple[Dict[str, any], int]:
        """
        Add a user message and get AI response
        """
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id
        ).first()
        
        if not conversation:
            return {"error": "Conversation not found"}, 404
        
        if conversation.user_id != current_user.id:
            return {"error": "Not authorized to add messages to this conversation"}, 403
        
        try:
            # Save the human message with the user's role
            human_msg = Message(
                conversation_id=conversation_id,
                sender_id=current_user.id,
                role=current_user.role,
                content=message_content,
            )
            db.add(human_msg)
            db.commit()
            db.refresh(human_msg)
            
            # Generate chatbot response with assistant role
            ai_response = chatbot.run(message_content)
            ai_msg = Message(
                conversation_id=conversation_id,
                sender_id=None, 
                role=RoleEnum.ASSISTANT,
                content=ai_response,
            )
            db.add(ai_msg)
            db.commit()
            db.refresh(ai_msg)
            
            return {
                "messages": [human_msg, ai_msg],
                "status": 200
            }, 200
            
        except Exception as e:
            db.rollback()
            return {
                "error": f"Failed to add message: {str(e)}"
            }, 500
    
    @staticmethod
    def get_conversation_messages(
        conversation_id: int,
        current_user: User,
        db: Session
    ) -> Tuple[Dict[str, any], int]:
        """
        Get all messages in a conversation
        """
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id
        ).first()
        
        if not conversation:
            return {"error": "Conversation not found"}, 404
        
        if conversation.user_id != current_user.id and not current_user.is_admin:
            return {"error": "Not authorized to view this conversation"}, 403
        
        return {
            "messages": conversation.messages,
            "status": 200
        }, 200


conversation_service = ConversationService()
