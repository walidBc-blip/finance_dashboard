from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text, and_, func, extract
from datetime import datetime, timedelta
import calendar
from sqlalchemy import text, and_, func, extract, or_
from typing import List
from .routes.auth import router as auth_router

# Import database components
from app.database import get_database, init_database
from app.models import User, Transaction, Budget
from app.schemas import UserCreate, UserResponse, TransactionCreate, TransactionResponse, BudgetCreate, BudgetResponse

# Create FastAPI app with enhanced metadata
app = FastAPI(
    title="Personal Finance Dashboard API", 
    description="A comprehensive personal finance management API with real database integration",
    version="4.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.include_router(auth_router)

# CORS middleware - allowing both common React dev server ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_database()
    print("🚀 Personal Finance Dashboard API - Database initialized!")
    print("📊 Version 4.0.0 - Ready for frontend integration")

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Personal Finance Dashboard API",
        "version": "4.0.0",
        "status": "running",
        "database": "connected",
        "features": [
            "User Management",
            "Transaction Tracking", 
            "Budget Management",
            "Financial Analytics",
            "Spending Analysis",
            "Budget Alerts"
        ],
        "docs": "/docs",
        "endpoints": {
            "users": "/users/",
            "transactions": "/users/{user_id}/transactions/",
            "budgets": "/users/{user_id}/budgets/",
            "analytics": "/users/{user_id}/spending-analysis/",
            "health": "/health"
        }
    }

# Health check endpoint
@app.get("/health")
async def health_check(db: Session = Depends(get_database)):
    try:
        result = db.execute(text("SELECT 1")).fetchone()
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now().isoformat(),
            "version": "4.0.0"
        }
    except Exception as e:
        return {
            "status": "unhealthy", 
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# ============================================================================
# USER MANAGEMENT ENDPOINTS
# ============================================================================

@app.post("/users/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db: Session = Depends(get_database)):
    """Create a new user"""
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
    """Get all active users"""
    users = db.query(User).filter(User.is_active == True).offset(skip).limit(limit).all()
    return users

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_database)):
    """Get user by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_update: UserCreate, db: Session = Depends(get_database)):
    """Update user information"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.name = user_update.name
    user.email = user_update.email
    user.age = user_update.age
    user.annual_income = user_update.annual_income
    user.monthly_income = user_update.annual_income / 12
    
    db.commit()
    db.refresh(user)
    return user

# ============================================================================
# TRANSACTION MANAGEMENT ENDPOINTS  
# ============================================================================

@app.post("/users/{user_id}/transactions/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(user_id: int, transaction: TransactionCreate, db: Session = Depends(get_database)):
    """Create a new transaction for a user"""
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
async def get_user_transactions(
    user_id: int, 
    skip: int = 0, 
    limit: int = 50, 
    category: str = None,
    transaction_type: str = None,
    db: Session = Depends(get_database)
):
    """Get user transactions with optional filtering"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    query = db.query(Transaction).filter(Transaction.user_id == user_id)
    
    # Apply filters if provided
    if category:
        query = query.filter(Transaction.category == category)
    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type)
    
    transactions = (query
                   .order_by(Transaction.transaction_date.desc())
                   .offset(skip)
                   .limit(limit)
                   .all())
    return transactions

@app.get("/users/{user_id}/transactions/categories/")
async def get_transaction_categories(user_id: int, db: Session = Depends(get_database)):
    """Get all unique categories for a user's transactions"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    categories = (db.query(Transaction.category)
                 .filter(Transaction.user_id == user_id)
                 .distinct()
                 .all())
    
    return {"categories": [cat[0] for cat in categories]}

# ============================================================================
# BUDGET MANAGEMENT ENDPOINTS
# ============================================================================

