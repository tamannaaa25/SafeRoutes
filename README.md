# SafeRoutes – Road Safety Analytics and Decision Support System

**SafeRoutes** is a full-stack, data-driven platform that helps road safety engineers, transportation analysts, and university evaluators manage, clean, and analyze road accident datasets, identify high-frequency crash corridors, execute server-side relational SQL analytics, and generate actionable engineering interventions to support data-informed road safety planning.

---

## 🌟 Full-Stack Architecture

SafeRoutes follows a clean, decoupled full-stack architecture:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      React (Vite) Frontend                              │
│   Dashboard UI • Recharts • Data Quality Studio • Decision Support      │
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
│   Pandas & NumPy Data Pipeline      │  │       Google Gemini API        │
│ • Column Synonym Standardization    │  │ • Contextual Safety Summaries  │
│ • Date/Time & Coordinate Validation │  │ • Engineering Interventions    │
│ • Duplicate & Outlier Detection     │  │ • Strict SQL Database Grounding│
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
| **Frontend** | React 18, Vite | Modular dashboard with Inter typography and responsive layouts |
| **Data Visualization** | Recharts | Interactive SVG bar charts, temporal distributions, and severity donuts |
| **Client CSV Handling** | PapaParse | Client-side CSV parsing, data validation preview, and filtered exports |
| **Design System** | Lucide React, Custom CSS | Modern slate design system (`#0f172a`), consistent spacing and contrast |
| **Backend API** | Python 3.13, FastAPI, Uvicorn | High-performance asynchronous REST API with structured schemas |
| **Database** | PostgreSQL 17, SQLAlchemy, psycopg2 | Relational tables, foreign keys, indexes, and parameterized SQL queries |
| **Data Processing** | Pandas, NumPy | Automated cleaning, validation, boundary checks, and duplicate detection |
| **AI Decision Support** | Google Gemini API (`gemini-3.5-flash-lite`, `gemini-3.5-flash`) | Empirically grounded executive summaries and specific civil engineering audits |

---

## 🗄️ Relational Database Schema (`saferoutes_db`)

The PostgreSQL database is organized into normalized relational tables:

1. **`datasets`**
   - `id` (SERIAL PRIMARY KEY)
   - `dataset_name` (VARCHAR)
   - `original_filename` (VARCHAR)
   - `upload_date` (TIMESTAMP)
   - `total_records`, `valid_records`, `invalid_records`, `duplicate_records` (INTEGER)
   - `processing_status` (VARCHAR: `completed`, `processing`, `failed`)

2. **`accidents`**
   - `id` (SERIAL PRIMARY KEY)
   - `dataset_id` (INTEGER, FOREIGN KEY → `datasets.id` ON DELETE CASCADE)
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
   - `dataset_id` (INTEGER, FOREIGN KEY → `datasets.id` ON DELETE CASCADE)
   - `accident_id` (INTEGER, FOREIGN KEY → `accidents.id` ON DELETE CASCADE)
   - `issue_type` (VARCHAR: `MISSING_VALUE`, `INVALID_VALUE`, `OUT_OF_BOUNDS`, `EXACT_DUPLICATE`, `DUPLICATE_ID`, `POTENTIAL_DUPLICATE`)
   - `field_name` (VARCHAR)
   - `issue_description` (TEXT)
   - `detected_value` (TEXT)
   - `created_at` (TIMESTAMP)

4. **`investigation_recommendations`**
   - `id` (SERIAL PRIMARY KEY)
   - `dataset_id` (INTEGER, FOREIGN KEY → `datasets.id` ON DELETE SET NULL)
   - `location` (VARCHAR)
   - `recommendation` (TEXT)
   - `priority` (VARCHAR: `CRITICAL`, `HIGH`, `MEDIUM`)
   - `evidence` (TEXT)
   - `status` (VARCHAR)
   - `created_at` (TIMESTAMP)

---

## 🧪 Included Demonstration Dataset

SafeRoutes includes a dedicated demonstration dataset designed specifically for academic evaluation and pipeline verification:

- **Path**: `datasets/chandigarh_road_accidents_demo.csv` (synced to `public/sample_accidents.csv` and `public/chandigarh_road_accidents_demo.csv`)
- **Total Records**: Exactly **10 rows** (excluding header)
- **Standardized Columns**:
  `accident_id`, `accident_date`, `accident_time`, `location`, `latitude`, `longitude`, `severity`, `weather_condition`, `road_condition`, `number_of_vehicles`, `injuries`, `fatalities`, `accident_type`, `light_condition`

### Deliberate Pedagogical Data-Quality Anomalies Included

