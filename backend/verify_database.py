# backend/verify_database.py
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import get_database, init_database
from app.models import User, Transaction, Budget
from sqlalchemy import text

def verify_database():
    """Verify database connection and data persistence"""
    print("🔍 Verifying Database Setup...")
    
    # Initialize database
    init_database()
    db = next(get_database())
    
    try:
        # Test database connection
        result = db.execute(text("SELECT 1")).fetchone()
        print("✅ Database connection: WORKING")
        
        # Check if tables exist
        tables = db.execute(text("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
        """)).fetchall()
        
        print(f"📊 Tables found: {[table[0] for table in tables]}")
        
        # Check data counts
        user_count = db.query(User).count()
        transaction_count = db.query(Transaction).count()
        budget_count = db.query(Budget).count()
        
        print(f"\n📈 Data Summary:")
        print(f"  👥 Users: {user_count}")
        print(f"  💳 Transactions: {transaction_count}")
        print(f"  💰 Budgets: {budget_count}")
        
        # Check if sample data exists
        if user_count > 0:
            sample_user = db.query(User).first()
            print(f"  📝 Sample User: {sample_user.name} ({sample_user.email})")
            
            user_transactions = db.query(Transaction).filter(
                Transaction.user_id == sample_user.id
            ).count()
            print(f"  📊 User's Transactions: {user_transactions}")
        
        # Test database file location
        db_file = "backend/finance_app.db"
        if os.path.exists(db_file):
            size = os.path.getsize(db_file)
            print(f"\n💾 Database file: {db_file} ({size} bytes)")
        else:
            print(f"\n⚠️  Database file not found at: {db_file}")
            
        print("\n✅ Database verification complete!")
        
    except Exception as e:
        print(f"❌ Database error: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_database()