"""Add AI feedback column

Revision ID: 004_add_ai_feedback
Revises: 003_add_document_uploads
Create Date: 2025-02-11 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '004_add_ai_feedback'
down_revision = '003_add_document_uploads'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column('fracture_predictions',
        sa.Column('ai_feedback', postgresql.JSONB, nullable=True)
    )

def downgrade() -> None:
    op.drop_column('fracture_predictions', 'ai_feedback')