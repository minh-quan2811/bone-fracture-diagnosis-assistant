"""
Durable session summary buffer, stored in Postgres (session_summaries table).
"""
from typing import Optional

from sqlalchemy.orm import Session

from app.models.session_summary import SessionSummary


class PostgresSummaryStore:
    @staticmethod
    def get(db: Session, conversation_id: int) -> Optional[SessionSummary]:
        return (
            db.query(SessionSummary)
            .filter(SessionSummary.conversation_id == conversation_id)
            .first()
        )

    @staticmethod
    def upsert(
        db: Session,
        user_id: int,
        conversation_id: int,
        summary_text: str,
        token_count: int,
    ) -> SessionSummary:
        row = PostgresSummaryStore.get(db, conversation_id)
        if row:
            row.summary_text = summary_text
            row.token_count = token_count
        else:
            row = SessionSummary(
                user_id=user_id,
                conversation_id=conversation_id,
                summary_text=summary_text,
                token_count=token_count,
            )
            db.add(row)

        db.commit()
        db.refresh(row)
        return row


summary_store = PostgresSummaryStore()