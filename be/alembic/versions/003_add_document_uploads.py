"""Add document uploads table

Revision ID: 003_add_document_uploads
Revises: 002_add_fracture_type_region
Create Date: 2025-01-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003_add_document_uploads'
down_revision = '002_add_fracture_type_region'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create DocumentStatus enum
    document_status = postgresql.ENUM(
        'uploading', 'processing', 'completed', 'failed',
        name='documentstatus',
        create_type=False
    )
    document_status.create(op.get_bind(), checkfirst=True)
    
    # Create document_uploads table
    op.create_table('document_uploads',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('file_type', sa.String(length=50), nullable=True),
        sa.Column('status', document_status, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_document_uploads_id'), 'document_uploads', ['id'], unique=False)

def downgrade() -> None:
    # Drop table
    op.drop_index(op.f('ix_document_uploads_id'), table_name='document_uploads')
    op.drop_table('document_uploads')
    
    # Drop enum type
    document_status = postgresql.ENUM(name='documentstatus')
    document_status.drop(op.get_bind(), checkfirst=True)