@app.post("/users/{user_id}/budgets/", response_model=BudgetResponse)
async def create_or_update_budget(user_id: int, budget: BudgetCreate, db: Session = Depends(get_database)):
    """Create or update a budget for a specific category"""
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
    """Get all active budgets for a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    budgets = db.query(Budget).filter(Budget.user_id == user_id, Budget.is_active == True).all()
    return budgets

@app.delete("/users/{user_id}/budgets/{budget_id}")
async def delete_budget(user_id: int, budget_id: int, db: Session = Depends(get_database)):
    """Delete a budget"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    db.delete(budget)
    db.commit()
    return {"message": "Budget deleted successfully"}

# ============================================================================
# ANALYTICS ENDPOINTS
# ============================================================================

@app.get("/users/{user_id}/spending-analysis")
async def get_user_spending_analysis(user_id: int, db: Session = Depends(get_database)):
    """Get spending analysis for a specific user only"""
    
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get only THIS user's transactions
    user_transactions = db.query(Transaction).filter(Transaction.user_id == user_id).all()
    
    # If user has no transactions, return empty/default data
    if not user_transactions:
        return {
            "total_income": 0,
            "total_expenses": 0,
            "transaction_count": 0,
            "savings_rate": 0,
            "top_categories": [],
            "monthly_trends": [
                {"month": "Jan", "income": 0, "expenses": 0, "net": 0},
                {"month": "Feb", "income": 0, "expenses": 0, "net": 0},
                {"month": "Mar", "income": 0, "expenses": 0, "net": 0}
            ]
        }
    
    # Calculate spending analysis from user's transactions only
    total_income = sum(t.amount for t in user_transactions if t.transaction_type == "income")
    total_expenses = sum(t.amount for t in user_transactions if t.transaction_type == "expense")
    
    # Group by category for this user only
    from collections import defaultdict
    category_totals = defaultdict(float)
    for transaction in user_transactions:
        if transaction.transaction_type == "expense":
            category_totals[transaction.category] += transaction.amount
    
    # Convert to list format
    top_categories = [
        {
            "category": category,
            "amount": amount,
            "percentage": round((amount / total_expenses * 100), 1) if total_expenses > 0 else 0
        }
        for category, amount in sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:5]
    ]
    
    # Calculate savings rate
    savings_rate = round(((total_income - total_expenses) / total_income * 100), 1) if total_income > 0 else 0
    
    # Simple monthly trends (you can make this more sophisticated)
    monthly_trends = [
        {"month": "Jan", "income": total_income * 0.3, "expenses": total_expenses * 0.3, "net": (total_income - total_expenses) * 0.3},
        {"month": "Feb", "income": total_income * 0.3, "expenses": total_expenses * 0.3, "net": (total_income - total_expenses) * 0.3},
        {"month": "Mar", "income": total_income * 0.4, "expenses": total_expenses * 0.4, "net": (total_income - total_expenses) * 0.4}
    ]
    
    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "transaction_count": len(user_transactions),
        "savings_rate": max(0, savings_rate),  # Don't show negative savings rate
        "top_categories": top_categories,
        "monthly_trends": monthly_trends
    }


@app.get("/users/{user_id}/budget-alerts/")
async def get_budget_alerts(user_id: int, db: Session = Depends(get_database)):
    """Get budget alerts and spending warnings"""
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
            "days_remaining": days_remaining,
            "is_over_budget": percentage > 100,
            "is_near_limit": percentage >= 75
        })
    
    return {"alerts": sorted(alerts, key=lambda x: x["percentage_used"], reverse=True)}

