import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .api.routes import router

# Make sure tables are created in the SQLite database on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Holmes OSINT Platform API",
    description="Enterprise-grade Threat Intelligence and Passive Reconnaissance backend.",
    version="1.0.0"
)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Docker Nginx handles proxy, but wildcards are useful for local frontend dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include core OSINT router
app.include_router(router, prefix="/api")

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Holmes OSINT Backend",
        "version": "1.0.0"
    }

@app.get("/health")
def health():
    """Health check endpoint for wake-up ping and frontend status banner."""
    return {"status": "online", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
