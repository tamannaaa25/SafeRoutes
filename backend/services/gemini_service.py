import os
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

def generate_gemini_safety_recommendations(
    stats_data: Dict[str, Any],
    top_locations: List[Dict[str, Any]],
    fatal_locations: List[Dict[str, Any]],
    severity_dist: List[Dict[str, Any]],
    weather_dist: List[Dict[str, Any]]
) -> Dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()

    total_accidents = stats_data.get("total_accidents", 0)
    total_injuries = stats_data.get("total_injuries", 0)
    total_fatalities = stats_data.get("total_fatalities", 0)

    supporting_metrics = {
        "total_analyzed_records": total_accidents,
        "total_injuries": total_injuries,
        "total_fatalities": total_fatalities,
        "top_locations": top_locations[:5],
        "fatal_locations": fatal_locations[:3],
        "severity_distribution": severity_dist,
        "weather_distribution": weather_dist[:5]
    }

    if not api_key:
        return {
            "success": False,
            "error": "Gemini API key is not configured in backend/.env. Please set GEMINI_API_KEY to generate live AI recommendations.",
            "generated_at": datetime.utcnow().isoformat(),
            "source": "Google Gemini API",
            "model_name": "gemini-1.5-flash",
            "executive_summary": "Gemini API key is required to dynamically generate contextual recommendations.",
            "recommendations": [],
            "key_observations": [],
            "high_risk_corridors_analysis": "",
            "weather_and_visibility_impact": "",
            "recommended_interventions": [],
            "caveat_note": "A valid Google Gemini API key must be supplied in backend/.env to generate dynamic recommendations.",
            "supporting_metrics": supporting_metrics
        }

    top_loc_str = ", ".join([
        f"{l.get('location')} ({l.get('crashes')} crashes, {l.get('fatalities', 0)} fatalities, {l.get('injuries', 0)} injuries)"
        for l in top_locations[:5]
    ])
    fatal_loc_str = ", ".join([
        f"{l.get('location')} ({l.get('fatalities')} fatalities)"
        for l in fatal_locations[:3]
    ])
    sev_str = ", ".join([f"{s.get('name')}: {s.get('value')} incidents" for s in severity_dist])
    weather_str = ", ".join([f"{w.get('name')}: {w.get('value')} incidents" for w in weather_dist[:5]])

    prompt = f"""You are a senior road safety and traffic engineering consultant advising the Chandigarh Road Safety Committee.
Analyze the following VERIFIED empirical crash dataset extracted from PostgreSQL:

DATABASE EVIDENCE:
- Total Verified Incidents: {total_accidents}
- Total Recorded Injuries: {total_injuries}
- Total Fatal Casualties: {total_fatalities}
- Highest Crash Frequency Corridors: {top_loc_str}
- Locations with Fatal Casualties: {fatal_loc_str}
- Severity Distribution: {sev_str}
- Environmental / Weather Conditions: {weather_str}

MANDATORY RULES:
1. Every recommendation must be written in natural, fluent, professional civil/traffic engineering language. Do NOT use boilerplate sentence templates.
2. Ground every recommendation in the specific locations, casualty counts, and crash numbers shown above. Never invent or hallucinate data.
3. Frame all recommendations as proposals for on-site investigation, safety audits, and engineering reviews, NOT confirmed diagnoses or proven causes. Do NOT predict future accidents.
4. Generate 4 to 5 contextual, specific recommendations addressing:
   - Intersection geometry, signal phasing, and turning conflict points at high-frequency junctions.
   - Vulnerable road user protection, pedestrian refuge islands, and vehicle operating speeds at fatal casualty locations.
   - Low-visibility measures (e.g. high-reflectivity pavement markers, cat's eyes, LED signage) if fog or low visibility is prominent.
   - Corridor-level channelization and traffic management.

Return your response strictly as a JSON object matching this schema:
{{
  "executive_summary": "Two-sentence professional engineering overview summarizing the key risk concentrations in the dataset.",
  "recommendations": [
    {{
      "id": 1,
      "priority": "CRITICAL" or "HIGH" or "MEDIUM",
      "target": "Exact location or corridor name",
      "category": "Specific engineering category (e.g., 'Intersection Geometry & Phasing', 'Speed Mitigation & Pedestrian Refuge', 'Visibility & Delineation Audit')",
      "text": "2-3 sentences of natural, specific civil engineering recommendation detailing what on-site audits should examine.",
      "evidence": "Data grounding, citing exact numbers from the evidence above."
    }}
  ]
}}"""

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )

        parsed = json.loads(response.text)
        recs = parsed.get("recommendations", [])

        formatted_recs = []
        for idx, r in enumerate(recs, 1):
            formatted_recs.append({
                "id": r.get("id", idx),
                "priority": str(r.get("priority", "HIGH")).upper(),
                "target": r.get("target", "Primary Corridor"),
                "category": r.get("category", "Traffic Safety Review"),
                "text": r.get("text", ""),
                "evidence": r.get("evidence", "")
            })

        return {
            "success": True,
            "error": None,
            "generated_at": datetime.utcnow().isoformat(),
            "source": "Google Gemini 1.5 Flash",
            "model_name": "gemini-1.5-flash",
            "executive_summary": parsed.get("executive_summary", "Road safety engineering recommendations generated by Google Gemini."),
            "recommendations": formatted_recs,
            "key_observations": [],
            "high_risk_corridors_analysis": "",
            "weather_and_visibility_impact": "",
            "recommended_interventions": [
                {
                    "location": r["target"],
                    "action": r["text"],
                    "priority": r["priority"]
                }
                for r in formatted_recs
            ],
            "caveat_note": "Recommendations generated dynamically by Google Gemini grounded in verified PostgreSQL crash data. Requires on-site engineering safety review.",
            "supporting_metrics": supporting_metrics
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Gemini API request failed: {str(e)}",
            "generated_at": datetime.utcnow().isoformat(),
            "source": "Google Gemini API",
            "model_name": "gemini-1.5-flash",
            "executive_summary": "Unable to generate recommendations due to an API error.",
            "recommendations": [],
            "key_observations": [],
            "high_risk_corridors_analysis": "",
            "weather_and_visibility_impact": "",
            "recommended_interventions": [],
            "caveat_note": f"Gemini API request failed: {str(e)}",
            "supporting_metrics": supporting_metrics
        }