@app.get("/users/{user_id}/financial-health-score/")
async def get_financial_health_score(user_id: int, db: Session = Depends(get_database)):
    """Calculate and return financial health score"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get recent transactions (last 6 months)
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
            "budget_adherence": 0.0,
            "metrics": {
                "income_stability": 50,
                "expense_control": 50,
                "savings_rate": 0
            }
        }
    
    total_income = sum(t.amount for t in transactions if t.transaction_type == 'income')
    total_expenses = sum(t.amount for t in transactions if t.transaction_type == 'expense')
    
    # Calculate savings rate
    savings_rate = (total_income - total_expenses) / total_income if total_income > 0 else 0
    savings_score = min(100, max(0, savings_rate * 200))  # Scale to 0-100
    
    # Calculate budget adherence (simplified)
    budget_score = 75.0  # Default value - will enhance this later
    
    # Calculate final score
    final_score = int(savings_score * 0.6 + budget_score * 0.4)
    final_score = max(0, min(100, final_score))
    
    # Determine category and recommendations
    if final_score >= 85:
        category = "Excellent"
        recommendations = [
            "Outstanding financial management!",
            "Consider increasing investment contributions",
            "You're on track for financial independence"
        ]
    elif final_score >= 70:
        category = "Good"
        recommendations = [
            "You're doing well with your finances",
            "Try to increase your savings rate",
            "Consider setting up automated savings"
        ]
    elif final_score >= 55:
        category = "Fair" 
        recommendations = [
            "Focus on creating and sticking to a budget",
            "Look for areas to reduce expenses",
            "Build an emergency fund"
        ]
    else:
        category = "Needs Improvement"
        recommendations = [
            "Create a detailed monthly budget",
            "Track all expenses carefully",
            "Focus on reducing unnecessary spending",
            "Consider increasing your income"
        ]
    
    return {
        "score": final_score,
        "category": category,
        "recommendations": recommendations,
        "savings_rate": round(savings_rate * 100, 1),
        "budget_adherence": budget_score,
        "metrics": {
            "income_stability": 75,  # Will calculate properly later
            "expense_control": int(budget_score),
            "savings_rate": int(savings_score)
        }
    }

# ============================================================================
# DEVELOPMENT & UTILITY ENDPOINTS
# ============================================================================

@app.post("/dev/create-sample-data/")
async def create_sample_data(db: Session = Depends(get_database)):
    """Create sample data for development and testing"""
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
        
        # Create sample budgets and transactions for each user
        for user in created_users:
            # Create budgets
            budget_data = [
                {"category": "Housing", "monthly_limit": 1800},
                {"category": "Food", "monthly_limit": 600},
                {"category": "Transportation", "monthly_limit": 400},
                {"category": "Entertainment", "monthly_limit": 300},
                {"category": "Utilities", "monthly_limit": 200},
                {"category": "Healthcare", "monthly_limit": 250}
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
                {"amount": 150, "category": "Entertainment", "description": "Movies and dining", "transaction_type": "expense"},
                {"amount": 100, "category": "Utilities", "description": "Electric bill", "transaction_type": "expense"},
                {"amount": 80, "category": "Healthcare", "description": "Doctor visit", "transaction_type": "expense"}
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
            "status": "success",
            "next_steps": [
                "Visit /docs to explore all API endpoints",
                "Test the frontend with this data",
                "Start building your dashboard components"
            ]
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating sample data: {str(e)}")

@app.get("/dev/database-info/")
async def get_database_info(db: Session = Depends(get_database)):
    """Get database information for development"""
    try:
        # Count records in each table
        user_count = db.query(User).count()
        transaction_count = db.query(Transaction).count() 
        budget_count = db.query(Budget).count()
        
        return {
            "database_status": "connected",
            "tables": {
                "users": user_count,
                "transactions": transaction_count,
                "budgets": budget_count
            },
            "sample_data_available": user_count > 0,
            "ready_for_frontend": True
        }
    except Exception as e:
        return {
            "database_status": "error",
            "error": str(e)
        }
# Add these endpoints to your backend/app/main.py file

# Update Transaction Endpoint
@app.put("/users/{user_id}/transactions/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    user_id: int, 
    transaction_id: int, 
    transaction: TransactionCreate, 
    db: Session = Depends(get_database)
):
    """Update an existing transaction"""
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get the transaction
    db_transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == user_id
    ).first()
    
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Update transaction fields
    db_transaction.amount = transaction.amount
    db_transaction.category = transaction.category
    db_transaction.description = transaction.description
    db_transaction.transaction_date = transaction.transaction_date
    db_transaction.transaction_type = transaction.transaction_type
    
    # Update optional fields if provided
    if hasattr(transaction, 'tags'):
        db_transaction.tags = transaction.tags
    if hasattr(transaction, 'notes'):
        db_transaction.notes = transaction.notes
    if hasattr(transaction, 'is_recurring'):
        db_transaction.is_recurring = transaction.is_recurring
    
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

# Delete Transaction Endpoint
@app.delete("/users/{user_id}/transactions/{transaction_id}")
async def delete_transaction(
    user_id: int, 
    transaction_id: int, 
    db: Session = Depends(get_database)
):
    """Delete a transaction"""
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get the transaction
    db_transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == user_id
    ).first()
    
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    db.delete(db_transaction)
    db.commit()
    
    return {"message": "Transaction deleted successfully", "transaction_id": transaction_id}

# Enhanced Get Transactions with better filtering
@app.get("/users/{user_id}/transactions/", response_model=List[TransactionResponse])
async def get_user_transactions(
    user_id: int,
    skip: int = 0,
    limit: int = 50,
    category: str = None,
    transaction_type: str = None,
    start_date: str = None,
    end_date: str = None,
    search: str = None,
    db: Session = Depends(get_database)
):
    """Get user transactions with advanced filtering"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Build query with filters
    query = db.query(Transaction).filter(Transaction.user_id == user_id)
    
    if category:
        query = query.filter(Transaction.category == category)
    
    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type)
    
    if start_date:
        try:
            start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
            query = query.filter(Transaction.transaction_date >= start_date_obj)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
    
    if end_date:
        try:
            end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date()
            query = query.filter(Transaction.transaction_date <= end_date_obj)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Transaction.description.ilike(search_pattern),
                Transaction.category.ilike(search_pattern),
                Transaction.notes.ilike(search_pattern)
            )
        )
    
    transactions = (query
                   .order_by(Transaction.transaction_date.desc(), Transaction.created_at.desc())
                   .offset(skip)
                   .limit(limit)
                   .all())
    
    return transactions

