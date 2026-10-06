
import sys
import os

# Add the current directory (backend) to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base_class import Base
from app.db.models.user import User
from app.core.config import settings

# Setup DB connection
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def list_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Total users found: {len(users)}")
        print("-" * 50)
        print(f"{'ID':<36} | {'Email':<30} | {'Active':<7} | {'Admin'}")
        print("-" * 50)
        for user in users:
            print(f"{user.id:<36} | {user.email:<30} | {str(user.is_active):<7} | {user.is_admin}")
    finally:
        db.close()

if __name__ == "__main__":
    list_users()
