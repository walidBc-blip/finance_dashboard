from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import calendar
from typing import List

# Import our database components
from app.database import get_database, init_database, get_db_info
from app import models, schemas, crud
from app.models import User, Transaction, Budget, SavingsGoal, Investment

app = FastAPI(
    title="Personal Finance Dashboard API",
    description="Professional Finance Management with Real Database",
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
    """Initialize database and create tables"""
    init_database()
    print("🚀 Database initialized successfully!")

# Database and system endpoints
@app.get("/")
async def root():
    return {
        "message": "Personal Finance Dashboard API",
        "version": "3.0.0",
        "status": "running",
        "database": "connected",
        "features": ["Real Database", "CRUD Operations", "Data Validation", "Professional Models"]
    }

@app.get("/health")
async def health_check(db: Session = Depends(get_database)):
    """Health check endpoint"""
    try:
        # Test database connection
        db.execute("SELECT 1")
        db_info = get_db_info()
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now().isoformat(),
            "database_info": db_info
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

# User Management Endpoints
@app.post("/users/", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: schemas.UserCreate, db: Session = Depends(get_database)):
    """Create a new user"""
    # Check if user already exists
    existing_user = crud.user_crud.get_user_by_email(db, user.email)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists"
        )
    
    return crud.user_crud.create_user(db, user)

@app.get("/users/", response_model=List[schemas.UserResponse])
async def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_database)):
    """Get all users"""
    return crud.user_crud.get_users(db, skip=skip, limit=limit)

@app.get("/users/{user_id}", response_model=schemas.UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_database)):
    """Get user by ID"""
    user = crud.user_crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/users/{user_id}", response_model=schemas.UserResponse)
async def update_user(user_id: int, user_update: schemas.UserCreate, db: Session = Depends(get_database)):
    """Update user information"""
    user = crud.user_crud.update_user(db, user_id, user_update)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Transaction Management Endpoints
@app.post("/users/{user_id}/transactions/", response_model=schemas.TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(user_id: int, transaction: schemas.TransactionCreate, db: Session = Depends(get_database)):
    """Create a new transaction"""
    # Verify user exists
    user = crud.user_crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return crud.transaction_crud.create_transaction(db, transaction, user_id)

@app.get("/users/{user_id}/transactions/", response_model=List[schemas.TransactionResponse])
async def get_user_transactions(
    user_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_database)
):
    """Get user transactions"""
    # Verify user exists
    user = crud.user_crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return crud.transaction_crud.get_transactions(db, user_id, skip=skip, limit=limit)

@app.get("/users/{user_id}/transactions/category/{category}")
async def get_transactions_by_category(
    user_id: int,
    category: str,
    db: Session = Depends(get_database)
):
    """Get transactions by category"""
    user = crud.user_crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return crud.transaction_crud.get_transactions_by_category(db, user_id, category)

# Budget Management Endpoints
@app.post("/users/{user_id}/budgets/", response_model=schemas.BudgetResponse)
async def create_or_update_budget(
    user_id: int,
    budget: schemas.BudgetCreate,
    db: Session = Depends(get_database)
):
    """Create or update a budget"""
    user = crud.user_crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return crud.budget_crud.create_or_update_budget(db, budget, user_id)

@app.get("/users/{user_id}/budgets/", response_model=List[schemas.BudgetResponse])
async def get_user_budgets(user_id: int, db: Session = Depends(get_database)):
    """Get user budgets"""
    user = crud.user_crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return crud.budget_crud.get_user_budgets(db, user_id)

