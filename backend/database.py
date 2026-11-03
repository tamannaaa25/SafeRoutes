import os
import time
from urllib.parse import urlparse
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

# Load environment variables
load_dotenv()
backend_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(backend_env):
    load_dotenv(backend_env, override=False)

def get_normalized_database_url() -> str:
    raw_url = os.getenv("DATABASE_URL", "").strip()
    if not raw_url:
        # Local development fallback
        return "postgresql+psycopg2://tamanna@/saferoutes_db?host=/tmp"

    # Normalize 'postgres://' scheme to 'postgresql://' for SQLAlchemy 2.x
    if raw_url.startswith("postgres://"):
        raw_url = raw_url.replace("postgres://", "postgresql://", 1)

    # Ensure psycopg2 driver is used if generic postgresql:// scheme is given
    if raw_url.startswith("postgresql://") and not raw_url.startswith("postgresql+"):
        raw_url = raw_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    # Ensure Neon connections have sslmode=require
    if "neon.tech" in raw_url and "sslmode" not in raw_url:
        separator = "&" if "?" in raw_url else "?"
        raw_url = f"{raw_url}{separator}sslmode=require"

    return raw_url

DATABASE_URL = get_normalized_database_url()

# Configure SQLAlchemy engine with robust connection pooling for cloud serverless PostgreSQL
engine_kwargs = {
    "pool_pre_ping": True,     # Detect stale connections from serverless idle timeouts
    "pool_recycle": 300,       # Recycle connections every 5 minutes
    "echo": False
}

# If using remote host (e.g. Neon, Render, Supabase), set pool sizing
if "neon.tech" in DATABASE_URL or "render" in DATABASE_URL or "aws" in DATABASE_URL:
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10
    engine_kwargs["pool_timeout"] = 30

try:
    engine = create_engine(DATABASE_URL, **engine_kwargs)
except Exception as e:
    # Safe local fallback for local development if cloud URL fails to initialize
    local_fallback = "postgresql+psycopg2://tamanna@localhost:5432/saferoutes_db"
    try:
        engine = create_engine(local_fallback, pool_pre_ping=True, echo=False)
    except Exception:
        engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_masked_db_info():
    """Returns database provider and masked host for status reporting without leaking secrets."""
    try:
        host = engine.url.host or "local/socket"
        if "neon.tech" in host:
            provider = "Neon Serverless PostgreSQL"
        elif "render.com" in host:
            provider = "Render Managed PostgreSQL"
        elif "localhost" in host or host.startswith("/") or host == "local/socket":
            provider = "Local PostgreSQL"
        else:
            provider = "Cloud PostgreSQL"
        return {
            "provider": provider,
            "host": host if host.startswith("local") else f"{host[:8]}...{host[-12:]}" if len(host) > 20 else host,
            "port": engine.url.port or 5432,
            "database": engine.url.database or "saferoutes_db"
        }
    except Exception:
        return {
            "provider": "PostgreSQL",
            "host": "configured",
            "port": 5432,
            "database": "saferoutes_db"
        }

def check_db_connection():
    start_time = time.time()
    db_meta = get_masked_db_info()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT current_database(), version();")).fetchone()
            latency_ms = round((time.time() - start_time) * 1000, 2)
            db_name = result[0] if result else db_meta["database"]
            version_str = result[1] if result else "unknown"
            return {
                "connected": True,
                "provider": db_meta["provider"],
                "database_name": db_name,
                "server_version": version_str.split(" on ")[0] if " on " in version_str else version_str[:35],
                "host": db_meta["host"],
                "port": db_meta["port"],
                "latency_ms": latency_ms,
                "error": None
            }
    except Exception as e:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "connected": False,
            "provider": db_meta["provider"],
            "database_name": db_meta["database"],
            "server_version": "Unavailable",
            "host": db_meta["host"],
            "port": db_meta["port"],
            "latency_ms": latency_ms,
            "error": str(e)
        }
