# backend/setup_auth.py - Quick setup script to create auth files

import os

# Create routes directory if it doesn't exist
os.makedirs('app/routes', exist_ok=True)

# Create __init__.py for routes
with open('app/routes/__init__.py', 'w') as f:
    f.write('')

# Create auth.py file
auth_py_content = '''
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from ..database import get_database
from ..models import User

# Security configuration
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Bearer token scheme
security = HTTPBearer()

class AuthService:
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
        """Create a JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Optional[str]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email: str = payload.get("sub")
            if email is None:
                return None
            return email
        except JWTError:
            return None

# Dependency to get current user
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_database)
) -> User:
    """Get current authenticated user"""
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        email = AuthService.verify_token(credentials.credentials)
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    
    return user
'''

with open('app/auth.py', 'w') as f:
    f.write(auth_py_content)

# Create auth routes
auth_routes_content = '''
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_database
from ..models import User
from ..auth import AuthService, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user
from pydantic import BaseModel, EmailStr, validator

# Schemas
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

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_database)):
    """Register a new user"""
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password and create user
    hashed_password = AuthService.get_password_hash(user_data.password)
    
    db_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hashed_password,
        age=user_data.age,
        annual_income=user_data.annual_income,
        monthly_income=user_data.annual_income / 12
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = AuthService.create_access_token(
        data={"sub": db_user.email}, 
        expires_delta=access_token_expires
    )
    
    # Convert user to dict for response
    user_dict = {
        "id": db_user.id,
        "name": db_user.name,
        "email": db_user.email,
        "age": db_user.age,
        "annual_income": db_user.annual_income,
        "monthly_income": db_user.monthly_income
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_dict
    }

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, db: Session = Depends(get_database)):
    """Authenticate user and return token"""
    
    # Find user by email
    user = db.query(User).filter(User.email == user_credentials.email).first()
    
    if not user or not AuthService.verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = AuthService.create_access_token(
        data={"sub": user.email}, 
        expires_delta=access_token_expires
    )
    
    # Convert user to dict for response
    user_dict = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "age": user.age,
        "annual_income": user.annual_income,
        "monthly_income": user.monthly_income
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_dict
    }

@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "age": current_user.age,
        "annual_income": current_user.annual_income,
        "monthly_income": current_user.monthly_income
    }

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout user"""
    return {"message": "Successfully logged out"}
'''

with open('app/routes/auth.py', 'w') as f:
    f.write(auth_routes_content)

print("✅ Auth files created successfully!")
print("📁 Created:")
print("  - app/auth.py")
print("  - app/routes/__init__.py") 
print("  - app/routes/auth.py")
print("\n🔧 Next: Add this line to your main.py:")
print("from app.routes.auth import router as auth_router")
print("app.include_router(auth_router)")