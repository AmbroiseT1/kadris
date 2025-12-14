
import sys
import os

# Add the current directory (backend) to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

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
        print(f"{'ID':<5} | {'Email':<30} | {'Active'}")
        print("-" * 50)
        for user in users:
            print(f"{user.id:<5} | {user.email:<30} | {user.is_active}")
    finally:
        db.close()

if __name__ == "__main__":
    list_users()
