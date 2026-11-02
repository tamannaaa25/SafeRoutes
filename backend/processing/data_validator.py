import re
import datetime
from typing import Dict, List, Any, Tuple
import pandas as pd
import numpy as np

CHANDIGARH_LAT_MIN = 30.60
CHANDIGARH_LAT_MAX = 30.88
CHANDIGARH_LON_MIN = 76.65
CHANDIGARH_LON_MAX = 76.92

VALID_SEVERITIES = {"Fatal", "High", "Medium", "Low", "Severe", "Moderate", "Minor"}

def parse_date_safely(date_val: any) -> Tuple[bool, Any, str]:
    if not date_val or str(date_val).strip() == "":
        return False, None, "Missing accident date"

    clean_str = str(date_val).strip()
    try:
        if re.match(r"^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$", clean_str):
            parts = re.split(r"[-/.]", clean_str)
            dt = datetime.date(int(parts[0]), int(parts[1]), int(parts[2]))
        elif re.match(r"^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$", clean_str):
            parts = re.split(r"[-/.]", clean_str)
            dt = datetime.date(int(parts[2]), int(parts[1]), int(parts[0]))
        else:
            parsed = pd.to_datetime(clean_str, errors="coerce")
            if pd.isna(parsed):
                return False, None, f"Invalid date format '{clean_str}'"
            dt = parsed.date()

        current_year = datetime.date.today().year
        if dt.year < 1990 or dt.year > current_year + 1:
            return False, None, f"Year {dt.year} is out of realistic range (1990-{current_year + 1})"

        if dt > datetime.date.today() + datetime.timedelta(days=1):
            return False, None, f"Date cannot be in the future ({dt})"

        return True, dt, ""
    except Exception as e:
        return False, None, f"Date parsing error: {str(e)}"

def parse_time_safely(time_val: any) -> Tuple[bool, Any, str]:
    if not time_val or str(time_val).strip() == "":
        return True, None, ""

    clean_str = str(time_val).strip()
    match = re.match(r"^(\d{1,2}):(\d{2})(?::(\d{2}))?$", clean_str)
    if not match:
        return False, None, f"Invalid time format '{clean_str}'"

    hour, minute = int(match.group(1)), int(match.group(2))
    second = int(match.group(3)) if match.group(3) else 0

    if hour < 0 or hour > 23 or minute < 0 or minute > 59 or second < 0 or second > 59:
        return False, None, f"Impossible time values ({hour:02d}:{minute:02d})"

    return True, datetime.time(hour, minute, second), ""