# Get Single Transaction Endpoint (useful for editing)
@app.get("/users/{user_id}/transactions/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    user_id: int, 
    transaction_id: int, 
    db: Session = Depends(get_database)
):
    """Get a specific transaction"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == user_id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return transaction

# Bulk Delete Transactions (for the bulk actions in frontend)
@app.delete("/users/{user_id}/transactions/bulk")
async def bulk_delete_transactions(
    user_id: int,
    transaction_ids: List[int],
    db: Session = Depends(get_database)
):
    """Delete multiple transactions"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete transactions
    deleted_count = db.query(Transaction).filter(
        Transaction.id.in_(transaction_ids),
        Transaction.user_id == user_id
    ).delete(synchronize_session=False)
    
    db.commit()
    
    return {
        "message": f"Successfully deleted {deleted_count} transactions",
        "deleted_count": deleted_count,
        "transaction_ids": transaction_ids
    }
@app.put("/users/{user_id}/transactions/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    user_id: int, 
    transaction_id: int, 
    transaction: TransactionCreate, 
    db: Session = Depends(get_database)
):
    """Update an existing transaction"""
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get the transaction
    db_transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == user_id
    ).first()
    
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Update transaction fields
    db_transaction.amount = transaction.amount
    db_transaction.category = transaction.category
    db_transaction.description = transaction.description
    db_transaction.transaction_date = transaction.transaction_date
    db_transaction.transaction_type = transaction.transaction_type
    db_transaction.tags = transaction.tags
    db_transaction.notes = transaction.notes
    db_transaction.is_recurring = transaction.is_recurring
    
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

