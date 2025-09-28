# File: database_migration.py

from sqlalchemy import create_engine, text
from app.core.database import Base
from app.core.config import settings

# Import all models
from app.models.user import User
from app.models.conversation import Conversation  
from app.models.message import Message
from app.models.fracture_prediction import FracturePrediction, FractureDetection

def create_enums_and_tables():
    engine = create_engine(settings.POSTGRES_URL)
    
    try:
        with engine.connect() as conn:
            # Step 1: Create custom enum types first
            print("Creating enum types...")
            
            # Create prediction_source enum
            conn.execute(text("""
                DO $$ BEGIN
                    CREATE TYPE prediction_source AS ENUM ('student', 'ai');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            """))
            
            # Create role enum (if it doesn't exist)
            conn.execute(text("""
                DO $$ BEGIN
                    CREATE TYPE roleenum AS ENUM ('student', 'teacher', 'assistant');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            """))
            
            # Create message_type enum (if it doesn't exist)
            conn.execute(text("""
                DO $$ BEGIN
                    CREATE TYPE messagetype AS ENUM ('human', 'ai');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            """))
            
            conn.commit()
            print("✅ Enum types created successfully!")
        
        # Step 2: Create all tables using SQLAlchemy
        print("\nCreating database tables...")
        Base.metadata.create_all(bind=engine)
        
        print("✅ Database tables created successfully!")
        print("\nTables created:")
        print("   - users (with roleenum)")
        print("   - conversations") 
        print("   - messages (with messagetype)")
        print("   - fracture_predictions")
        print("   - fracture_detections (with prediction_source)")
        
        # Step 3: Verify the setup
        with engine.connect() as conn:
            # Check if enums were created correctly
            result = conn.execute(text("""
                SELECT typname, unnest(enum_range(NULL, NULL::prediction_source)) as enum_values
                FROM pg_type 
                WHERE typname = 'prediction_source'
            """))
            
            enum_values = [row[1] for row in result]
            print(f"\n✅ prediction_source enum values: {enum_values}")
            
            if 'student' in enum_values and 'ai' in enum_values:
                print("✅ Enum values are correct (lowercase)")
            else:
                print("⚠️ Warning: Enum values might be incorrect")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        raise

def drop_and_recreate():
    """Use this function to completely reset the database if needed"""
    engine = create_engine(settings.POSTGRES_URL)
    
    try:
        with engine.connect() as conn:
            print("Dropping all tables and enums...")
            
            # Drop tables first (in reverse dependency order)
            conn.execute(text("DROP TABLE IF EXISTS fracture_detections CASCADE"))
            conn.execute(text("DROP TABLE IF EXISTS fracture_predictions CASCADE"))
            conn.execute(text("DROP TABLE IF EXISTS messages CASCADE"))
            conn.execute(text("DROP TABLE IF EXISTS conversations CASCADE"))
            conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
            
            # Drop enum types
            conn.execute(text("DROP TYPE IF EXISTS prediction_source CASCADE"))
            conn.execute(text("DROP TYPE IF EXISTS roleenum CASCADE"))
            conn.execute(text("DROP TYPE IF EXISTS messagetype CASCADE"))
            
            conn.commit()
            print("✅ All tables and enums dropped!")
            
        # Now create everything fresh
        create_enums_and_tables()
        
    except Exception as e:
        print(f"❌ Error during reset: {e}")
        raise

def fix_existing_enum():
    """Use this to fix the enum issue without dropping everything"""
    engine = create_engine(settings.POSTGRES_URL)
    
    try:
        with engine.connect() as conn:
            print("Fixing prediction_source enum...")
            
            # Drop the column that uses the enum (if it exists)
            conn.execute(text("""
                ALTER TABLE fracture_detections 
                DROP COLUMN IF EXISTS source CASCADE
            """))
            
            # Drop and recreate the enum type
            conn.execute(text("DROP TYPE IF EXISTS prediction_source CASCADE"))
            conn.execute(text("CREATE TYPE prediction_source AS ENUM ('student', 'ai')"))
            
            # Add the column back with the correct enum
            conn.execute(text("""
                ALTER TABLE fracture_detections 
                ADD COLUMN source prediction_source DEFAULT 'ai'
            """))
            
            # Update existing records
            conn.execute(text("UPDATE fracture_detections SET source = 'ai'"))
            
            # Make it NOT NULL
            conn.execute(text("""
                ALTER TABLE fracture_detections 
                ALTER COLUMN source SET NOT NULL
            """))
            
            # Create index
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_fracture_detections_source 
                ON fracture_detections(source)
            """))
            
            conn.commit()
            print("✅ Enum fixed successfully!")
            
    except Exception as e:
        print(f"❌ Error fixing enum: {e}")
        raise

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "--reset":
            print("🔄 Resetting database completely...")
            drop_and_recreate()
        elif sys.argv[1] == "--fix-enum":
            print("🔧 Fixing enum issue...")
            fix_existing_enum()
        else:
            print("Usage: python database_migration.py [--reset|--fix-enum]")
    else:
        print("🚀 Creating tables with proper enums...")
        create_enums_and_tables()