from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import event
import os

# Dynamically resolve DATABASE_URL and database engine settings
RAW_DATABASE_URL = os.getenv("DATABASE_URL", "")

if RAW_DATABASE_URL:
    # Support PostgreSQL with asyncpg driver
    # Platforms like Heroku, Render, or Neon often provide postgres:// or postgresql:// URLs
    if RAW_DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = RAW_DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    elif RAW_DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = RAW_DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    else:
        DATABASE_URL = RAW_DATABASE_URL
    
    engine_args = {}
else:
    # Default to local SQLite database path using aiosqlite for async compatibility
    DATABASE_URL = "sqlite+aiosqlite:///./holmes.db"
    engine_args = {
        "connect_args": {"check_same_thread": False}
    }

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    **engine_args
)

# Configure the async session maker
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Declarative base class for SQLAlchemy models
class Base(DeclarativeBase):
    pass

# Event listener to enable foreign key constraints for SQLite connection sessions
@event.listens_for(engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if "sqlite" in engine.url.drivername:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

# FastAPI dependency to yield database sessions
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
