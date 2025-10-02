"""Add fracture type and body region

Revision ID: 002_add_fracture_type_region
Revises: 001_initial_schema
Create Date: 2025-01-15 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_add_fracture_type_region'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create FractureType enum
    fracture_type = postgresql.ENUM(
        'greenstick', 'transverse', 'comminuted', 'spiral', 'compound',
        'oblique', 'compression', 'avulsion', 'hairline',
        name='fracture_type',
        create_type=False
    )
    fracture_type.create(op.get_bind(), checkfirst=True)
    
    # Create BodyRegion enum
    body_region = postgresql.ENUM(
        'arm', 'leg', 'hand', 'foot', 'shoulder', 'hip', 'spine',
        'ribs', 'skull', 'pelvis', 'wrist', 'ankle', 'elbow', 'knee',
        name='body_region',
        create_type=False
    )
    body_region.create(op.get_bind(), checkfirst=True)
    
    # Add new columns to fracture_detections table
    op.add_column('fracture_detections',
        sa.Column('fracture_type', fracture_type, nullable=True)
    )
    op.add_column('fracture_detections',
        sa.Column('body_region', body_region, nullable=True)
    )

def downgrade() -> None:
    # Remove columns
    op.drop_column('fracture_detections', 'body_region')
    op.drop_column('fracture_detections', 'fracture_type')
    
    # Drop enum types
    body_region = postgresql.ENUM(name='body_region')
    body_region.drop(op.get_bind(), checkfirst=True)
    
    fracture_type = postgresql.ENUM(name='fracture_type')
    fracture_type.drop(op.get_bind(), checkfirst=True)