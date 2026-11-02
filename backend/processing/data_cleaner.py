import re
import pandas as pd
import numpy as np

SEVERITY_MAPPING = {
    r"\bfatal\b|\bdeath\b|\bkilled\b|\bdead\b": "Fatal",
    r"\bsevere\b|\bgrievous\b|\bmajor\b|\bcritical\b|\bhigh\b": "High",
    r"\bmoderate\b|\bmedium\b|\bmed\b|\bsimple\b": "Medium",
    r"\bminor\b|\blow\b|\bslight\b|\btrivial\b|\bpdo\b": "Low",
}

WEATHER_MAPPING = {
    r"dense\s*fog|very\s*dense|heavy\s*fog|thick\s*fog": "Dense Fog",
    r"\bfog\b|\bfoggy\b|\bmist\b|\bmisty\b|\bshallow\s*fog\b": "Fog",
    r"\brain\b|\brainy\b|\bdrizzle\b|\bshower\b|\bwet\s*weather\b|\bthunderstorm\b": "Rain",
    r"\bclear\b|\bsunny\b|\bfine\b|\bfair\b|\bclear\s*sky\b": "Clear",
    r"\bcloudy\b|\bovercast\b|\bpartly\s*cloudy\b": "Cloudy",
    r"\bhaze\b|\bhazy\b|\bsmog\b|\bsmoke\b": "Haze",
    r"\bwind\b|\bwindy\b|\bdust\s*storm\b|\bgale\b": "Windy",
}

ROAD_MAPPING = {
    r"\bdry\b|\bnormal\b|\bgood\b": "Dry",
    r"\bwet\b|\bdamp\b": "Wet",
    r"foggy\s*surface|\bdew\b": "Foggy Surface",
    r"waterlogged|\bflooded\b|standing\s*water": "Waterlogged",
    r"slippery|\boil\b|\bgreasy\b": "Slippery",
    r"pothole|damaged|broken|rough": "Potholed / Damaged",
}

def clean_text_field(val: any) -> str:
    if val is None or pd.isna(val):
        return ""
    text = str(val).strip()
    if text.lower() in ["na", "n/a", "null", "none", "nan", ""]:
        return ""
    return re.sub(r"\s+", " ", text)

def clean_severity(val: str) -> str:
    clean = clean_text_field(val)
    if not clean:
        return ""
    lower = clean.lower()
    for pattern, standardized in SEVERITY_MAPPING.items():
        if re.search(pattern, lower):
            return standardized
    return clean

def clean_weather(val: str) -> str:
    clean = clean_text_field(val)
    if not clean:
        return "Unknown"
    lower = clean.lower()
    for pattern, standardized in WEATHER_MAPPING.items():
        if re.search(pattern, lower):
            return standardized
    return clean

def clean_road_condition(val: str) -> str:
    clean = clean_text_field(val)
    if not clean:
        return "Unknown"
    lower = clean.lower()
    for pattern, standardized in ROAD_MAPPING.items():
        if re.search(pattern, lower):
            return standardized
    return clean

def clean_dataset_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df_clean = df.copy()

    for col in df_clean.select_dtypes(include=["object"]).columns:
        df_clean[col] = df_clean[col].apply(clean_text_field)

    df_clean["severity_cleaned"] = df_clean["severity"].apply(clean_severity)
    df_clean["weather_cleaned"] = df_clean["weather_condition"].apply(clean_weather)
    df_clean["road_cleaned"] = df_clean["road_condition"].apply(clean_road_condition)

    return df_clean
