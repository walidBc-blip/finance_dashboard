from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text, and_, func, extract
from datetime import datetime, timedelta
import calendar
from typing import List

# Import database components
from app.database import get_database, init_database
from app.models import User, Transaction, Budget
from app.schemas import UserCreate, UserResponse, TransactionCreate, TransactionResponse, BudgetCreate, BudgetResponse

app = FastAPI(
    title="Personal Finance Dashboard API", 
    description="Real Database Integration",
    version="3.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_database()
    print("🚀 Database initialized!")

@app.get("/")
async def root():
    return {
        "message": "Personal Finance Dashboard API",
        "version": "3.0.0",
        "status": "running",
        "database": "connected"
    }

@app.get("/health")
async def health_check(db: Session = Depends(get_database)):
    try:
        result = db.execute(text("SELECT 1")).fetchone()
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

# User endpoints
@app.post("/users/", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_database)):
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    db_user = User(
        name=user.name,
        email=user.email,
        age=user.age,
        annual_income=user.annual_income,
        monthly_income=user.annual_income / 12
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/", response_model=List[UserResponse])
async def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_database)):
    users = db.query(User).filter(User.is_active == True).offset(skip).limit(limit).all()
    return users

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_database)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Transaction endpoints
@app.post("/users/{user_id}/transactions/", response_model=TransactionResponse)
async def create_transaction(user_id: int, transaction: TransactionCreate, db: Session = Depends(get_database)):
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_transaction = Transaction(
        user_id=user_id,
        amount=transaction.amount,
        category=transaction.category,
        description=transaction.description,
        transaction_date=transaction.transaction_date,
        transaction_type=transaction.transaction_type
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@app.get("/users/{user_id}/transactions/", response_model=List[TransactionResponse])
async def get_user_transactions(user_id: int, skip: int = 0, limit: int = 50, db: Session = Depends(get_database)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    transactions = (db.query(Transaction)
                   .filter(Transaction.user_id == user_id)
                   .order_by(Transaction.transaction_date.desc())
                   .offset(skip)
                   .limit(limit)
                   .all())
    return transactions

# Budget endpoints
@app.post("/users/{user_id}/budgets/", response_model=BudgetResponse)
async def create_or_update_budget(user_id: int, budget: BudgetCreate, db: Session = Depends(get_database)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if budget exists
    existing_budget = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.category == budget.category
    ).first()
    
    if existing_budget:
        existing_budget.monthly_limit = budget.monthly_limit
        db.commit()
        db.refresh(existing_budget)
        return existing_budget
    else:
        db_budget = Budget(
            user_id=user_id,
            category=budget.category,
            monthly_limit=budget.monthly_limit
        )
        db.add(db_budget)
        db.commit()
        db.refresh(db_budget)
        return db_budget

@app.get("/users/{user_id}/budgets/", response_model=List[BudgetResponse])
async def get_user_budgets(user_id: int, db: Session = Depends(get_database)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    budgets = db.query(Budget).filter(Budget.user_id == user_id, Budget.is_active == True).all()
    return budgets

# Analytics endpoints
@app.get("/users/{user_id}/spending-analysis/")
async def get_spending_analysis(user_id: int, db: Session = Depends(get_database)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get transactions from last 12 months
    start_date = datetime.now() - timedelta(days=365)
    transactions = (db.query(Transaction)
                   .filter(Transaction.user_id == user_id, Transaction.transaction_date >= start_date.date())
                   .all())
    
    total_income = sum(t.amount for t in transactions if t.transaction_type == 'income')
    total_expenses = sum(t.amount for t in transactions if t.transaction_type == 'expense')
    
    # Category breakdown
    category_totals = {}
    for t in transactions:
        if t.transaction_type == 'expense':
            category_totals[t.category] = category_totals.get(t.category, 0) + t.amount
    
    top_categories = [
        {"category": cat, "amount": amount, "percentage": round((amount/total_expenses)*100, 1) if total_expenses > 0 else 0}
        for cat, amount in sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:5]
    ]
    
    # Monthly trends
    monthly_data = {}
    for t in transactions:
        month = t.transaction_date.strftime('%Y-%m')
        if month not in monthly_data:
            monthly_data[month] = {'income': 0, 'expenses': 0}
        
        if t.transaction_type == 'income':
            monthly_data[month]['income'] += t.amount
        else:
            monthly_data[month]['expenses'] += t.amount
    
    monthly_trends = [
        {"month": month, "income": data['income'], "expenses": data['expenses'], "net": data['income'] - data['expenses']}
        for month, data in sorted(monthly_data.items())
    ]
    
    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "savings_rate": (total_income - total_expenses) / total_income if total_income > 0 else 0,
        "top_categories": top_categories,
        "monthly_trends": monthly_trends[-6:],  # Last 6 months
        "transaction_count": len(transactions)
    }

@app.get("/users/{user_id}/budget-alerts/")
async def get_budget_alerts(user_id: int, db: Session = Depends(get_database)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get current month spending
    now = datetime.now()
    current_month_transactions = (db.query(Transaction)
                                 .filter(
                                     Transaction.user_id == user_id,
                                     Transaction.transaction_type == 'expense',
                                     extract('year', Transaction.transaction_date) == now.year,
                                     extract('month', Transaction.transaction_date) == now.month
                                 )
                                 .all())
    
    # Calculate spending by category
    current_spending = {}
    for t in current_month_transactions:
        current_spending[t.category] = current_spending.get(t.category, 0) + t.amount
    
    # Get budgets and calculate alerts
    budgets = db.query(Budget).filter(Budget.user_id == user_id, Budget.is_active == True).all()
    alerts = []
    
    days_in_month = calendar.monthrange(now.year, now.month)[1]
    days_remaining = days_in_month - now.day
    
    for budget in budgets:
        spent = current_spending.get(budget.category, 0)
        percentage = (spent / budget.monthly_limit) * 100 if budget.monthly_limit > 0 else 0
        
        if percentage >= 90:
            alert_level = "danger"
        elif percentage >= 75:
            alert_level = "warning"
        elif percentage >= 50:
            alert_level = "info"
        else:
            alert_level = "success"
        
        alerts.append({
            "category": budget.category,
            "budget_limit": budget.monthly_limit,
            "current_spending": spent,
            "percentage_used": round(percentage, 1),
            "remaining_budget": budget.monthly_limit - spent,
            "alert_level": alert_level,
            "days_remaining": days_remaining
        })
    
    return sorted(alerts, key=lambda x: x["percentage_used"], reverse=True)

@app.get("/users/{user_id}/financial-health/")
async def get_financial_health_score(user_id: int, db: Session = Depends(get_database)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get recent transactions
    start_date = datetime.now() - timedelta(days=180)
    transactions = (db.query(Transaction)
                   .filter(Transaction.user_id == user_id, Transaction.transaction_date >= start_date.date())
                   .all())
    
    if not transactions:
        return {
            "score": 50,
            "category": "Insufficient Data",
            "recommendations": ["Add more transactions to get accurate scoring"],
            "savings_rate": 0.0,
            "budget_adherence": 0.0
        }
    
    total_income = sum(t.amount for t in transactions if t.transaction_type == 'income')
    total_expenses = sum(t.amount for t in transactions if t.transaction_type == 'expense')
    
    savings_rate = (total_income - total_expenses) / total_income if total_income > 0 else 0
    savings_score = min(100, max(0, savings_rate * 200))
    
    # Simple score calculation
    final_score = int(savings_score * 0.7 + 75 * 0.3)  # 75 is default budget score
    final_score = max(0, min(100, final_score))
    
    if final_score >= 80:
        category = "Excellent"
        recommendations = ["Keep up the great work!", "Consider increasing investments"]
    elif final_score >= 70:
        category = "Good"
        recommendations = ["You're doing well!", "Try to increase savings rate"]
    elif final_score >= 60:
        category = "Fair"
        recommendations = ["Focus on budgeting", "Look for areas to reduce expenses"]
    else:
        category = "Needs Improvement"
        recommendations = ["Create a detailed budget", "Track all expenses carefully"]
    
    return {
        "score": final_score,
        "category": category,
        "recommendations": recommendations,
        "savings_rate": round(savings_rate * 100, 1),
        "budget_adherence": 75.0
    }

# Sample data creation
@app.post("/dev/create-sample-data/")
async def create_sample_data(db: Session = Depends(get_database)):
    try:
        # Create sample users
        sample_users_data = [
            {"name": "John Doe", "email": "john@example.com", "age": 30, "annual_income": 75000},
            {"name": "Jane Smith", "email": "jane@example.com", "age": 28, "annual_income": 65000},
            {"name": "Bob Johnson", "email": "bob@example.com", "age": 35, "annual_income": 85000}
        ]
        
        created_users = []
        for user_data in sample_users_data:
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()
            if not existing_user:
                user = User(
                    name=user_data["name"],
                    email=user_data["email"],
                    age=user_data["age"],
                    annual_income=user_data["annual_income"],
                    monthly_income=user_data["annual_income"] / 12
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                created_users.append(user)
            else:
                created_users.append(existing_user)
        
        # Create sample budgets and transactions
        for user in created_users:
            # Create budgets
            budget_data = [
                {"category": "Housing", "monthly_limit": 1800},
                {"category": "Food", "monthly_limit": 600},
                {"category": "Transportation", "monthly_limit": 400},
                {"category": "Entertainment", "monthly_limit": 300}
            ]
            
            for budget_info in budget_data:
                existing_budget = db.query(Budget).filter(
                    Budget.user_id == user.id,
                    Budget.category == budget_info["category"]
                ).first()
                
                if not existing_budget:
                    budget = Budget(
                        user_id=user.id,
                        category=budget_info["category"],
                        monthly_limit=budget_info["monthly_limit"]
                    )
                    db.add(budget)
            
            # Create sample transactions
            transaction_data = [
                {"amount": 5000, "category": "Salary", "description": "Monthly salary", "transaction_type": "income"},
                {"amount": 1500, "category": "Housing", "description": "Rent payment", "transaction_type": "expense"},
                {"amount": 400, "category": "Food", "description": "Groceries", "transaction_type": "expense"},
                {"amount": 200, "category": "Transportation", "description": "Gas and transport", "transaction_type": "expense"},
                {"amount": 150, "category": "Entertainment", "description": "Movies and dining", "transaction_type": "expense"}
            ]
            
            for trans_info in transaction_data:
                transaction = Transaction(
                    user_id=user.id,
                    amount=trans_info["amount"],
                    category=trans_info["category"],
                    description=trans_info["description"],
                    transaction_date=datetime.now().date(),
                    transaction_type=trans_info["transaction_type"]
                )
                db.add(transaction)
        
        db.commit()
        
        return {
            "message": "Sample data created successfully",
            "users_created": len(created_users),
            "status": "success"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating sample data: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)