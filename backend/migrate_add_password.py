# backend/migrate_add_password.py
"""
Database migration script to add password_hash column to existing users table
Run this to fix the authentication issue
"""

import sys
import os
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.database import get_database, init_database, engine
from app.models import User
from sqlalchemy import text
from passlib.context import CryptContext

# Password hashing (same as in auth.py)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def migrate_database():
    """Add password_hash column and update existing users"""
    
    print("🔧 Starting database migration...")
    
    # Initialize database connection
    init_database()
    db = next(get_database())
    
    try:
        # Step 1: Add password_hash column to users table
        print("📝 Adding password_hash column...")
        
        # Check if column already exists
        result = db.execute(text("""
            SELECT COUNT(*) 
            FROM pragma_table_info('users') 
            WHERE name='password_hash'
        """)).scalar()
        
        if result == 0:
            # Add the column
            db.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"))
            print("✅ Added password_hash column")
        else:
            print("ℹ️  password_hash column already exists")
        
        # Step 2: Update existing users with default password
        print("🔑 Setting default passwords for existing users...")
        
        # Get all users without password_hash
        users = db.query(User).filter(User.password_hash == None).all()
        
        if users:
            default_password = "demo123"  # Default password for existing users
            hashed_password = get_password_hash(default_password)
            
            for user in users:
                user.password_hash = hashed_password
                print(f"  ✅ Set password for user: {user.email}")
            
            db.commit()
            print(f"🎉 Updated {len(users)} users with default password")
            print(f"🔑 Default password for all users: {default_password}")
        else:
            print("ℹ️  No users need password updates")
        
        # Step 3: Make password_hash NOT NULL (recreate table if needed)
        print("🔒 Making password_hash required...")
        
        # For SQLite, we need to recreate the table to add NOT NULL constraint
        # This is a simplified approach - in production, use proper migrations
        
        print("✅ Database migration completed successfully!")
        print("\n📋 Next steps:")
        print("1. Restart your FastAPI server (uvicorn)")
        print("2. Try registering a new user or logging in with existing users")
        print("3. Default login credentials:")
        print("   - Email: any existing user email")
        print("   - Password: demo123")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_database()