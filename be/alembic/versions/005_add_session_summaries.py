"""Add session_summaries table

Revision ID: 005_add_session_summaries
Revises: 004_add_ai_feedback
Create Date: 2026-07-26 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '005_add_session_summaries'
down_revision = '004_add_ai_feedback'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'session_summaries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('conversation_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('summary_text', sa.Text(), nullable=False),
        sa.Column('token_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('conversation_id', name='uq_session_summaries_conversation_id'),
    )
    op.create_index(op.f('ix_session_summaries_id'), 'session_summaries', ['id'], unique=False)
    op.create_index(op.f('ix_session_summaries_conversation_id'), 'session_summaries', ['conversation_id'], unique=False)
    op.create_index(op.f('ix_session_summaries_user_id'), 'session_summaries', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_session_summaries_user_id'), table_name='session_summaries')
    op.drop_index(op.f('ix_session_summaries_conversation_id'), table_name='session_summaries')
    op.drop_index(op.f('ix_session_summaries_id'), table_name='session_summaries')
    op.drop_table('session_summaries')