@app.delete("/users/{user_id}/budgets/{budget_id}")
async def delete_budget(user_id: int, budget_id: int, db: Session = Depends(get_database)):
    """Delete a budget"""
    user = crud.user_crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    success = crud.budget_crud.delete_budget(db, budget_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    return {"message": "Budget deleted successfully"}

# Analytics Endpoints
@app.get("/users/{user_id}/spending-analysis/", response_model=schemas.SpendingAnalysis)
async def get_spending_analysis(user_id: int, months: int = 12, db: Session = Depends(get_database)):
    """Get comprehensive spending analysis"""
    user = crud.user_crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    analysis = crud.analytics_crud.get_spending_summary(db, user_id, months)
    
    # Format for frontend
    top_categories = [
        {
            "category": category,
            "amount": amount,
            "percentage": round((amount / analysis['total_expenses']) * 100, 1) if analysis['total_expenses'] > 0 else 0
        }
        for category, amount in sorted(analysis['category_spending'].items(), key=lambda x: x[1], reverse=True)[:5]
    ]
    
    monthly_trends = [
        {
            "month": month,
            "income": data['income'],
            "expenses": data['expenses'],
            "net": data['income'] - data['expenses']
        }
        for month, data in sorted(analysis['monthly_trends'].items())
    ]
    
    return schemas.SpendingAnalysis(
        total_income=analysis['total_income'],
        total_expenses=analysis['total_expenses'],
        savings_rate=analysis['savings_rate'],
        top_categories=top_categories,
        monthly_trends=monthly_trends[-6:],  # Last 6 months
        transaction_count=analysis['transaction_count']
    )

@app.get("/users/{user_id}/budget-alerts/", response_model=List[schemas.BudgetAlert])
async def get_budget_alerts(user_id: int, db: Session = Depends(get_database)):
    """Get current budget alerts"""
    user = crud.user_crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    performance = crud.analytics_crud.get_budget_performance(db, user_id)
    
    # Calculate days remaining in current month
    now = datetime.now()
    days_in_month = calendar.monthrange(now.year, now.month)[1]
    days_remaining = days_in_month - now.day
    
    alerts = []
    for perf in performance:
        alerts.append(schemas.BudgetAlert(
            category=perf['category'],
            budget_limit=perf['budget_limit'],
            current_spending=perf['current_spending'],
            percentage_used=round(perf['percentage_used'], 1),
            remaining=perf['remaining'],
            alert_threshold=perf['alert_threshold'],
            is_over_budget=perf['is_over_budget'],
            is_near_limit=perf['is_near_limit'],
            days_remaining_in_month=days_remaining
        ))
    
    return sorted(alerts, key=lambda x: x.percentage_used, reverse=True)

@app.get("/users/{user_id}/financial-health/", response_model=schemas.FinancialHealthScore)
async def get_financial_health_score(user_id: int, db: Session = Depends(get_database)):
    """Calculate financial health score"""
    user = crud.user_crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get recent data for analysis
    analysis = crud.analytics_crud.get_spending_summary(db, user_id, months=6)
    budget_performance = crud.analytics_crud.get_budget_performance(db, user_id)
    
    if analysis['transaction_count'] == 0:
        return schemas.FinancialHealthScore(
            score=50,
            category="Insufficient Data",
            recommendations=["Add transactions to get accurate financial health scoring"],
            savings_rate=0.0,
            budget_adherence=0.0,
            metrics={}
        )
    
    # Calculate component scores
    savings_rate = analysis['savings_rate']
    savings_score = min(100, max(0, savings_rate * 200))  # 0.5 savings rate = 100 score
    
    # Budget adherence score
    if budget_performance:
        budget_scores = []
        for perf in budget_performance:
            if not perf['is_over_budget']:
                budget_scores.append(100 - perf['percentage_used'])
            else:
                budget_scores.append(max(0, 50 - (perf['percentage_used'] - 100)))
        budget_adherence = sum(budget_scores) / len(budget_scores) if budget_scores else 50
    else:
        budget_adherence = 50
    
    # Calculate final score (weighted average)
    final_score = int(
        savings_score * 0.4 +          # 40% weight on savings
        budget_adherence * 0.3 +       # 30% weight on budget adherence
        50 * 0.3                       # 30% base score
    )
    final_score = max(0, min(100, final_score))
    
    # Determine category and recommendations
    if final_score >= 80:
        category = "Excellent"
        recommendations = [
            "Keep up the outstanding financial management!",
            "Consider increasing investment contributions",
            "Explore advanced financial planning strategies"
        ]
    elif final_score >= 70:
        category = "Good"
        recommendations = [
            "You're doing well! Try to increase your savings rate",
            "Review budget categories for optimization opportunities",
            "Consider setting up automated savings"
        ]
    elif final_score >= 60:
        category = "Fair"
        recommendations = [
            "Focus on creating and sticking to budgets",
            "Look for areas to reduce discretionary spending",
            "Aim to save at least 10% of your income"
        ]
    else:
        category = "Needs Improvement"
        recommendations = [
            "Create a detailed budget and track all expenses",
            "Identify and eliminate unnecessary spending",
            "Consider financial counseling or education resources",
            "Start with small, achievable savings goals"
        ]
    
    return schemas.FinancialHealthScore(
        score=final_score,
        category=category,
        recommendations=recommendations,
        savings_rate=round(savings_rate * 100, 1),
        budget_adherence=round(budget_adherence, 1),
        metrics={
            "savings_score": round(savings_score, 1),
            "budget_score": round(budget_adherence, 1),
            "transaction_count": analysis['transaction_count'],
            "total_income": analysis['total_income'],
            "total_expenses": analysis['total_expenses']
        }
    )

# Development Helper Endpoints
@app.post("/dev/create-sample-data/")
async def create_sample_data(db: Session = Depends(get_database)):
    """Create sample data for development (remove in production)"""
    try:
        # Create sample users
        sample_users = [
            {"name": "John Doe", "email": "john@example.com", "age": 30, "annual_income": 75000},
            {"name": "Jane Smith", "email": "jane@example.com", "age": 28, "annual_income": 65000},
            {"name": "Bob Johnson", "email": "bob@example.com", "age": 35, "annual_income": 85000}
        ]
        
        created_users = []
        for user_data in sample_users:
            # Check if user already exists
            existing_user = crud.user_crud.get_user_by_email(db, user_data["email"])
            if not existing_user:
                user_create = schemas.UserCreate(**user_data)
                user = crud.user_crud.create_user(db, user_create)
                created_users.append(user)
            else:
                created_users.append(existing_user)
        
        # Create sample transactions and budgets for each user
        for user in created_users:
            # Create sample budgets
            budget_categories = [
                {"category": "Housing", "monthly_limit": 1800},
                {"category": "Food", "monthly_limit": 600},
                {"category": "Transportation", "monthly_limit": 400},
                {"category": "Entertainment", "monthly_limit": 300}
            ]
            
            for budget_data in budget_categories:
                budget_create = schemas.BudgetCreate(**budget_data)
                crud.budget_crud.create_or_update_budget(db, budget_create, user.id)
            
            # Create sample transactions (simplified for now)
            sample_transactions = [
                {"amount": 5000, "category": "Salary", "description": "Monthly salary", "transaction_type": "income"},
                {"amount": 1500, "category": "Housing", "description": "Rent payment", "transaction_type": "expense"},
                {"amount": 400, "category": "Food", "description": "Groceries", "transaction_type": "expense"},
                {"amount": 200, "category": "Transportation", "description": "Gas and transport", "transaction_type": "expense"}
            ]
            
            for trans_data in sample_transactions:
                trans_data["transaction_date"] = datetime.now().date()
                transaction_create = schemas.TransactionCreate(**trans_data)
                crud.transaction_crud.create_transaction(db, transaction_create, user.id)
        
        return {
            "message": "Sample data created successfully",
            "users_created": len(created_users),
            "budgets_created": len(created_users) * len(budget_categories),
            "transactions_created": len(created_users) * len(sample_transactions)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating sample data: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)