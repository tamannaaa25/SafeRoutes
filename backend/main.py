import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

try:
    from database import engine, Base
    from routes import health, datasets, analytics, ai
except ImportError:
    from backend.database import engine, Base
    from backend.routes import health, datasets, analytics, ai

app = FastAPI(
    title="SafeRoutes - Road Safety Analytics & Decision Support API",
    description="Full-stack backend providing PostgreSQL relational analytics, Pandas/NumPy data cleaning & validation, SQL demonstration runners, and Gemini-powered safety insights.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Warning: Database auto-migration skipped or failed: {e}")

app.include_router(health.router, prefix="/api")
app.include_router(datasets.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(ai.router, prefix="/api")

@app.get("/")
def root():
    return {
        "service": "SafeRoutes Decision Support API",
        "status": "operational",
        "version": "2.0.0",
        "docs_url": "/docs",
        "health_check": "/api/health",
        "database_status": "/api/database/status"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
