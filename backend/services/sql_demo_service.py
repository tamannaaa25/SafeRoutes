import time
from typing import Dict, Any, List
from sqlalchemy import text
from sqlalchemy.orm import Session

PREDEFINED_SQL_QUERIES = [
    {
        "query_id": "severity_summary",
        "title": "Crash Severity & Casualty Aggregation",
        "description": "Groups records by severity classification, calculating incident count, total injuries, and total fatalities.",
        "operations_demonstrated": ["SELECT", "COUNT", "SUM", "GROUP BY", "ORDER BY"],
        "sql_text": """SELECT 
    severity,
    COUNT(id) AS total_accidents,
    COALESCE(SUM(injuries), 0) AS total_injuries,
    COALESCE(SUM(fatalities), 0) AS total_fatalities
FROM accidents
WHERE is_valid = TRUE
GROUP BY severity
ORDER BY total_accidents DESC;"""
    },
    {
        "query_id": "high_frequency_having",
        "title": "Repeated Crash Locations Filtered with HAVING",
        "description": "Aggregates crashes by location and uses the HAVING clause to filter only locations with 3 or more recorded incidents.",
        "operations_demonstrated": ["SELECT", "COUNT", "SUM", "GROUP BY", "HAVING", "ORDER BY"],
        "sql_text": """SELECT 
    location,
    COUNT(id) AS crash_count,
    COALESCE(SUM(injuries), 0) AS total_injuries,
    COALESCE(SUM(fatalities), 0) AS total_fatalities
FROM accidents
WHERE is_valid = TRUE
GROUP BY location
HAVING COUNT(id) >= 2
ORDER BY crash_count DESC, total_fatalities DESC
LIMIT 10;"""
    },
    {
        "query_id": "monthly_aggregation",
        "title": "Monthly Incident Distribution and Casualties",
        "description": "Extracts month and computes total volume, injuries, and fatalities chronologically.",
        "operations_demonstrated": ["SELECT", "DATE_TRUNC", "COUNT", "SUM", "GROUP BY", "ORDER BY"],
        "sql_text": """SELECT 
    TO_CHAR(accident_date, 'YYYY-Mon') AS month_label,
    COUNT(id) AS incident_count,
    COALESCE(SUM(injuries), 0) AS injuries,
    COALESCE(SUM(fatalities), 0) AS fatalities
FROM accidents
WHERE accident_date IS NOT NULL AND is_valid = TRUE
GROUP BY TO_CHAR(accident_date, 'YYYY-Mon'), EXTRACT(MONTH FROM accident_date)
ORDER BY EXTRACT(MONTH FROM accident_date);"""
    },
    {
        "query_id": "weather_avg_casualties",
        "title": "Weather Atmospheric Distribution & Average Casualties",
        "description": "Analyzes weather conditions using COUNT and AVG to determine average injuries and average vehicles involved.",
        "operations_demonstrated": ["SELECT", "COUNT", "AVG", "ROUND", "GROUP BY", "ORDER BY"],
        "sql_text": """SELECT 
    COALESCE(weather_condition, 'Unknown') AS weather,
    COUNT(id) AS recorded_crashes,
    ROUND(AVG(injuries)::numeric, 2) AS avg_injuries_per_crash,
    ROUND(AVG(number_of_vehicles)::numeric, 2) AS avg_vehicles_involved
FROM accidents
WHERE is_valid = TRUE
GROUP BY weather_condition
ORDER BY recorded_crashes DESC;"""
    },
    {
        "query_id": "relational_join_audit",
        "title": "Relational Multi-Table JOIN (Accidents + Datasets + Quality Issues)",
        "description": "Demonstrates an INNER JOIN linking accidents with dataset metadata and LEFT JOINing detected data quality issues.",
        "operations_demonstrated": ["SELECT", "INNER JOIN", "LEFT JOIN", "WHERE", "ORDER BY", "LIMIT"],
        "sql_text": """SELECT 
    a.source_record_id,
    a.location,
    a.severity,
    d.dataset_name,
    COALESCE(qi.issue_type, 'CLEAN') AS detected_issue,
    COALESCE(qi.field_name, 'NONE') AS flagged_field
FROM accidents a
INNER JOIN datasets d ON a.dataset_id = d.id
LEFT JOIN data_quality_issues qi ON a.id = qi.accident_id
ORDER BY a.id DESC
LIMIT 12;"""
    },
    {
        "query_id": "fatal_corridors_having",
        "title": "Fatal Casualty Corridors with SUM & HAVING",
        "description": "Finds road corridors where fatalities occurred, demonstrating SUM aggregation and HAVING condition on casualties.",
        "operations_demonstrated": ["SELECT", "COUNT", "SUM", "GROUP BY", "HAVING", "ORDER BY"],
        "sql_text": """SELECT 
    location,
    COUNT(id) AS total_accidents,
    SUM(fatalities) AS total_fatalities
FROM accidents
WHERE fatalities > 0 AND is_valid = TRUE
GROUP BY location
HAVING SUM(fatalities) >= 1
ORDER BY total_fatalities DESC, total_accidents DESC;"""
    }
]

def execute_predefined_sql_query(query_id: str, db: Session, dataset_id: int = None) -> Dict[str, Any]:
    query_obj = next((q for q in PREDEFINED_SQL_QUERIES if q["query_id"] == query_id), None)
    if not query_obj:
        query_obj = PREDEFINED_SQL_QUERIES[0]

    sql = query_obj["sql_text"]
    start_time = time.time()

    try:
        result = db.execute(text(sql))
        execution_time_ms = round((time.time() - start_time) * 1000, 2)
        columns = list(result.keys())
        rows = [dict(zip(columns, row)) for row in result.fetchall()]

        clean_rows = []
        for r in rows:
            clean_r = {}
            for k, v in r.items():
                if hasattr(v, "isoformat"):
                    clean_r[k] = v.isoformat()
                elif isinstance(v, (int, float, str, bool)) or v is None:
                    clean_r[k] = v
                else:
                    clean_r[k] = str(v)
            clean_rows.append(clean_r)

        return {
            "query_id": query_obj["query_id"],
            "title": query_obj["title"],
            "description": query_obj["description"],
            "sql_text": query_obj["sql_text"],
            "operations_demonstrated": query_obj["operations_demonstrated"],
            "columns": columns,
            "rows": clean_rows,
            "row_count": len(clean_rows),
            "execution_time_ms": execution_time_ms
        }
    except Exception as e:
        execution_time_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "query_id": query_obj["query_id"],
            "title": query_obj["title"],
            "description": query_obj["description"],
            "sql_text": query_obj["sql_text"],
            "operations_demonstrated": query_obj["operations_demonstrated"],
            "columns": ["Error"],
            "rows": [{"Error": str(e)}],
            "row_count": 0,
            "execution_time_ms": execution_time_ms
        }
