from typing import List, Dict, Any

def generate_data_quality_report(
    total_records: int,
    cleaned_records: List[Dict[str, Any]],
    issues_by_row: List[List[Dict[str, Any]]],
    df_raw=None
) -> Dict[str, Any]:
    valid_count = 0
    invalid_count = 0
    duplicate_count = 0
    warning_count = 0

    missing_by_column: Dict[str, int] = {}
    errors_by_category: Dict[str, int] = {}
    all_issues_flat = []

    for idx, rec in enumerate(cleaned_records):
        issues = issues_by_row[idx]
        has_error = False
        has_warning = False

        if rec.get("is_duplicate"):
            duplicate_count += 1
            has_warning = True

        for issue in issues:
            all_issues_flat.append(issue)
            cat = issue.get("issue_type", "OTHER")
            errors_by_category[cat] = errors_by_category.get(cat, 0) + 1

            field = issue.get("field_name", "unknown")
            if "MISSING" in cat:
                missing_by_column[field] = missing_by_column.get(field, 0) + 1

            if cat in ["INVALID_VALUE", "MISSING_VALUE"] and field in ["accident_date", "location", "severity", "injuries", "fatalities"]:
                has_error = True
            else:
                has_warning = True

        if not rec.get("is_valid") or has_error:
            invalid_count += 1
        elif has_warning:
            warning_count += 1
        else:
            valid_count += 1

    total = total_records if total_records > 0 else len(cleaned_records)
    quality_percentage = (
        max(0, min(100, round(((valid_count * 1.0 + warning_count * 0.5) / total) * 100, 1)))
        if total > 0 else 100.0
    )

    return {
        "total_records": total,
        "valid_records": valid_count,
        "warning_records": warning_count,
        "invalid_records": invalid_count,
        "duplicate_records": duplicate_count,
        "missing_field_count": sum(missing_by_column.values()),
        "missing_by_column": missing_by_column,
        "errors_by_category": errors_by_category,
        "quality_percentage": quality_percentage,
        "formula": "((Valid Records * 1.0 + Warning Records * 0.5) / Total Records) * 100%"
    }

