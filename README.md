# SafeRoutes – Road Safety Analytics and Decision Support System

**SafeRoutes** is a full-stack, data-driven platform that helps road safety engineers, transportation analysts, and university evaluators manage, clean, and analyze road accident datasets, identify high-frequency crash corridors, run live relational SQL queries, and generate actionable engineering interventions to support data-informed road safety planning.

---

## 🌟 Full-Stack Architecture

SafeRoutes follows a clean, decoupled full-stack architecture:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      React (Vite) Frontend                              │
│   Dashboard UI • Recharts • Database Explorer • Data Quality Studio     │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │ HTTP / REST (/api/*)
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     FastAPI Python Backend                              │
│   Endpoints: /api/health • /api/datasets • /api/analytics • /api/ai     │
└──────────────────┬───────────────────────────────┬──────────────────────┘
                   │                               │
                   ▼                               ▼
┌─────────────────────────────────────┐  ┌────────────────────────────────┐
│   Pandas & NumPy Data Pipeline      │  │     Google Gemini API          │
│ • Column Synonym Standardization    │  │ • Observational Safety Summaries│
│ • Date/Time & Coordinate Validation │  │ • Engineering Interventions    │
│ • Composite Key Duplicate Detection │  │ • Strict SQL Database Grounding│
│ • Deterministic Data Quality Report │  │ • Fallback Rule Engine         │
└──────────────────┬──────────────────┘  └────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│               PostgreSQL Database (`saferoutes_db`)                     │
│  Relational Tables: datasets • accidents • data_quality_issues •       │
│                     investigation_recommendations                       │
│  Live SQL Queries: JOIN • GROUP BY • HAVING • AVG • SUM • COUNT        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Component | Technology | Description |
|---|---|---|
| **Frontend** | React 18, Vite | Component-based dashboard and responsive layouts |
| **Data Visualization** | Recharts | SVG bar charts, trend lines, and distribution donuts |
| **Client CSV Handling** | PapaParse | Client-side CSV preview and export |
| **Icons & Design** | Lucide React, Custom CSS | Modern slate design system (`#0f172a`), Inter typography |
| **Backend API** | Python 3.13, FastAPI, Uvicorn | High-performance asynchronous REST API |
| **Database** | PostgreSQL 17, SQLAlchemy, psycopg2 | Relational tables, foreign keys, indexes, and aggregation queries |
| **Data Processing** | Pandas, NumPy | Automated cleaning, validation, outlier detection, and duplicate identification |
| **AI Decision Support** | Google Gemini API (`gemini-1.5-flash`) | Context-grounded executive summaries and engineering interventions |

---

## 🗄️ Relational Database Schema (`saferoutes_db`)

The PostgreSQL database is organized into normalized relational tables:

1. **`datasets`**
   - `id` (SERIAL PRIMARY KEY)
   - `dataset_name` (VARCHAR)
   - `original_filename` (VARCHAR)
   - `upload_date` (TIMESTAMP)
   - `total_records`, `valid_records`, `invalid_records`, `duplicate_records` (INTEGER)
   - `processing_status` (VARCHAR)

2. **`accidents`**
   - `id` (SERIAL PRIMARY KEY)
   - `dataset_id` (INTEGER, FOREIGN KEY → datasets.id ON DELETE CASCADE)
   - `source_record_id` (VARCHAR)
   - `accident_date` (DATE)
   - `accident_time` (TIME)
   - `location` (VARCHAR, INDEXED)
   - `latitude`, `longitude` (FLOAT)
   - `severity` (VARCHAR: Fatal, High, Medium, Low)
   - `weather_condition` (VARCHAR)
   - `road_condition` (VARCHAR)
   - `number_of_vehicles` (INTEGER)
   - `injuries`, `fatalities` (INTEGER)
   - `is_valid` (BOOLEAN)
   - `is_duplicate` (BOOLEAN)
   - `created_at` (TIMESTAMP)

3. **`data_quality_issues`**
   - `id` (SERIAL PRIMARY KEY)
   - `dataset_id` (INTEGER, FOREIGN KEY → datasets.id)
   - `accident_id` (INTEGER, FOREIGN KEY → accidents.id ON DELETE CASCADE)
   - `issue_type` (VARCHAR: MISSING_VALUE, INVALID_VALUE, OUT_OF_BOUNDS, DUPLICATE)
   - `field_name` (VARCHAR)
   - `issue_description` (TEXT)
   - `detected_value` (TEXT)
   - `created_at` (TIMESTAMP)

4. **`investigation_recommendations`**
   - `id` (SERIAL PRIMARY KEY)
   - `dataset_id` (INTEGER, FOREIGN KEY → datasets.id)
   - `location` (VARCHAR)
   - `recommendation` (TEXT)
   - `priority` (VARCHAR: CRITICAL, HIGH, MEDIUM)
   - `evidence` (TEXT)
   - `status` (VARCHAR)
   - `created_at` (TIMESTAMP)

---

## 🧪 Included Synthetic Evaluation Dataset

To demonstrate data cleaning, validation, duplicate detection, and PostgreSQL querying during academic evaluations, SafeRoutes includes:

- **Path**: `datasets/chandigarh_road_accidents_messy.csv`
- **Total Records**: 761 rows
- **Deliberate Pedagogical Anomalies**:
  - Inconsistent column name casings (`accident_location`, `Crash_Time`, `SEVERITY`)
  - Missing required fields (missing locations, dates, or casualty counts)
  - Negative injury/fatality numbers (`-2`, `-1`)
  - Unparseable dates and impossible 24-hour clock times (`27:15:00`, `99:99`)
  - Geographical coordinates outside Chandigarh limits (latitude < 30.60 or > 30.88)
  - Text case variants and synonyms (`DENSE FOG`, `dense-fog`, `Wet Surface`, `water logged`)
  - Exact and composite-key duplicates (matching date, location, time, severity, casualties)
- **Ethical Integrity**: Clearly labeled as synthetic demonstration data; does not fabricate official police statistics.

---

## 📊 Interactive SQL Demonstration Studio

Under the **Database Explorer** tab in the dashboard, evaluators can inspect live table counts and execute pre-approved analytical queries directly against PostgreSQL:

1. **Severity & Casualty Aggregation**: Demonstrates `SELECT`, `COUNT`, `SUM`, `GROUP BY`, and `ORDER BY`.
2. **Repeated Crash Locations Filtered with HAVING**: Demonstrates `GROUP BY location HAVING COUNT(id) >= 2`.
3. **Monthly Incident Trends**: Demonstrates chronological aggregation using `TO_CHAR(accident_date, 'YYYY-Mon')` and `EXTRACT(MONTH FROM accident_date)`.
4. **Weather Atmospheric Distribution & Average Casualties**: Demonstrates `AVG(injuries)`, `ROUND`, and `AVG(number_of_vehicles)`.
5. **Relational Multi-Table Audit**: Demonstrates an `INNER JOIN` between `accidents` and `datasets`, plus a `LEFT JOIN` on `data_quality_issues`.
6. **Fatal Corridors with SUM & HAVING**: Demonstrates `HAVING SUM(fatalities) >= 1`.

---

## 🤖 Google Gemini AI Grounding & Decision Support

The AI safety module connects to Google Gemini (`gemini-1.5-flash`):
- Receives aggregated metrics computed strictly from the active PostgreSQL database.
- Strictly instructed not to hallucinate, predict future crashes, or assume definitive causality.
- Produces executive summaries, corridor observations, visibility assessments, and engineering interventions.
- Features an automated deterministic fallback rule engine when `GEMINI_API_KEY` is not configured.

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Python 3.10+
- PostgreSQL 14+ (e.g., Homebrew PostgreSQL on macOS)
- Node.js 18+ and npm

### 2. Backend Setup & Database Seeding

```bash
# Navigate to project root
cd SafeRoutes

# Install Python dependencies
pip install -r backend/requirements.txt

# Verify or configure PostgreSQL credentials in backend/.env:
# DATABASE_URL=postgresql+psycopg2://<user>@/saferoutes_db?host=/tmp
# GEMINI_API_KEY=your_key_here  (optional)

# Run database migration and seeding
python3 backend/seed_db.py

# Start FastAPI backend server
python3 backend/main.py
# Backend runs at http://localhost:8000 (API docs at http://localhost:8000/docs)
```

### 3. Frontend Setup

```bash
# Open a new terminal in SafeRoutes
npm install

# Start Vite development server
npm run dev
# Frontend runs at http://localhost:3000
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health check |
| `GET` | `/api/database/status` | Live PostgreSQL connection, ping latency, and table counts |
| `GET` | `/api/datasets` | List all registered datasets in PostgreSQL |
| `GET` | `/api/datasets/{id}/quality-report` | Retrieve transparent data quality report for a dataset |
| `GET` | `/api/datasets/{id}/records` | Paginated accident records with issues and flags |
| `POST` | `/api/datasets/upload` | Upload CSV, run Pandas cleaning/validation, and save to database |
| `GET` | `/api/analytics/overview` | Core KPI metrics (accidents, casualties, top location) |
| `GET` | `/api/analytics/monthly` | Monthly incident trends |
| `GET` | `/api/analytics/severity` | Severity distribution (High, Medium, Low) |
| `GET` | `/api/analytics/locations` | Ranked crash blackspots with injury and fatality counts |
| `GET` | `/api/analytics/sql-demo` | List available SQL demonstration queries |
| `POST` | `/api/analytics/sql-demo/run` | Execute pre-approved SQL query against PostgreSQL |
| `POST` | `/api/ai/insights` | Generate AI decision support grounded in PostgreSQL stats |

---

## ⚖️ Data Integrity & Decision Support Ethics

1. **Synthetic Demonstration Data**: The dataset contains intentionally planted anomalies for evaluating data cleaning and validation pipelines. It does not represent official Chandigarh Traffic Police or MoRTH records.
2. **Observational Insights**: High-frequency crash locations and weather correlations represent empirical patterns requiring on-site civil and traffic engineering audits, not proven causation.
3. **No Unsubstantiated Predictions**: The application does not attempt to predict future accidents.
