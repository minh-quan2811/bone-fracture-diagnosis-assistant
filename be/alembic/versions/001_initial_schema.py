"""Initial database schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create custom enum types
    
    # Create RoleEnum
    roleenum = postgresql.ENUM(
        'student', 'teacher', 'assistant',
        name='roleenum',
        create_type=False
    )
    roleenum.create(op.get_bind(), checkfirst=True)
    
    # Create MessageType enum  
    messagetype = postgresql.ENUM(
        'human', 'ai',
        name='messagetype',
        create_type=False
    )
    messagetype.create(op.get_bind(), checkfirst=True)
    
    # Create PredictionSource enum
    prediction_source = postgresql.ENUM(
        'student', 'ai',
        name='prediction_source',
        create_type=False
    )
    prediction_source.create(op.get_bind(), checkfirst=True)
    
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('is_admin', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('role', roleenum, nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    
    # Create conversations table
    op.create_table('conversations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_conversations_id'), 'conversations', ['id'], unique=False)
    
    # Create fracture_predictions table
    op.create_table('fracture_predictions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('image_filename', sa.String(length=255), nullable=False),
        sa.Column('image_path', sa.String(length=500), nullable=False),
        sa.Column('image_size', sa.Integer(), nullable=True),
        sa.Column('image_width', sa.Integer(), nullable=True),
        sa.Column('image_height', sa.Integer(), nullable=True),
        sa.Column('image_format', sa.String(length=10), nullable=True),
        sa.Column('has_student_predictions', sa.Boolean(), nullable=True),
        sa.Column('has_ai_predictions', sa.Boolean(), nullable=True),
        sa.Column('student_prediction_count', sa.Integer(), nullable=True),
        sa.Column('ai_prediction_count', sa.Integer(), nullable=True),
        sa.Column('model_version', sa.String(length=50), nullable=True),
        sa.Column('ai_inference_time', sa.Float(), nullable=True),
        sa.Column('confidence_threshold', sa.Float(), nullable=True),
        sa.Column('ai_max_confidence', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('student_predictions_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ai_predictions_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_fracture_predictions_id'), 'fracture_predictions', ['id'], unique=False)
    
    # Create messages table
    op.create_table('messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('conversation_id', sa.Integer(), nullable=False),
        sa.Column('sender_id', sa.Integer(), nullable=True),
        sa.Column('role', roleenum, nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_messages_id'), 'messages', ['id'], unique=False)
    
    # Create fracture_detections table
    op.create_table('fracture_detections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('prediction_id', sa.Integer(), nullable=False),
        sa.Column('source', prediction_source, nullable=False),
        sa.Column('class_id', sa.Integer(), nullable=False),
        sa.Column('class_name', sa.String(length=100), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('x_min', sa.Integer(), nullable=False),
        sa.Column('y_min', sa.Integer(), nullable=False),
        sa.Column('x_max', sa.Integer(), nullable=False),
        sa.Column('y_max', sa.Integer(), nullable=False),
        sa.Column('width', sa.Integer(), nullable=False),
        sa.Column('height', sa.Integer(), nullable=False),
        sa.Column('student_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['prediction_id'], ['fracture_predictions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_fracture_detections_id'), 'fracture_detections', ['id'], unique=False)


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index(op.f('ix_fracture_detections_id'), table_name='fracture_detections')
    op.drop_table('fracture_detections')
    
    op.drop_index(op.f('ix_messages_id'), table_name='messages')
    op.drop_table('messages')
    
    op.drop_index(op.f('ix_fracture_predictions_id'), table_name='fracture_predictions')
    op.drop_table('fracture_predictions')
    
    op.drop_index(op.f('ix_conversations_id'), table_name='conversations')
    op.drop_table('conversations')
    
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')
    
    # Drop enum types
    prediction_source = postgresql.ENUM(name='prediction_source')
    prediction_source.drop(op.get_bind(), checkfirst=True)
    
    messagetype = postgresql.ENUM(name='messagetype')
    messagetype.drop(op.get_bind(), checkfirst=True)
    
    roleenum = postgresql.ENUM(name='roleenum')
    roleenum.drop(op.get_bind(), checkfirst=True)