| Row # | Accident ID | Location | Planted Data-Quality Issues |
|---|---|---|---|
| **1** | `CHD-2024-0001` | Hallomajra Light Point (Dakshin Marg) | **Valid baseline record** (High severity, 2 injuries, 0 fatalities, daylight). |
| **2** | `CHD-2024-0002` | Piccadilly Chowk (Sector 34/35) | **Valid fatal record** (Fatal severity, 1 injury, 1 fatality, fog/wet). |
| **3** | `CHD-2024-0002` | Piccadilly Chowk (Sector 34/35) | **Exact duplicate row** (Identical across all 14 columns; tests row deduplication). |
| **4** | `CHD-2024-0001` | Hallomajra Light Point (Dakshin Marg) | **Duplicate ID & Near Duplicate** (`CHD-2024-0001` ID already assigned to Row 1; same date & location, close time 08:45 vs 08:30). |
| **5** | `CHD-2024-0005` | `   ` (whitespace only) | **Missing location & missing coordinates** (Null latitude and longitude). |
| **6** | `CHD-2024-0006` | Tribune Chowk (Purv Marg) | **Negative injury count** (`-2`), informal severity casing (`severe`), weather casing (`dense fog`), road casing (`DAMP`). |
| **7** | `CHD-2024-0007` | Transport Chowk (Madhya Marg) | **Missing accident date** (empty string) and **invalid negative vehicle count** (`-1`). |
| **8** | `CHD-2024-0008` | Sector 17 Bus Stand (Jan Marg) | **Out-of-bounds GPS coordinates** (Lat: `45.1234`, Lon: `12.5678` outside Chandigarh bounds $30.60$–$30.88$, $76.65$–$76.92$), **missing severity** (empty). |
| **9** | `CHD-2024-0009` | `  Housing Board Light Point (Sector 13)  ` | **Inconsistent date format** (`15/05/2024` DD/MM/YYYY), **extra leading/trailing whitespace**, informal severity (`minor` $\rightarrow$ Low). |
| **10** | `CHD-2024-0010` | Airport Light Point (Purv Marg) | **Invalid calendar date** (`2024-02-30`), **impossible clock time** (`25:70:00`), **unrecognized severity** (`UNKNOWN_SEVERITY`), **negative fatalities** (`-1`). |

> An extended synthetic bulk dataset (`datasets/chandigarh_road_accidents_messy.csv`, 761 records) is also preserved for large-scale stress testing.

---

## 🔍 Data Quality & Record Audit Studio

SafeRoutes features an in-depth data validation module that processes raw records between CSV parsing and the analytics engine:

1. **Non-Destructive Audit Trail**:
   - Records are **never deleted automatically**.
   - Exact duplicates, duplicate identifiers, and near-duplicates are flagged (`is_duplicate = True`) and retained for human-in-the-loop audit.
2. **Transparent Diagnostic Badging**:
   - Each record receives a clear status badge: `Valid`, `Warning`, or `Invalid`.
   - Specific issue tags explain exact anomalies (e.g., negative counts, out-of-bounds coordinates, unparseable dates).
3. **Balanced 7-Column Audit Table**:
   - **Row**: Row index reference (`#1`, `#2`, ...)
   - **Audit Status**: Status badge (`Valid`, `Warning`, `Invalid`)
   - **Validation Diagnostics**: Stacked diagnostic issue badges with specific error/warning descriptions
   - **Date**: Formatted ISO accident date
   - **Location & Sector**: Primary blackspot identifier and corridor hierarchy
   - **Severity**: Standardized severity badge (Fatal, High, Medium, Low)
   - **Casualties**: Validated injuries and fatalities count
4. **Dynamic Quality Score Formula**:
   $$\text{Quality Score} = \left( \frac{\text{Valid Records} \times 1.0 + \text{Warning Records} \times 0.5}{\text{Total Records}} \right) \times 100\%$$

---

## 🗄️ Server-Side SQL Analytics & Repository Architecture

All SQL queries and database operations execute exclusively in the backend repository layer (`backend/repositories/analytics_repository.py`). The frontend receives clean, structured JSON responses and never exposes raw SQL queries:

- **Routes (`backend/routes/analytics.py`)**: Handle HTTP requests and pass parameters (`dataset_id`, `severity`).
- **Services (`backend/services/analytics_service.py`)**: Implement business logic and wrap results into structured responses.
- **Repository (`backend/repositories/analytics_repository.py`)**:
  - Automatically resolves active dataset scope via `_resolve_dataset_id()`, preventing multi-dataset count conflation.
  - Executes server-side relational SQL aggregations:
    1. **Monthly Incident & Casualty Distribution**: Chronological grouping with `TO_CHAR(accident_date, 'YYYY-Mon')`.
    2. **Severity Breakdown**: Grouping by severity with casualty sums.
    3. **Crash Corridor Rankings**: Blackspot identification ordered by crash frequency and fatal casualties.
    4. **Atmospheric / Weather Impact**: Correlation between adverse weather (fog, rain) and collision frequency.
    5. **Investigation Recommendations**: Prioritized engineering recommendations with evidence grounding.