def generate_safety_insights(db: Session, dataset_id: Optional[int] = None) -> Dict[str, Any]:
    try:
        from models import Dataset, Accident
    except ImportError:
        from backend.models import Dataset, Accident

    query = db.query(Accident).filter(Accident.is_valid == True)
    if dataset_id:
        query = query.filter(Accident.dataset_id == dataset_id)
    else:
        latest = db.query(Dataset).order_by(desc(Dataset.upload_date)).first()
        if latest:
            query = query.filter(Accident.dataset_id == latest.id)

    total_accidents = query.count()
    total_injuries = query.with_entities(func.coalesce(func.sum(Accident.injuries), 0)).scalar() or 0
    total_fatalities = query.with_entities(func.coalesce(func.sum(Accident.fatalities), 0)).scalar() or 0

    stats_data = {
        "total_accidents": total_accidents,
        "total_injuries": int(total_injuries),
        "total_fatalities": int(total_fatalities)
    }

    loc_results = (
        query.with_entities(
            Accident.location,
            func.count(Accident.id).label("crashes"),
            func.coalesce(func.sum(Accident.injuries), 0).label("injuries"),
            func.coalesce(func.sum(Accident.fatalities), 0).label("fatalities")
        )
        .group_by(Accident.location)
        .order_by(desc("crashes"), desc("fatalities"))
        .limit(5)
        .all()
    )

    top_locations = [
        {"location": loc, "crashes": crashes, "injuries": int(inj), "fatalities": int(fat)}
        for loc, crashes, inj, fat in loc_results
    ]

    fatal_results = (
        query.filter(Accident.fatalities > 0)
        .with_entities(
            Accident.location,
            func.sum(Accident.fatalities).label("fatalities"),
            func.count(Accident.id).label("crashes")
        )
        .group_by(Accident.location)
        .order_by(desc("fatalities"))
        .limit(3)
        .all()
    )

    fatal_locations = [
        {"location": loc, "fatalities": int(fat), "crashes": crashes}
        for loc, fat, crashes in fatal_results
    ]

    sev_results = (
        query.with_entities(Accident.severity, func.count(Accident.id))
        .group_by(Accident.severity)
        .all()
    )
    severity_dist = [{"name": s or "Unknown", "value": cnt} for s, cnt in sev_results]

    w_results = (
        query.with_entities(Accident.weather_condition, func.count(Accident.id))
        .group_by(Accident.weather_condition)
        .order_by(desc(func.count(Accident.id)))
        .all()
    )
    weather_dist = [{"name": w or "Unknown", "value": cnt} for w, cnt in w_results]

    return generate_gemini_safety_recommendations(
        stats_data,
        top_locations,
        fatal_locations,
        severity_dist,
        weather_dist
    )
