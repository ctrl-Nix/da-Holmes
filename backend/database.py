import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# If /data exists (Docker volume), store the database there. Otherwise, use local directory.
DB_DIR = "/data" if os.path.exists("/data") else "."
DATABASE_URL = f"sqlite:///{os.path.join(DB_DIR, 'holmes.db')}"

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}  # Required for SQLite in multi-threaded contexts
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
