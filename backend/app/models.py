from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Text, Boolean, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from .database import Base



class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)  # NEW: Add password hash
    age = Column(Integer)
    annual_income = Column(Float, nullable=False)
    monthly_income = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationships
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    savings_goals = relationship("SavingsGoal", back_populates="user", cascade="all, delete-orphan")
    investments = relationship("Investment", back_populates="user", cascade="all, delete-orphan")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_user_email_active', 'email', 'is_active'),
    )
    
    def __repr__(self):
        return f"<User(id={self.id}, name='{self.name}', email='{self.email}')>"


# Rest of your models remain the same...

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String(50), nullable=False, index=True)
    description = Column(Text)
    transaction_date = Column(Date, nullable=False, index=True)
    transaction_type = Column(String(20), nullable=False, index=True)  # 'income' or 'expense'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Additional fields for analytics
    tags = Column(String(255))  # Comma-separated tags
    notes = Column(Text)
    is_recurring = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("User", back_populates="transactions")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_transaction_user_date', 'user_id', 'transaction_date'),
        Index('idx_transaction_type_category', 'transaction_type', 'category'),
        Index('idx_transaction_date_amount', 'transaction_date', 'amount'),
    )
    
    def __repr__(self):
        return f"<Transaction(id={self.id}, user_id={self.user_id}, amount={self.amount}, type='{self.transaction_type}')>"

class Budget(Base):
    __tablename__ = "budgets"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(50), nullable=False)
    monthly_limit = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Additional budget fields
    is_active = Column(Boolean, default=True)
    alert_threshold = Column(Float, default=0.8)  # Alert when 80% of budget is used
    rollover_unused = Column(Boolean, default=False)  # Roll over unused budget to next month
    
    # Relationships
    user = relationship("User", back_populates="budgets")
    
    # Unique constraint: one budget per user per category
    __table_args__ = (
        Index('idx_budget_user_category', 'user_id', 'category', unique=True),
    )
    
    def __repr__(self):
        return f"<Budget(id={self.id}, user_id={self.user_id}, category='{self.category}', limit={self.monthly_limit})>"

class SavingsGoal(Base):
    __tablename__ = "savings_goals"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    goal_name = Column(String(100), nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    target_date = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Additional goal fields
    is_achieved = Column(Boolean, default=False)
    priority = Column(String(20), default='medium')  # high, medium, low
    description = Column(Text)
    category = Column(String(50))  # emergency, vacation, house, etc.
    
    # Relationships
    user = relationship("User", back_populates="savings_goals")
    
    # Indexes
    __table_args__ = (
        Index('idx_goal_user_achieved', 'user_id', 'is_achieved'),
        Index('idx_goal_target_date', 'target_date'),
    )
    
    def __repr__(self):
        return f"<SavingsGoal(id={self.id}, user_id={self.user_id}, name='{self.goal_name}', target={self.target_amount})>"

class Investment(Base):
    __tablename__ = "investments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    investment_type = Column(String(50), nullable=False)  # stocks, bonds, etf, crypto, etc.
    symbol = Column(String(20))  # Stock symbol, crypto symbol, etc.
    amount = Column(Float, nullable=False)  # Initial investment
    current_value = Column(Float)  # Current value
    purchase_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Additional investment fields
    quantity = Column(Float)  # Number of shares/units
    purchase_price = Column(Float)  # Price per unit when purchased
    platform = Column(String(50))  # Trading platform
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    user = relationship("User", back_populates="investments")
    
    # Indexes
    __table_args__ = (
        Index('idx_investment_user_type', 'user_id', 'investment_type'),
        Index('idx_investment_symbol', 'symbol'),
        Index('idx_investment_date', 'purchase_date'),
    )
    
    def __repr__(self):
        return f"<Investment(id={self.id}, user_id={self.user_id}, type='{self.investment_type}', amount={self.amount})>"

class Category(Base):
    """Predefined categories for better data consistency"""
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    type = Column(String(20), nullable=False)  # income, expense, investment
    icon = Column(String(50))  # Icon name for UI
    color = Column(String(7))  # Hex color code
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<Category(id={self.id}, name='{self.name}', type='{self.type}')>"

class UserPreferences(Base):
    """User preferences and settings"""
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    currency = Column(String(3), default='USD')  # ISO currency code
    date_format = Column(String(20), default='MM/DD/YYYY')
    timezone = Column(String(50), default='UTC')
    theme = Column(String(20), default='light')  # light, dark
    notifications_enabled = Column(Boolean, default=True)
    budget_alert_threshold = Column(Float, default=0.8)  # Default alert at 80%
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    
    def __repr__(self):
        return f"<UserPreferences(user_id={self.user_id}, currency='{self.currency}', theme='{self.theme}')>"
    