def validate_row(row: pd.Series, row_idx: int) -> Tuple[bool, Dict[str, Any], List[Dict[str, Any]]]:
    issues = []
    is_valid = True

    date_ok, parsed_date, date_err = parse_date_safely(row.get("accident_date"))
    if not date_ok:
        is_valid = False
        issues.append({
            "issue_type": "MISSING_VALUE" if "Missing" in date_err else "INVALID_VALUE",
            "field_name": "accident_date",
            "issue_description": date_err,
            "detected_value": str(row.get("accident_date"))
        })

    time_ok, parsed_time, time_err = parse_time_safely(row.get("accident_time"))
    if not time_ok:
        issues.append({
            "issue_type": "INVALID_VALUE",
            "field_name": "accident_time",
            "issue_description": time_err,
            "detected_value": str(row.get("accident_time"))
        })

    raw_loc = str(row.get("location", "")).strip()
    if not raw_loc or raw_loc.lower() in ["na", "null", "none", "n/a", ""]:
        is_valid = False
        issues.append({
            "issue_type": "MISSING_VALUE",
            "field_name": "location",
            "issue_description": "Missing required location field",
            "detected_value": raw_loc
        })
        clean_loc = "Unknown Location"
    else:
        clean_loc = re.sub(r"\s+", " ", raw_loc)

    raw_sev = str(row.get("severity", "")).strip()
    cleaned_sev = row.get("severity_cleaned", "")
    if not raw_sev:
        is_valid = False
        issues.append({
            "issue_type": "MISSING_VALUE",
            "field_name": "severity",
            "issue_description": "Missing crash severity",
            "detected_value": ""
        })
        final_sev = "Unknown"
    elif cleaned_sev not in VALID_SEVERITIES:
        is_valid = False
        issues.append({
            "issue_type": "INVALID_VALUE",
            "field_name": "severity",
            "issue_description": f"Unrecognized crash severity '{raw_sev}'",
            "detected_value": raw_sev
        })
        final_sev = cleaned_sev or "Unknown"
    else:
        final_sev = cleaned_sev

    def parse_int_field(val: any, field: str, default: int = 0) -> Tuple[int, bool]:
        if val is None or str(val).strip() == "":
            issues.append({
                "issue_type": "MISSING_VALUE",
                "field_name": field,
                "issue_description": f"{field.capitalize()} not provided (defaulted to {default})",
                "detected_value": ""
            })
            return default, True
        try:
            num = int(float(str(val).strip()))
            if num < 0:
                issues.append({
                    "issue_type": "INVALID_VALUE",
                    "field_name": field,
                    "issue_description": f"Negative {field} count ({num}) is invalid",
                    "detected_value": str(val)
                })
                return num, False
            return num, True
        except ValueError:
            issues.append({
                "issue_type": "INVALID_VALUE",
                "field_name": field,
                "issue_description": f"Non-numeric value in {field} column",
                "detected_value": str(val)
            })
            return default, False

    injuries, inj_ok = parse_int_field(row.get("injuries"), "injuries", default=0)
    fatalities, fat_ok = parse_int_field(row.get("fatalities"), "fatalities", default=0)
    vehicles, veh_ok = parse_int_field(row.get("number_of_vehicles"), "number_of_vehicles", default=1)

    if not inj_ok or not fat_ok or not veh_ok:
        is_valid = False

    def parse_float_field(val: any, field: str, r_min: float, r_max: float) -> Tuple[Any, bool]:
        if val is None or str(val).strip() == "":
            return None, True
        try:
            coord = float(str(val).strip())
            if coord < r_min or coord > r_max:
                issues.append({
                    "issue_type": "OUT_OF_BOUNDS",
                    "field_name": field,
                    "issue_description": f"{field.capitalize()} {coord} is outside valid Chandigarh geographical boundaries ({r_min}-{r_max})",
                    "detected_value": str(val)
                })
                return coord, False
            return coord, True
        except ValueError:
            issues.append({
                "issue_type": "INVALID_VALUE",
                "field_name": field,
                "issue_description": f"Non-numeric {field} coordinate",
                "detected_value": str(val)
            })
            return None, False

    lat, lat_ok = parse_float_field(row.get("latitude"), "latitude", CHANDIGARH_LAT_MIN, CHANDIGARH_LAT_MAX)
    lon, lon_ok = parse_float_field(row.get("longitude"), "longitude", CHANDIGARH_LON_MIN, CHANDIGARH_LON_MAX)

    cleaned_record = {
        "source_record_id": str(row.get("accident_id", f"REC-{row_idx + 1}")),
        "accident_date": parsed_date,
        "accident_time": parsed_time,
        "location": clean_loc,
        "latitude": lat,
        "longitude": lon,
        "severity": final_sev,
        "weather_condition": row.get("weather_cleaned", "Unknown"),
        "road_condition": row.get("road_cleaned", "Unknown"),
        "number_of_vehicles": vehicles if veh_ok and vehicles >= 0 else 1,
        "injuries": injuries if inj_ok and injuries >= 0 else 0,
        "fatalities": fatalities if fat_ok and fatalities >= 0 else 0,
        "is_valid": is_valid,
        "is_duplicate": False
    }

    return is_valid, cleaned_record, issues
