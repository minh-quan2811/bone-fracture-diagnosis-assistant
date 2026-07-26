from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class SessionSummary(Base):
    """
    Durable, compressed memory for an agent session.

    One row per conversation (a conversation *is* the session — we reuse
    conversations.id rather than minting a separate session_id).
    Created lazily: only inserted the first time the Redis raw-message
    buffer crosses its token budget and a summarization cycle actually runs.
    """

    __tablename__ = "session_summaries"

    id = Column(Integer, primary_key=True, index=True)

    conversation_id = Column(
        Integer,
        ForeignKey("conversations.id"),
        nullable=False,
        unique=True,  # one summary per session
        index=True,
    )

    # Denormalized for direct lookup without a join, consistent with
    # user_id on document_uploads / fracture_predictions.
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    summary_text = Column(Text, nullable=False)
    token_count = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    conversation = relationship("Conversation", backref="session_summary")