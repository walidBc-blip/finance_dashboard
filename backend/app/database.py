import os
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite:///./finance_app.db"  # SQLite for development, easy to switch to PostgreSQL
)

# Create engine with appropriate settings
if "sqlite" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        connect_args={
            "check_same_thread": False,
        },
        poolclass=StaticPool,
        echo=True  # Set to False in production
    )
    
    # Enable foreign key support for SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
else:
    # PostgreSQL configuration (for production)
    engine = create_engine(
        DATABASE_URL,
        echo=True  # Set to False in production
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Database dependency
def get_database():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_database():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

# Database utilities
def reset_database():
    """Reset database (development only)"""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Database reset completed!")

def get_db_info():
    """Get database information"""
    return {
        "database_url": DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else DATABASE_URL,
        "engine": str(engine.url),
        "tables": Base.metadata.tables.keys()
    }