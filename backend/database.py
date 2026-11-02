import os
import time
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DEFAULT_DB_URL = "postgresql+psycopg2://tamanna@/saferoutes_db?host=/tmp"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DB_URL)

try:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, echo=False)
except Exception:
    fallback_url = "postgresql+psycopg2://tamanna@localhost:5432/saferoutes_db"
    engine = create_engine(fallback_url, pool_pre_ping=True, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_db_connection():
    start_time = time.time()
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT current_database(), version();")).fetchone()
            latency_ms = round((time.time() - start_time) * 1000, 2)
            db_name = result[0] if result else "unknown"
            version_str = result[1] if result else "unknown"
            return {
                "connected": True,
                "database_name": db_name,
                "server_version": version_str.split(" on ")[0] if " on " in version_str else version_str[:30],
                "latency_ms": latency_ms,
                "error": None
            }
    except Exception as e:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "connected": False,
            "database_name": "saferoutes_db",
            "server_version": "Unavailable",
            "latency_ms": latency_ms,
            "error": str(e)
        }
