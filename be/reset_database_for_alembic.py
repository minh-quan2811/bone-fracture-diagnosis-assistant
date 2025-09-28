# File: reset_database_for_alembic.py

from sqlalchemy import create_engine, text
from app.core.config import settings
import sys

def drop_everything():
    """Drop all tables, enums, and the alembic_version table"""
    engine = create_engine(settings.POSTGRES_URL)
    
    try:
        with engine.connect() as conn:
            print("🗑️  Dropping all database objects...")
            
            # Drop all tables (including alembic_version)
            conn.execute(text("""
                DROP TABLE IF EXISTS alembic_version CASCADE;
                DROP TABLE IF EXISTS fracture_detections CASCADE;
                DROP TABLE IF EXISTS fracture_predictions CASCADE;
                DROP TABLE IF EXISTS messages CASCADE;
                DROP TABLE IF EXISTS conversations CASCADE;
                DROP TABLE IF EXISTS users CASCADE;
            """))
            
            # Drop all custom enum types
            conn.execute(text("""
                DROP TYPE IF EXISTS prediction_source CASCADE;
                DROP TYPE IF EXISTS messagetype CASCADE;  
                DROP TYPE IF EXISTS roleenum CASCADE;
                DROP TYPE IF EXISTS roleenum_new CASCADE;
            """))
            
            conn.commit()
            print("✅ All database objects dropped successfully!")
            
            # Verify everything is gone
            result = conn.execute(text("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            """))
            remaining_tables = [row[0] for row in result]
            
            result = conn.execute(text("""
                SELECT typname FROM pg_type WHERE typtype = 'e'
            """))
            remaining_enums = [row[0] for row in result]
            
            if remaining_tables:
                print(f"⚠️  Remaining tables: {remaining_tables}")
            else:
                print("✅ No tables remaining")
                
            if remaining_enums:
                print(f"⚠️  Remaining enums: {remaining_enums}")
            else:
                print("✅ No custom enums remaining")
                
    except Exception as e:
        print(f"❌ Error during reset: {e}")
        sys.exit(1)

def confirm_reset():
    """Ask for confirmation before dropping everything"""
    print("🚨 WARNING: This will DELETE ALL DATA in your database!")
    print("This includes:")
    print("  - All users")
    print("  - All conversations and messages")  
    print("  - All fracture predictions")
    print("  - All database tables and types")
    print("  - Alembic migration history")
    print()
    
    confirm1 = input("Are you sure you want to continue? (type 'yes' to confirm): ")
    if confirm1.lower() != 'yes':
        print("❌ Reset cancelled")
        sys.exit(0)
        
    confirm2 = input("This action cannot be undone. Type 'DELETE ALL DATA' to proceed: ")
    if confirm2 != 'DELETE ALL DATA':
        print("❌ Reset cancelled")
        sys.exit(0)
    
    return True

if __name__ == "__main__":
    if confirm_reset():
        drop_everything()
        print("\n🎉 Database is now completely clean!")
        print("\nNext steps:")
        print("1. Run: alembic upgrade head")
        print("2. Your database will be created fresh from Alembic migrations")