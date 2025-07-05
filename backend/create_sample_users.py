# backend/create_sample_users.py
import sys
import os
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.database import get_database, init_database
from app.models import User, Transaction, Budget
from passlib.context import CryptContext
from datetime import datetime, timedelta
import random

# Password hashing (same as in auth.py)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_sample_users_with_auth():
    """Create sample users with authentication and sample data"""
    
    print("🚀 Creating sample users with authentication...")
    
    # Initialize database
    init_database()
    db = next(get_database())
    
    try:
        # Clear existing data to avoid conflicts
        print("🧹 Clearing existing data...")
        db.query(Transaction).delete()
        db.query(Budget).delete()
        db.query(User).delete()
        db.commit()
        
        # Sample users data
        sample_users = [
            {
                "name": "John Doe",
                "email": "john@example.com",
                "password": "demo123",
                "age": 30,
                "annual_income": 75000
            },
            {
                "name": "Jane Smith", 
                "email": "jane@example.com",
                "password": "demo123",
                "age": 28,
                "annual_income": 65000
            },
            {
                "name": "Bob Johnson",
                "email": "bob@example.com", 
                "password": "demo123",
                "age": 35,
                "annual_income": 85000
            }
        ]
        
        created_users = []
        
        print("👥 Creating users...")
        
        # Create users with hashed passwords
        for user_data in sample_users:
            hashed_password = get_password_hash(user_data["password"])
            
            user = User(
                name=user_data["name"],
                email=user_data["email"],
                password_hash=hashed_password,
                age=user_data["age"],
                annual_income=user_data["annual_income"],
                monthly_income=user_data["annual_income"] / 12
            )
            
            db.add(user)
            db.commit()
            db.refresh(user)
            created_users.append(user)
            
            print(f"  ✅ Created user: {user.name} ({user.email})")
        
        print(f"\n📊 Creating sample transactions and budgets...")
        
        # Create sample data for each user
        for user in created_users:
            create_sample_transactions(db, user)
            create_sample_budgets(db, user)
        
        db.commit()
        
        print(f"\n🎉 Sample data creation complete!")
        print(f"👥 Users created: {len(created_users)}")
        
        print(f"\n🔐 Login credentials:")
        for user_data in sample_users:
            print(f"  📧 {user_data['email']} | 🔑 {user_data['password']}")
        
        print(f"\n🚀 You can now:")
        print(f"  1. Test login with any of the above credentials")
        print(f"  2. Register new accounts") 
        print(f"  3. All users have realistic financial data")
        
        # Display summary
        total_transactions = db.query(Transaction).count()
        total_budgets = db.query(Budget).count()
        print(f"\n📈 Data Summary:")
        print(f"  💳 Total Transactions: {total_transactions}")
        print(f"  💰 Total Budgets: {total_budgets}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating sample data: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()

def create_sample_transactions(db, user):
    """Create realistic transactions for a user"""
    
    # Transaction categories and patterns
    expense_categories = [
        {"name": "Housing", "monthly_base": user.monthly_income * 0.30, "frequency": 1},
        {"name": "Food", "monthly_base": user.monthly_income * 0.15, "frequency": 8},
        {"name": "Transportation", "monthly_base": user.monthly_income * 0.12, "frequency": 6},
        {"name": "Entertainment", "monthly_base": user.monthly_income * 0.08, "frequency": 4},
        {"name": "Utilities", "monthly_base": user.monthly_income * 0.06, "frequency": 3},
        {"name": "Healthcare", "monthly_base": user.monthly_income * 0.04, "frequency": 2},
        {"name": "Shopping", "monthly_base": user.monthly_income * 0.10, "frequency": 5},
    ]
    
    # Generate transactions for last 6 months
    start_date = datetime.now() - timedelta(days=180)
    current_date = start_date
    
    transactions_created = 0
    
    while current_date <= datetime.now():
        # Monthly salary (around 1st of each month)
        if current_date.day <= 3 and random.random() < 0.9:
            salary_amount = user.monthly_income * random.uniform(0.95, 1.05)
            
            transaction = Transaction(
                user_id=user.id,
                amount=round(salary_amount, 2),
                category="Salary",
                description="Monthly salary",
                transaction_date=current_date.date(),
                transaction_type="income"
            )
            db.add(transaction)
            transactions_created += 1
        
        # Expense transactions
        for category in expense_categories:
            if random.random() < (category["frequency"] / 30):  # Daily probability
                base_amount = category["monthly_base"] / category["frequency"]
                amount = base_amount * random.uniform(0.5, 1.5)
                
                descriptions = {
                    "Housing": ["Rent payment", "Mortgage", "Property tax"],
                    "Food": ["Grocery shopping", "Restaurant", "Coffee", "Lunch"],
                    "Transportation": ["Gas", "Public transport", "Uber", "Parking"],
                    "Entertainment": ["Movies", "Concert", "Streaming", "Gaming"],
                    "Utilities": ["Electricity", "Internet", "Phone", "Water"],
                    "Healthcare": ["Doctor visit", "Pharmacy", "Gym membership"],
                    "Shopping": ["Clothing", "Electronics", "Books", "Gifts"]
                }
                
                transaction = Transaction(
                    user_id=user.id,
                    amount=round(amount, 2),
                    category=category["name"],
                    description=random.choice(descriptions[category["name"]]),
                    transaction_date=current_date.date(),
                    transaction_type="expense"
                )
                db.add(transaction)
                transactions_created += 1
        
        current_date += timedelta(days=1)
    
    print(f"    💳 Created {transactions_created} transactions for {user.name}")

def create_sample_budgets(db, user):
    """Create realistic budgets for a user"""
    
    budget_categories = [
        {"category": "Housing", "percentage": 0.30},
        {"category": "Food", "percentage": 0.15}, 
        {"category": "Transportation", "percentage": 0.12},
        {"category": "Entertainment", "percentage": 0.08},
        {"category": "Utilities", "percentage": 0.08},
        {"category": "Healthcare", "percentage": 0.06},
        {"category": "Shopping", "percentage": 0.10},
    ]
    
    budgets_created = 0
    
    for budget_info in budget_categories:
        monthly_limit = user.monthly_income * budget_info["percentage"] * random.uniform(0.8, 1.2)
        
        budget = Budget(
            user_id=user.id,
            category=budget_info["category"],
            monthly_limit=round(monthly_limit, 2),
            alert_threshold=0.8,
            rollover_unused=False
        )
        db.add(budget)
        budgets_created += 1
    
    print(f"    💰 Created {budgets_created} budgets for {user.name}")

if __name__ == "__main__":
    success = create_sample_users_with_auth()
    if success:
        print(f"\n✅ All done! Your backend is ready for authentication testing.")
        print(f"🚀 Start your backend with: uvicorn app.main:app --reload")
    else:
        print(f"\n❌ Something went wrong. Check the error above.")