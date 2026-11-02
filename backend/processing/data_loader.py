import io
import re
import pandas as pd
from typing import Union, Tuple

COLUMN_SYNONYMS = {
    "accident_id": ["accident_id", "accidentid", "id", "record_id", "incident_id", "crash_id"],
    "accident_date": ["accident_date", "accidentdate", "date", "crash_date", "date_of_crash", "incident_date"],
    "accident_time": ["accident_time", "accidenttime", "time", "crash_time", "time_of_crash", "incident_time"],
    "location": ["location", "accident_location", "place_of_occurrence", "black_spot", "blackspot", "chowk", "intersection", "road_name"],
    "latitude": ["latitude", "lat", "y_coord", "gps_lat"],
    "longitude": ["longitude", "lon", "lng", "long", "x_coord", "gps_lon"],
    "severity": ["severity", "crash_severity", "accident_severity", "injury_severity"],
    "weather_condition": ["weather_condition", "weather", "atmospheric_condition", "weathercondition"],
    "road_condition": ["road_condition", "roadcondition", "surface_condition", "road_surface", "surface"],
    "number_of_vehicles": ["number_of_vehicles", "vehicles_involved", "vehicles", "num_vehicles"],
    "injuries": ["injuries", "injury_count", "injured", "persons_injured", "total_injuries"],
    "fatalities": ["fatalities", "fatality_count", "deaths", "killed", "persons_killed", "total_fatalities"],
    "accident_type": ["accident_type", "type", "collision_type", "crash_type"],
    "light_condition": ["light_condition", "lighting", "light", "illumination"]
}

def normalize_col_name(col: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]", "", str(col)).lower()
    for standard_col, synonyms in COLUMN_SYNONYMS.items():
        for syn in synonyms:
            if cleaned == re.sub(r"[^a-zA-Z0-9]", "", syn).lower():
                return standard_col
    return col.strip()

def load_csv_data(file_source: Union[str, bytes, io.BytesIO, io.StringIO]) -> Tuple[pd.DataFrame, pd.DataFrame]:
    if isinstance(file_source, bytes):
        text_content = file_source.decode("utf-8", errors="replace")
        buffer = io.StringIO(text_content)
    elif isinstance(file_source, str) and not file_source.endswith(".csv"):
        buffer = io.StringIO(file_source)
    else:
        buffer = file_source

    df_raw = pd.read_csv(
        buffer,
        comment="#",
        skip_blank_lines=True,
        dtype=str,
        keep_default_na=False
    )

    df_raw = df_raw.dropna(how="all")
    df_raw = df_raw[df_raw.apply(lambda row: any(str(v).strip() != "" for v in row), axis=1)]

    rename_map = {}
    for col in df_raw.columns:
        norm = normalize_col_name(col)
        rename_map[col] = norm

    df_standard = df_raw.rename(columns=rename_map)

    for standard_col in COLUMN_SYNONYMS.keys():
        if standard_col not in df_standard.columns:
            df_standard[standard_col] = None

    return df_raw, df_standard

def load_raw_csv_from_bytes(content: bytes) -> pd.DataFrame:
    _, df_standard = load_csv_data(content)
    return df_standard
