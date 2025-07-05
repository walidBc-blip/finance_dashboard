from pydantic import BaseModel, EmailStr, validator
from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, EmailStr, validator
from typing import Optional

# User schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    age: int
    annual_income: float

    @validator('age')
    def validate_age(cls, v):
        if v < 18 or v > 120:
            raise ValueError('Age must be between 18 and 120')
        return v
    
    @validator('annual_income')
    def validate_income(cls, v):
        if v < 0:
            raise ValueError('Annual income must be positive')
        return v

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    monthly_income: float
    created_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

# Transaction schemas
class TransactionBase(BaseModel):
    amount: float
    category: str
    description: str
    transaction_date: date
    transaction_type: str
    tags: Optional[str] = None
    notes: Optional[str] = None
    is_recurring: bool = False

    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v
    
    @validator('transaction_type')
    def validate_transaction_type(cls, v):
        if v not in ['income', 'expense']:
            raise ValueError('Transaction type must be either "income" or "expense"')
        return v

class TransactionCreate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Budget schemas
class BudgetBase(BaseModel):
    category: str
    monthly_limit: float
    alert_threshold: float = 0.8
    rollover_unused: bool = False

    @validator('monthly_limit')
    def validate_monthly_limit(cls, v):
        if v <= 0:
            raise ValueError('Monthly limit must be positive')
        return v
    
    @validator('alert_threshold')
    def validate_alert_threshold(cls, v):
        if v <= 0 or v > 1:
            raise ValueError('Alert threshold must be between 0 and 1')
        return v

class BudgetCreate(BudgetBase):
    pass

class BudgetResponse(BudgetBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Savings Goal schemas
class SavingsGoalBase(BaseModel):
    goal_name: str
    target_amount: float
    current_amount: float = 0.0
    target_date: Optional[date] = None
    priority: str = 'medium'
    description: Optional[str] = None
    category: Optional[str] = None

    @validator('target_amount', 'current_amount')
    def validate_amounts(cls, v):
        if v < 0:
            raise ValueError('Amounts must be non-negative')
        return v
    
    @validator('priority')
    def validate_priority(cls, v):
        if v not in ['high', 'medium', 'low']:
            raise ValueError('Priority must be high, medium, or low')
        return v

class SavingsGoalCreate(SavingsGoalBase):
    pass

class SavingsGoalResponse(SavingsGoalBase):
    id: int
    user_id: int
    is_achieved: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Investment schemas
class InvestmentBase(BaseModel):
    investment_type: str
    symbol: Optional[str] = None
    amount: float
    current_value: Optional[float] = None
    purchase_date: date
    quantity: Optional[float] = None
    purchase_price: Optional[float] = None
    platform: Optional[str] = None
    notes: Optional[str] = None

    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Investment amount must be positive')
        return v

class InvestmentCreate(InvestmentBase):
    pass

class InvestmentResponse(InvestmentBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Analytics response schemas
class SpendingAnalysis(BaseModel):
    total_income: float
    total_expenses: float
    savings_rate: float
    top_categories: List[dict]
    monthly_trends: List[dict]
    transaction_count: int

class BudgetAlert(BaseModel):
    category: str
    budget_limit: float
    current_spending: float
    percentage_used: float
    remaining: float
    alert_threshold: float
    is_over_budget: bool
    is_near_limit: bool
    days_remaining_in_month: int

class FinancialHealthScore(BaseModel):
    score: int
    category: str
    recommendations: List[str]
    savings_rate: float
    budget_adherence: float
    metrics: dict

# Database info schema
class DatabaseInfo(BaseModel):
    database_url: str
    engine: str
    tables: List[str]
    status: str



# Authentication schemas
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    confirm_password: str
    age: int
    annual_income: float

    @validator('name')
    def validate_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters long')
        return v.strip()
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v
    
    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v
    
    @validator('age')
    def validate_age(cls, v):
        if v < 18 or v > 120:
            raise ValueError('Age must be between 18 and 120')
        return v
    
    @validator('annual_income')
    def validate_income(cls, v):
        if v < 0:
            raise ValueError('Annual income must be positive')
        return v

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None    