from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, extract, desc
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from . import models, schemas

class UserCRUD:
    @staticmethod
    def create_user(db: Session, user: schemas.UserCreate) -> models.User:
        """Create a new user"""
        db_user = models.User(
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
    
    @staticmethod
    def get_user(db: Session, user_id: int) -> Optional[models.User]:
        """Get user by ID"""
        return db.query(models.User).filter(models.User.id == user_id).first()
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
        """Get user by email"""
        return db.query(models.User).filter(models.User.email == email).first()
    
    @staticmethod
    def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
        """Get all users with pagination"""
        return db.query(models.User).filter(models.User.is_active == True).offset(skip).limit(limit).all()
    
    @staticmethod
    def update_user(db: Session, user_id: int, user_update: schemas.UserCreate) -> Optional[models.User]:
        """Update user information"""
        db_user = db.query(models.User).filter(models.User.id == user_id).first()
        if db_user:
            db_user.name = user_update.name
            db_user.email = user_update.email
            db_user.age = user_update.age
            db_user.annual_income = user_update.annual_income
            db_user.monthly_income = user_update.annual_income / 12
            db.commit()
            db.refresh(db_user)
        return db_user

class TransactionCRUD:
    @staticmethod
    def create_transaction(db: Session, transaction: schemas.TransactionCreate, user_id: int) -> models.Transaction:
        """Create a new transaction"""
        db_transaction = models.Transaction(
            user_id=user_id,
            amount=transaction.amount,
            category=transaction.category,
            description=transaction.description,
            transaction_date=transaction.transaction_date,
            transaction_type=transaction.transaction_type,
            tags=transaction.tags,
            notes=transaction.notes,
            is_recurring=transaction.is_recurring
        )
        db.add(db_transaction)
        db.commit()
        db.refresh(db_transaction)
        return db_transaction
    
    @staticmethod
    def get_transactions(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[models.Transaction]:
        """Get user transactions with pagination"""
        return (db.query(models.Transaction)
                .filter(models.Transaction.user_id == user_id)
                .order_by(desc(models.Transaction.transaction_date))
                .offset(skip)
                .limit(limit)
                .all())
    
    @staticmethod
    def get_transactions_by_date_range(db: Session, user_id: int, start_date: datetime, end_date: datetime) -> List[models.Transaction]:
        """Get transactions within date range"""
        return (db.query(models.Transaction)
                .filter(
                    models.Transaction.user_id == user_id,
                    models.Transaction.transaction_date >= start_date.date(),
                    models.Transaction.transaction_date <= end_date.date()
                )
                .order_by(desc(models.Transaction.transaction_date))
                .all())
    
    @staticmethod
    def get_transactions_by_category(db: Session, user_id: int, category: str) -> List[models.Transaction]:
        """Get transactions by category"""
        return (db.query(models.Transaction)
                .filter(
                    models.Transaction.user_id == user_id,
                    models.Transaction.category == category
                )
                .order_by(desc(models.Transaction.transaction_date))
                .all())
    
    @staticmethod
    def get_monthly_spending_by_category(db: Session, user_id: int, year: int, month: int) -> Dict[str, float]:
        """Get monthly spending by category"""
        transactions = (db.query(models.Transaction)
                       .filter(
                           models.Transaction.user_id == user_id,
                           models.Transaction.transaction_type == 'expense',
                           extract('year', models.Transaction.transaction_date) == year,
                           extract('month', models.Transaction.transaction_date) == month
                       )
                       .all())
        
        spending_by_category = {}
        for transaction in transactions:
            category = transaction.category
            spending_by_category[category] = spending_by_category.get(category, 0) + transaction.amount
        
        return spending_by_category

class BudgetCRUD:
    @staticmethod
    def create_or_update_budget(db: Session, budget: schemas.BudgetCreate, user_id: int) -> models.Budget:
        """Create new budget or update existing one"""
        existing_budget = (db.query(models.Budget)
                          .filter(
                              models.Budget.user_id == user_id,
                              models.Budget.category == budget.category
                          )
                          .first())
        
        if existing_budget:
            existing_budget.monthly_limit = budget.monthly_limit
            existing_budget.alert_threshold = budget.alert_threshold
            existing_budget.rollover_unused = budget.rollover_unused
            db.commit()
            db.refresh(existing_budget)
            return existing_budget
        else:
            db_budget = models.Budget(
                user_id=user_id,
                category=budget.category,
                monthly_limit=budget.monthly_limit,
                alert_threshold=budget.alert_threshold,
                rollover_unused=budget.rollover_unused
            )
            db.add(db_budget)
            db.commit()
            db.refresh(db_budget)
            return db_budget
    
    @staticmethod
    def get_user_budgets(db: Session, user_id: int) -> List[models.Budget]:
        """Get all budgets for a user"""
        return (db.query(models.Budget)
                .filter(
                    models.Budget.user_id == user_id,
                    models.Budget.is_active == True
                )
                .all())
    
    @staticmethod
    def delete_budget(db: Session, budget_id: int, user_id: int) -> bool:
        """Delete a budget"""
        budget = (db.query(models.Budget)
                 .filter(
                     models.Budget.id == budget_id,
                     models.Budget.user_id == user_id
                 )
                 .first())
        
        if budget:
            db.delete(budget)
            db.commit()
            return True
        return False

class AnalyticsCRUD:
    @staticmethod
    def get_spending_summary(db: Session, user_id: int, months: int = 12) -> Dict[str, Any]:
        """Get comprehensive spending summary"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months * 30)
        
        transactions = TransactionCRUD.get_transactions_by_date_range(db, user_id, start_date, end_date)
        
        total_income = sum(t.amount for t in transactions if t.transaction_type == 'income')
        total_expenses = sum(t.amount for t in transactions if t.transaction_type == 'expense')
        
        # Category breakdown
        category_spending = {}
        for transaction in transactions:
            if transaction.transaction_type == 'expense':
                category = transaction.category
                category_spending[category] = category_spending.get(category, 0) + transaction.amount
        
        # Monthly trends
        monthly_data = {}
        for transaction in transactions:
            month_key = transaction.transaction_date.strftime('%Y-%m')
            if month_key not in monthly_data:
                monthly_data[month_key] = {'income': 0, 'expenses': 0}
            
            if transaction.transaction_type == 'income':
                monthly_data[month_key]['income'] += transaction.amount
            else:
                monthly_data[month_key]['expenses'] += transaction.amount
        
        return {
            'total_income': total_income,
            'total_expenses': total_expenses,
            'savings_rate': (total_income - total_expenses) / total_income if total_income > 0 else 0,
            'category_spending': category_spending,
            'monthly_trends': monthly_data,
            'transaction_count': len(transactions)
        }
    
    @staticmethod
    def get_budget_performance(db: Session, user_id: int) -> List[Dict[str, Any]]:
        """Get budget vs actual spending performance"""
        budgets = BudgetCRUD.get_user_budgets(db, user_id)
        current_month_spending = TransactionCRUD.get_monthly_spending_by_category(
            db, user_id, datetime.now().year, datetime.now().month
        )
        
        performance = []
        for budget in budgets:
            spent = current_month_spending.get(budget.category, 0)
            percentage = (spent / budget.monthly_limit) * 100 if budget.monthly_limit > 0 else 0
            
            performance.append({
                'category': budget.category,
                'budget_limit': budget.monthly_limit,
                'current_spending': spent,
                'percentage_used': percentage,
                'remaining': budget.monthly_limit - spent,
                'alert_threshold': budget.alert_threshold,
                'is_over_budget': percentage > 100,
                'is_near_limit': percentage >= (budget.alert_threshold * 100)
            })
        
        return performance

# Initialize CRUD instances
user_crud = UserCRUD()
transaction_crud = TransactionCRUD()
budget_crud = BudgetCRUD()
analytics_crud = AnalyticsCRUD()