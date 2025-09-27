from sqlalchemy import create_engine
from app.core.database import Base
from app.core.config import settings

# Import all models
from app.models.user import User
from app.models.conversation import Conversation  
from app.models.message import Message
from app.models.fracture_prediction import FracturePrediction, FractureDetection

def create_tables():
    engine = create_engine(settings.POSTGRES_URL)
    
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully!")
        print("\nTables:")
        print("   - users")
        print("   - conversations") 
        print("   - messages")
        print("   - fracture_predictions")
        print("   - fracture_detections")
    except Exception as e:
        print(f"❌ Error: {e}")
        raise

if __name__ == "__main__":
    create_tables()