# DELETE TRANSACTION ENDPOINT
@app.delete("/users/{user_id}/transactions/{transaction_id}")
async def delete_transaction(
    user_id: int, 
    transaction_id: int, 
    db: Session = Depends(get_database)
):
    """Delete a transaction"""
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get the transaction
    db_transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == user_id
    ).first()
    
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    db.delete(db_transaction)
    db.commit()
    
    return {
        "message": "Transaction deleted successfully", 
        "transaction_id": transaction_id,
        "status": "success"
    }

# ENHANCED GET TRANSACTIONS (replace your existing one or add filtering)
@app.get("/users/{user_id}/transactions/", response_model=List[TransactionResponse])
async def get_user_transactions(
    user_id: int,
    skip: int = 0,
    limit: int = 50,
    category: str = None,
    transaction_type: str = None,
    start_date: str = None,
    end_date: str = None,
    search: str = None,
    db: Session = Depends(get_database)
):
    """Get user transactions with advanced filtering"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Build query with filters
    query = db.query(Transaction).filter(Transaction.user_id == user_id)
    
    # Apply filters
    if category and category != 'all':
        query = query.filter(Transaction.category == category)
    
    if transaction_type and transaction_type != 'all':
        query = query.filter(Transaction.transaction_type == transaction_type)
    
    if start_date:
        try:
            from datetime import datetime
            start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
            query = query.filter(Transaction.transaction_date >= start_date_obj)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
    
    if end_date:
        try:
            from datetime import datetime
            end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date()
            query = query.filter(Transaction.transaction_date <= end_date_obj)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Transaction.description.ilike(search_pattern),
                Transaction.category.ilike(search_pattern),
                Transaction.notes.ilike(search_pattern) if Transaction.notes else False
            )
        )
    
    # Execute query with ordering
    transactions = (query
                   .order_by(Transaction.transaction_date.desc(), Transaction.created_at.desc())
                   .offset(skip)
                   .limit(limit)
                   .all())
    
    return transactions

# GET SINGLE TRANSACTION
@app.get("/users/{user_id}/transactions/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    user_id: int, 
    transaction_id: int, 
    db: Session = Depends(get_database)
):
    """Get a specific transaction by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == user_id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return transaction

# BULK DELETE TRANSACTIONS
@app.delete("/users/{user_id}/transactions/bulk")
async def bulk_delete_transactions(
    user_id: int,
    transaction_ids: List[int],
    db: Session = Depends(get_database)
):
    """Delete multiple transactions at once"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not transaction_ids:
        raise HTTPException(status_code=400, detail="No transaction IDs provided")
    
    # Delete transactions
    deleted_count = db.query(Transaction).filter(
        Transaction.id.in_(transaction_ids),
        Transaction.user_id == user_id
    ).delete(synchronize_session=False)
    
    db.commit()
    
    return {
        "message": f"Successfully deleted {deleted_count} transactions",
        "deleted_count": deleted_count,
        "transaction_ids": transaction_ids,
        "status": "success"
    }

# TRANSACTION STATISTICS (bonus endpoint for dashboard)
@app.get("/users/{user_id}/transactions/stats/")
async def get_transaction_stats(user_id: int, db: Session = Depends(get_database)):
    """Get transaction statistics for dashboard"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get counts by type
    total_transactions = db.query(Transaction).filter(Transaction.user_id == user_id).count()
    income_count = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == 'income'
    ).count()
    expense_count = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == 'expense'
    ).count()
    
    # Get unique categories
    categories = db.query(Transaction.category).filter(
        Transaction.user_id == user_id
    ).distinct().all()
    unique_categories = len([cat[0] for cat in categories])
    
    # Get latest transaction
    latest_transaction = db.query(Transaction).filter(
        Transaction.user_id == user_id
    ).order_by(Transaction.created_at.desc()).first()
    
    return {
        "total_transactions": total_transactions,
        "income_transactions": income_count,
        "expense_transactions": expense_count,
        "unique_categories": unique_categories,
        "latest_transaction_date": latest_transaction.transaction_date if latest_transaction else None,
        "latest_transaction_id": latest_transaction.id if latest_transaction else None
    }


# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
