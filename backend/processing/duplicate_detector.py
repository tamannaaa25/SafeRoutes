from typing import List, Dict, Any, Tuple
import pandas as pd

def detect_duplicates_in_records(records: List[Dict[str, Any]], issues_list: List[List[Dict[str, Any]]]) -> Tuple[List[Dict[str, Any]], int]:
    fingerprints = {}
    duplicate_count = 0

    for idx, rec in enumerate(records):
        date_val = str(rec.get("accident_date", "") or "").strip()
        loc_val = str(rec.get("location", "") or "").strip().lower()
        time_val = str(rec.get("accident_time", "") or "").strip()
        sev_val = str(rec.get("severity", "") or "").strip().lower()
        inj_val = str(rec.get("injuries", 0))
        fat_val = str(rec.get("fatalities", 0))

        if not date_val or not loc_val or loc_val in ["unknown location", "unknown", ""]:
            continue

        key = f"{date_val}|{loc_val}|{time_val}|{sev_val}|{inj_val}|{fat_val}"

        if key in fingerprints:
            first_idx = fingerprints[key]
            rec["is_duplicate"] = True
            duplicate_count += 1
            issues_list[idx].append({
                "issue_type": "DUPLICATE",
                "field_name": "record",
                "issue_description": f"Potential duplicate of Row #{first_idx + 1} (matching Date, Location, Severity, and Casualties)",
                "detected_value": f"Row #{idx + 1}"
            })
        else:
            fingerprints[key] = idx

    return records, duplicate_count
