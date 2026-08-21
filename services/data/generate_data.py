"""
Generates a synthetic PLFS-like dataset for training + demoing the platform.
Historical data (2024-2025) is used to TRAIN the models.
Current batch (2026) is used to VALIDATE, with intentionally planted anomalies
so the demo produces visible, explainable results.
"""
import numpy as np
import pandas as pd
import random

random.seed(42)
np.random.seed(42)

DISTRICTS = ["Chennai", "Madurai", "Salem", "Coimbatore", "Trichy"]
EDUCATION = ["Below Primary", "Secondary", "Higher Secondary", "Graduate", "Post Graduate"]
EMPLOYMENT = ["Employed", "Unemployed", "Self-Employed"]
GENDER = ["Male", "Female"]
ENUMERATORS = [f"E{100+i}" for i in range(1, 9)]  # E101 - E108

# Base income by education level (monthly, INR) - drives realistic peer groups
EDU_INCOME_BASE = {
    "Below Primary": 12000,
    "Secondary": 18000,
    "Higher Secondary": 22000,
    "Graduate": 28000,
    "Post Graduate": 38000,
}


def generate_record(record_id, district, enumerator_id, survey_date, force_anomaly=False):
    age = int(np.clip(np.random.normal(38, 12), 18, 65))
    gender = random.choice(GENDER)
    education = random.choice(EDUCATION)
    employment_status = random.choices(EMPLOYMENT, weights=[0.6, 0.15, 0.25])[0]
    household_size = int(np.clip(np.random.normal(4, 1.3), 1, 10))

    base_income = EDU_INCOME_BASE[education]
    weekly_hours = int(np.clip(np.random.normal(45, 8), 0, 80))
    monthly_income = max(0, int(np.random.normal(base_income, base_income * 0.2)))

    if employment_status == "Unemployed":
        monthly_income = 0
        weekly_hours = 0

    flags_planted = []
    if force_anomaly:
        anomaly_type = random.choice(["income_spike", "hours_spike", "combo"])
        if anomaly_type == "income_spike":
            monthly_income = int(base_income * random.uniform(3.5, 6))
            flags_planted.append("planted_income_spike")
        elif anomaly_type == "hours_spike":
            weekly_hours = random.randint(95, 130)
            flags_planted.append("planted_hours_spike")
        else:
            monthly_income = int(base_income * random.uniform(3, 5))
            weekly_hours = random.randint(90, 115)
            flags_planted.append("planted_combo_anomaly")

    return {
        "recordId": record_id,
        "surveyId": "PLFS_2026",
        "district": district,
        "enumeratorId": enumerator_id,
        "surveyDate": survey_date,
        "age": age,
        "gender": gender,
        "education": education,
        "employmentStatus": employment_status,
        "householdSize": household_size,
        "weeklyHours": weekly_hours,
        "monthlyIncome": monthly_income,
        "_plantedAnomaly": bool(flags_planted),
        "_plantedFlags": ",".join(flags_planted),
    }


def generate_historical(n=3000):
    """2024-2025 data used to TRAIN statistical baselines + Isolation Forest."""
    rows = []
    for i in range(n):
        district = random.choice(DISTRICTS)
        enumerator = random.choice(ENUMERATORS)
        month = random.choice(pd.date_range("2024-01-01", "2025-12-01", freq="MS"))
        rows.append(generate_record(f"HIST_{i:05d}", district, enumerator, str(month.date())))
    return pd.DataFrame(rows)


def generate_current_batch(n=500, anomaly_rate=0.06, biased_enumerator="E102", biased_district="Coimbatore"):
    """Current survey batch (2026) to be VALIDATED. Includes planted enumerator
    bias (E102 over-reports anomalies) and a district-level anomaly cluster."""
    rows = []
    for i in range(n):
        district = random.choice(DISTRICTS)
        enumerator = random.choice(ENUMERATORS)
        month = "2026-07-01"

        force = random.random() < anomaly_rate
        # Enumerator bias: E102 has ~3.5x higher anomaly rate
        if enumerator == biased_enumerator and random.random() < 0.30:
            force = True
        # District cluster anomaly
        if district == biased_district and random.random() < 0.20:
            force = True

        rows.append(generate_record(f"REC_{i:05d}", district, enumerator, month, force_anomaly=force))
    return pd.DataFrame(rows)


if __name__ == "__main__":
    hist = generate_historical(3000)
    hist.to_csv("historical_plfs.csv", index=False)
    print(f"Historical dataset: {len(hist)} records -> historical_plfs.csv")

    current = generate_current_batch(500)
    current.to_csv("current_batch.csv", index=False)
    print(f"Current batch: {len(current)} records -> current_batch.csv")
    print(f"Planted anomalies in current batch: {current['_plantedAnomaly'].sum()}")
