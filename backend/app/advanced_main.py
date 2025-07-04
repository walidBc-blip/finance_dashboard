from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
import os
from datetime import datetime

from .database import engine, get_database
from .models import Base, User, Transaction, Budget, SavingsGoal, Investment
from .schemas import (
    UserCreate, UserResponse, TransactionCreate, TransactionResponse,
    BudgetCreate, BudgetResponse, SavingsGoalCreate, SavingsGoalResponse,
    InvestmentCreate, InvestmentResponse, FinancialHealthScore, SpendingAnalysis
)
from .services import AnalyticsService
from .services import MLService

# Create FastAPI app
app = FastAPI(
    title="Personal Finance Dashboard API",
    description="A comprehensive API for personal finance management and analytics",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize services
ml_service = MLService()
analytics_service = AnalyticsService()

@app.get("/")
async def root():
    return {"message": "Personal Finance Dashboard API", "version": "1.0.0"}

# User endpoints
@app.post("/users/", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_database)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
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

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_database)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/users/", response_model=List[UserResponse])
async def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_database)):
    users = db.query(User).offset(skip).limit(limit).all()
    return users

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
async def get_user_transactions(user_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_database)):
    transactions = db.query(Transaction).filter(Transaction.user_id == user_id).offset(skip).limit(limit).all()
    return transactions

# Budget endpoints
@app.post("/users/{user_id}/budgets/", response_model=BudgetResponse)
async def create_budget(user_id: int, budget: BudgetCreate, db: Session = Depends(get_database)):
    # Check if budget already exists for this category
    existing_budget = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.category == budget.category
    ).first()
    
    if existing_budget:
        existing_budget.monthly_limit = budget.monthly_limit
        db.commit()
        db.refresh(existing_budget)
        return existing_budget
    
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
    budgets = db.query(Budget).filter(Budget.user_id == user_id).all()
    return budgets

# Analytics endpoints
@app.get("/users/{user_id}/financial-health/", response_model=FinancialHealthScore)
async def get_financial_health_score(user_id: int, db: Session = Depends(get_database)):
    return analytics_service.calculate_financial_health_score(user_id, db)

@app.get("/users/{user_id}/spending-analysis/", response_model=SpendingAnalysis)
async def get_spending_analysis(user_id: int, db: Session = Depends(get_database)):
    return analytics_service.get_spending_analysis(user_id, db)

# Savings Goals endpoints
@app.post("/users/{user_id}/savings-goals/", response_model=SavingsGoalResponse)
async def create_savings_goal(user_id: int, goal: SavingsGoalCreate, db: Session = Depends(get_database)):
    db_goal = SavingsGoal(
        user_id=user_id,
        goal_name=goal.goal_name,
        target_amount=goal.target_amount,
        current_amount=goal.current_amount,
        target_date=goal.target_date
    )
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

@app.get("/users/{user_id}/savings-goals/", response_model=List[SavingsGoalResponse])
async def get_user_savings_goals(user_id: int, db: Session = Depends(get_database)):
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id).all()
    return goals

# Investment endpoints
@app.post("/users/{user_id}/investments/", response_model=InvestmentResponse)
async def create_investment(user_id: int, investment: InvestmentCreate, db: Session = Depends(get_database)):
    db_investment = Investment(
        user_id=user_id,
        investment_type=investment.investment_type,
        amount=investment.amount,
        current_value=investment.current_value,
        purchase_date=investment.purchase_date
    )
    db.add(db_investment)
    db.commit()
    db.refresh(db_investment)
    return db_investment

@app.get("/users/{user_id}/investments/", response_model=List[InvestmentResponse])
async def get_user_investments(user_id: int, db: Session = Depends(get_database)):
    investments = db.query(Investment).filter(Investment.user_id == user_id).all()
    return investments

# Utility endpoints
@app.post("/load-sample-data/")
async def load_sample_data(db: Session = Depends(get_database)):
    """Load sample data from CSV files"""
    try:
        # Load users
        if os.path.exists('users.csv'):
            users_df = pd.read_csv('users.csv')
            for _, row in users_df.iterrows():
                # Check if user already exists
                existing_user = db.query(User).filter(User.email == row['email']).first()
                if not existing_user:
                    db_user = User(
                        name=row['name'],
                        email=row['email'],
                        age=row['age'],
                        annual_income=row['annual_income'],
                        monthly_income=row['monthly_income']
                    )
                    db.add(db_user)
            db.commit()
        
        # Load transactions
        if os.path.exists('transactions.csv'):
            transactions_df = pd.read_csv('transactions.csv')
            for _, row in transactions_df.iterrows():
                db_transaction = Transaction(
                    user_id=row['user_id'],
                    amount=row['amount'],
                    category=row['category'],
                    description=row['description'],
                    transaction_date=datetime.strptime(row['transaction_date'], '%Y-%m-%d').date(),
                    transaction_type=row['transaction_type']
                )
                db.add(db_transaction)
            db.commit()
        
        # Load budgets
        if os.path.exists('budgets.csv'):
            budgets_df = pd.read_csv('budgets.csv')
            for _, row in budgets_df.iterrows():
                db_budget = Budget(
                    user_id=row['user_id'],
                    category=row['category'],
                    monthly_limit=row['monthly_limit']
                )
                db.add(db_budget)
            db.commit()
        
        # Load savings goals
        if os.path.exists('savings_goals.csv'):
            goals_df = pd.read_csv('savings_goals.csv')
            for _, row in goals_df.iterrows():
                db_goal = SavingsGoal(
                    user_id=row['user_id'],
                    goal_name=row['goal_name'],
                    target_amount=row['target_amount'],
                    current_amount=row['current_amount'],
                    target_date=datetime.strptime(row['target_date'], '%Y-%m-%d').date()
                )
                db.add(db_goal)
            db.commit()
        
        # Load investments
        if os.path.exists('investments.csv'):
            investments_df = pd.read_csv('investments.csv')
            for _, row in investments_df.iterrows():
                db_investment = Investment(
                    user_id=row['user_id'],
                    investment_type=row['investment_type'],
                    amount=row['amount'],
                    current_value=row['current_value'],
                    purchase_date=datetime.strptime(row['purchase_date'], '%Y-%m-%d').date()
                )
                db.add(db_investment)
            db.commit()
        
        return {"message": "Sample data loaded successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading data: {str(e)}")

@app.post("/train-ml-model/")
async def train_ml_model(db: Session = Depends(get_database)):
    """Train the ML model for transaction categorization"""
    success = ml_service.train_categorization_model(db)
    if success:
        return {"message": "ML model trained successfully"}
    else:
        return {"message": "Not enough data to train model"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)