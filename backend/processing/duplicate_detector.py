from typing import List, Dict, Any, Tuple

def detect_duplicates_in_records(records: List[Dict[str, Any]], issues_list: List[List[Dict[str, Any]]]) -> Tuple[List[Dict[str, Any]], int]:
    fingerprints = {}
    seen_ids = {}
    near_fingerprints = {}
    duplicate_count = 0

    for idx, rec in enumerate(records):
        is_dup = False
        rec_id = str(rec.get("source_record_id", "") or "").strip()
        date_val = str(rec.get("accident_date", "") or "").strip()
        loc_val = str(rec.get("location", "") or "").strip().lower()
        time_val = str(rec.get("accident_time", "") or "").strip()
        sev_val = str(rec.get("severity", "") or "").strip().lower()
        inj_val = str(rec.get("injuries", 0))
        fat_val = str(rec.get("fatalities", 0))

        # 1. Duplicate ID Check
        if rec_id:
            if rec_id in seen_ids:
                is_dup = True
                first_id_row = seen_ids[rec_id]
                issues_list[idx].append({
                    "issue_type": "DUPLICATE_ID",
                    "field_name": "accident_id",
                    "issue_description": f"Duplicate accident identifier '{rec_id}' already assigned to Row #{first_id_row + 1}",
                    "detected_value": rec_id
                })
            else:
                seen_ids[rec_id] = idx

        # Skip spatial/temporal checks if location is missing/unknown
        if not date_val or not loc_val or loc_val in ["unknown location", "unknown", ""]:
            if is_dup:
                rec["is_duplicate"] = True
                duplicate_count += 1
            continue

        # 2. Exact Record Match (Fingerprint)
        exact_key = f"{date_val}|{loc_val}|{time_val}|{sev_val}|{inj_val}|{fat_val}"
        near_key = f"{date_val}|{loc_val}"

        if exact_key in fingerprints:
            first_idx = fingerprints[exact_key]
            is_dup = True
            issues_list[idx].append({
                "issue_type": "EXACT_DUPLICATE",
                "field_name": "record",
                "issue_description": f"Exact duplicate record of Row #{first_idx + 1} (matching Date, Location, Time, Severity, and Casualties)",
                "detected_value": f"Row #{idx + 1}"
            })
        elif near_key in near_fingerprints:
            # 3. Near Duplicate (same date and location, different time or details)
            near_idx = near_fingerprints[near_key]
            issues_list[idx].append({
                "issue_type": "POTENTIAL_DUPLICATE",
                "field_name": "record",
                "issue_description": f"Potential near-duplicate of Row #{near_idx + 1} (matching Date and Location with slight variation in time or impact)",
                "detected_value": f"Row #{idx + 1}"
            })
        else:
            near_fingerprints[near_key] = idx

        if exact_key not in fingerprints:
            fingerprints[exact_key] = idx

        if is_dup:
            rec["is_duplicate"] = True
            duplicate_count += 1

    return records, duplicate_count
