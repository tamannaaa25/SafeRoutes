import pandas as pd
import numpy as np
from typing import List, Dict, Any

def compute_numerical_statistics(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not records:
        return {
            "injuries_mean": 0.0,
            "injuries_median": 0.0,
            "injuries_std": 0.0,
            "fatalities_mean": 0.0,
            "fatalities_median": 0.0,
            "fatalities_std": 0.0,
            "anomalies": []
        }

    injuries_arr = np.array([r.get("injuries", 0) for r in records if r.get("injuries") is not None], dtype=float)
    fatalities_arr = np.array([r.get("fatalities", 0) for r in records if r.get("fatalities") is not None], dtype=float)

    inj_mean = float(np.mean(injuries_arr)) if len(injuries_arr) > 0 else 0.0
    inj_median = float(np.median(injuries_arr)) if len(injuries_arr) > 0 else 0.0
    inj_std = float(np.std(injuries_arr)) if len(injuries_arr) > 0 else 0.0

    fat_mean = float(np.mean(fatalities_arr)) if len(fatalities_arr) > 0 else 0.0
    fat_median = float(np.median(fatalities_arr)) if len(fatalities_arr) > 0 else 0.0
    fat_std = float(np.std(fatalities_arr)) if len(fatalities_arr) > 0 else 0.0

    inj_threshold = inj_mean + (2.5 * inj_std) if inj_std > 0 else 4.0
    fat_threshold = fat_mean + (2.5 * fat_std) if fat_std > 0 else 2.0

    anomalies = []
    for r in records:
        inj = r.get("injuries", 0) or 0
        fat = r.get("fatalities", 0) or 0
        if inj > inj_threshold:
            anomalies.append({
                "record_id": r.get("source_record_id"),
                "location": r.get("location"),
                "field": "injuries",
                "value": inj,
                "rule": f"Injuries ({inj}) exceeds mean + 2.5 std ({inj_threshold:.1f})"
            })
        if fat > fat_threshold and fat > 0:
            anomalies.append({
                "record_id": r.get("source_record_id"),
                "location": r.get("location"),
                "field": "fatalities",
                "value": fat,
                "rule": f"Fatalities ({fat}) exceeds mean + 2.5 std ({fat_threshold:.1f})"
            })

    return {
        "injuries_mean": round(inj_mean, 2),
        "injuries_median": round(inj_median, 2),
        "injuries_std": round(inj_std, 2),
        "fatalities_mean": round(fat_mean, 2),
        "fatalities_median": round(fat_median, 2),
        "fatalities_std": round(fat_std, 2),
        "anomalies": anomalies[:10]
    }

def aggregate_records_with_pandas(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not records:
        return {
            "by_severity": [],
            "by_weather": [],
            "by_road": [],
            "by_month": [],
            "top_locations": []
        }

    df = pd.DataFrame(records)

    by_severity = []
    if "severity" in df.columns:
        sev_counts = df["severity"].value_counts().reset_index()
        sev_counts.columns = ["name", "value"]
        by_severity = sev_counts.to_dict(orient="records")

    by_weather = []
    if "weather_condition" in df.columns:
        w_counts = df["weather_condition"].value_counts().reset_index()
        w_counts.columns = ["name", "value"]
        by_weather = w_counts.to_dict(orient="records")

    by_road = []
    if "road_condition" in df.columns:
        r_counts = df["road_condition"].value_counts().reset_index()
        r_counts.columns = ["name", "value"]
        by_road = r_counts.to_dict(orient="records")

    top_locations = []
    if "location" in df.columns:
        loc_group = df.groupby("location").agg(
            crashes=("location", "count"),
            injuries=("injuries", "sum"),
            fatalities=("fatalities", "sum")
        ).reset_index().sort_values(by=["crashes", "fatalities"], ascending=False)

        loc_group["rank"] = range(1, len(loc_group) + 1)
        top_locations = loc_group.head(10).to_dict(orient="records")

    by_month = []
    if "accident_date" in df.columns:
        df["dt"] = pd.to_datetime(df["accident_date"], errors="coerce")
        df_valid_dates = df.dropna(subset=["dt"])
        if not df_valid_dates.empty:
            df_valid_dates["month_name"] = df_valid_dates["dt"].dt.strftime("%b")
            month_counts = df_valid_dates["month_name"].value_counts()
            all_months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            by_month = [{"month": m, "accidents": int(month_counts.get(m, 0))} for m in all_months]

    return {
        "by_severity": by_severity,
        "by_weather": by_weather,
        "by_road": by_road,
        "by_month": by_month,
        "top_locations": top_locations
    }