---

## 🤖 Gemini AI-Generated Safety Recommendations

SafeRoutes integrates Google Gemini (`gemini-3.5-flash-lite`, `gemini-3.5-flash`) to generate contextual, evidence-backed safety insights:

- **Strict Empirical Grounding**: The prompt includes only real, calculated metrics from the active PostgreSQL dataset (total accidents, casualty numbers, top crash locations, weather distribution).
- **Civil Engineering Focus**: Gemini generates natural, professional engineering recommendations detailing specific on-site audits (e.g., split-phase signal timing, raised pedestrian refuge islands, retroreflective cat's eyes).
- **No Hallucinated Statistics**: Gemini is strictly instructed not to invent statistics, alter counts, or claim definitive crash causation.
- **Automated Fallback Rule Engine**: If `GEMINI_API_KEY` is not configured, the system falls back to a deterministic recommendation engine so the dashboard remains fully functional.

---

## 🖥️ Inspecting PostgreSQL via pgAdmin 4 or Desktop Client

To inspect the live PostgreSQL database tables, relationships, and records in **pgAdmin 4**:

### Connection Parameters

| Parameter | Value | Notes |
|---|---|---|
| **Host name/address** | `localhost` or `127.0.0.1` | Local PostgreSQL server |
| **Port** | `5432` | Standard PostgreSQL port |
| **Maintenance Database** | `saferoutes_db` | Application database |
| **Username** | `tamanna` (or configured user) | Configured in `backend/.env` |
| **Password** | Read from local `backend/.env` | Left empty if local trust auth is active |

### Step-by-Step pgAdmin Setup

1. **Install pgAdmin 4** (macOS):
   ```bash
   brew install --cask pgadmin4
   ```
2. **Register Server**:
   - Right-click **Servers** → **Register** → **Server...**
   - **General**: Name: `SafeRoutes PostgreSQL`
   - **Connection**: Host: `localhost`, Port: `5432`, Database: `saferoutes_db`, Username: `tamanna`
   - Click **Save**.
3. **Inspect Tables**:
   - Expand: `Servers` → `SafeRoutes PostgreSQL` → `Databases` → `saferoutes_db` → `Schemas` → `public` → `Tables`.
   - Right-click `accidents` → **View/Edit Data** → **All Rows**.
4. **Terminal Inspection (`psql`)**:
   ```bash
   psql -h localhost -U tamanna -d saferoutes_db -c "SELECT current_database(), count(*) FROM accidents;"
   ```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Python 3.10+
- PostgreSQL 14+ (running on `localhost:5432`)
- Node.js 18+ and npm

### 2. Backend Setup & Database Seeding

```bash
# Navigate to project root
cd SafeRoutes

# Install Python dependencies
pip install -r backend/requirements.txt

# Configure environment variables in backend/.env:
# DATABASE_URL=postgresql+psycopg2://tamanna@localhost:5432/saferoutes_db
# GEMINI_API_KEY=your_gemini_api_key  (optional)

# Run database migration and seeding (seeds the 10-record demonstration dataset)
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
| `GET` | `/api/datasets` | List registered datasets in PostgreSQL |
| `GET` | `/api/datasets/{id}` | Dataset metadata and summary counts |
| `GET` | `/api/datasets/{id}/quality-report` | Full data quality report with issue counts |
| `POST` | `/api/datasets/upload` | Upload CSV, run Pandas cleaning/validation, and save to database |
| `GET` | `/api/analytics/overview` | Core KPI metrics (accidents, casualties, top location) |
| `GET` | `/api/analytics/monthly` | Chronological monthly incident trends |
| `GET` | `/api/analytics/severity` | Severity distribution (High, Medium, Low, Fatal) |
| `GET` | `/api/analytics/locations` | Ranked crash blackspots with casualty counts |
| `GET` | `/api/analytics/weather` | Weather condition incident distribution |
| `GET` | `/api/analytics/recommendations` | Prioritized engineering safety interventions |
| `POST` | `/api/ai/insights` | Generate Gemini AI safety decision support grounded in PostgreSQL data |

---

## ⚖️ Data Integrity & Decision Support Ethics

1. **Synthetic Demonstration Data**: The dataset contains intentionally planted anomalies for evaluating data cleaning and validation pipelines. It does not represent official Chandigarh Traffic Police or MoRTH records.
2. **Observational Insights**: High-frequency crash locations and weather correlations represent empirical patterns requiring on-site civil and traffic engineering audits, not proven causation.
3. **No Unsubstantiated Predictions**: The application does not attempt to predict future accidents or assign individual blame.
