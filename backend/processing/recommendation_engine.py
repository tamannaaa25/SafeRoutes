from typing import List, Dict, Any

def generate_safety_recommendations(records: List[Any]) -> List[Dict[str, Any]]:
    if not records:
        return []

    loc_stats: Dict[str, Dict[str, Any]] = {}
    total_records = len(records)
    fog_count = 0
    night_count = 0

    for r in records:
        if isinstance(r, dict):
            loc = r.get("location", "Unknown Location")
            injuries = r.get("injuries", 0) or 0
            fatalities = r.get("fatalities", 0) or 0
            severity = str(r.get("severity", "")).lower()
            weather = str(r.get("weather_condition", "")).lower()
            light = str(r.get("light_condition", "")).lower()
        else:
            loc = getattr(r, "location", "Unknown Location")
            injuries = getattr(r, "injuries", 0) or 0
            fatalities = getattr(r, "fatalities", 0) or 0
            severity = str(getattr(r, "severity", "")).lower()
            weather = str(getattr(r, "weather_condition", "")).lower()
            light = str(getattr(r, "light_condition", "")).lower()

        if loc not in loc_stats:
            loc_stats[loc] = {"crashes": 0, "injuries": 0, "fatalities": 0, "severe_count": 0}

        loc_stats[loc]["crashes"] += 1
        loc_stats[loc]["injuries"] += injuries
        loc_stats[loc]["fatalities"] += fatalities
        if severity in ["fatal", "high", "severe"]:
            loc_stats[loc]["severe_count"] += 1

        if "fog" in weather:
            fog_count += 1
        if "night" in light or "dark" in light:
            night_count += 1

    recommendations = []

    sorted_locs = sorted(loc_stats.items(), key=lambda item: (item[1]["fatalities"], item[1]["crashes"]), reverse=True)

    for loc, s in sorted_locs[:5]:
        if s["fatalities"] > 0:
            recommendations.append({
                "location": loc,
                "priority": "CRITICAL",
                "category": "Speed & Pedestrian Collision Audit",
                "recommendation": f"Candidate for priority road safety inspection. Conduct on-site engineering review of vehicle approach speeds, pedestrian refuge islands, and median barrier integrity following {s['fatalities']} recorded fatal casualties.",
                "evidence": f"Recorded {s['fatalities']} fatalities and {s['crashes']} total crashes in active dataset.",
                "status": "ACTIVE"
            })
        elif s["crashes"] >= 3:
            recommendations.append({
                "location": loc,
                "priority": "HIGH",
                "category": "Traffic Flow & Intersection Design",
                "recommendation": f"Candidate for intersection geometric audit. Review traffic signal phasing, channelization islands, and directional road signage due to recurring crash frequency ({s['crashes']} incidents).",
                "evidence": f"Repeated crash frequency: {s['crashes']} incidents recorded.",
                "status": "ACTIVE"
            })

    if total_records > 0 and (fog_count / total_records) >= 0.15:
        fog_pct = round((fog_count / total_records) * 100, 1)
        recommendations.append({
            "location": "Chandigarh Arterial Corridor Network",
            "priority": "MEDIUM",
            "category": "Visibility & Road Delineation",
            "recommendation": f"Candidate for low-visibility road safety measures. With {fog_count} crashes ({fog_pct}%) recorded during dense fog/fog, inspect retro-reflective pavement markers (cat's eyes), high-luminance LED signal heads, and advance fog warning signs.",
            "evidence": f"{fog_count} of {total_records} incidents ({fog_pct}%) occurred in foggy conditions.",
            "status": "ACTIVE"
        })

    if total_records > 0 and (night_count / total_records) >= 0.30:
        night_pct = round((night_count / total_records) * 100, 1)
        recommendations.append({
            "location": "Major Intersections and Arterial Sectors",
            "priority": "MEDIUM",
            "category": "Street Lighting & Night Safety",
            "recommendation": f"Candidate for illumination engineering review. {night_count} crashes ({night_pct}%) occurred during nighttime hours. Review junction lux levels, street light maintenance, and high-mast lighting at roundabouts.",
            "evidence": f"{night_count} of {total_records} incidents ({night_pct}%) occurred in night lighting conditions.",
            "status": "ACTIVE"
        })

    return recommendations

generate_deterministic_recommendations = generate_safety_recommendations
