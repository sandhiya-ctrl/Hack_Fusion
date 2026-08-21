"""
Layer 1: Rule-based validation.
Deterministic hard/soft checks - equivalent to what CAPI already does,
but centralized here so new rules can be added without touching Node.js.
"""

VALID_EDUCATION = {"Below Primary", "Secondary", "Higher Secondary", "Graduate", "Post Graduate"}
VALID_EMPLOYMENT = {"Employed", "Unemployed", "Self-Employed"}
VALID_GENDER = {"Male", "Female"}


def rule_check(record: dict):
    """Returns (rule_score 0-100, list_of_flag_messages)."""
    flags = []
    score = 0

    age = record.get("age")
    if age is None:
        flags.append("Missing mandatory field: age")
        score += 20
    elif age < 15 or age > 100:
        flags.append(f"Age {age} outside plausible survey range (15-100)")
        score += 35

    hours = record.get("weeklyHours")
    if hours is None:
        flags.append("Missing mandatory field: weeklyHours")
        score += 15
    elif hours < 0 or hours > 168:
        flags.append(f"Weekly working hours {hours} is physically impossible (>168/week)")
        score += 40
    elif hours > 84:
        flags.append(f"Weekly working hours {hours} exceeds 12hrs/day sustained (soft check)")
        score += 15

    income = record.get("monthlyIncome")
    if income is None:
        flags.append("Missing mandatory field: monthlyIncome")
        score += 15
    elif income < 0:
        flags.append("Negative monthly income reported")
        score += 40

    employment = record.get("employmentStatus")
    if employment == "Unemployed" and income and income > 0:
        flags.append("Income reported despite 'Unemployed' status (referential integrity)")
        score += 30

    if employment == "Employed" and hours == 0:
        flags.append("Zero working hours despite 'Employed' status (referential integrity)")
        score += 20

    education = record.get("education")
    if education and education not in VALID_EDUCATION:
        flags.append(f"Invalid education category: {education}")
        score += 20

    household_size = record.get("householdSize")
    if household_size is not None and (household_size < 1 or household_size > 25):
        flags.append(f"Household size {household_size} is implausible")
        score += 20

    return min(score, 100), flags
