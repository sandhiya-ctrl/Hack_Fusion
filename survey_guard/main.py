"""
SurveyGuard AI - ML Intelligence Service
Exposes REST endpoints consumed by the Node.js backend. This service owns all
statistical + ML logic; Node.js never computes scores itself, it only
orchestrates and stores results.
"""
import os
import time
from datetime import datetime
from typing import List, Optional

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from models.rules import rule_check
from models.statistical import StatisticalEngine
from models.ml_model import MLAnomalyModel
from utils.scoring import combine_scores, build_explanation, recommendation_for

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
HISTORICAL_PATH = os.path.join(DATA_DIR, "historical_plfs.csv")

app = FastAPI(title="SurveyGuard AI - ML Intelligence Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production (Node.js backend origin only)
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Global state: loaded once at startup, reused across requests ----
state = {"stat_engine": None, "ml_model": None, "historical_df": None, "trained_at": None}


class SurveyRecord(BaseModel):
    recordId: str
    district: Optional[str] = None
    enumeratorId: Optional[str] = None
    surveyDate: Optional[str] = None
    age: Optional[float] = None
    gender: Optional[str] = None
    education: Optional[str] = None
    employmentStatus: Optional[str] = None
    householdSize: Optional[float] = None
    weeklyHours: Optional[float] = None
    monthlyIncome: Optional[float] = None


class AnalyzeRequest(BaseModel):
    surveyId: str
    records: List[SurveyRecord]


class TrainRequest(BaseModel):
    contamination: Optional[float] = 0.05


@app.on_event("startup")
def startup_load():
    """Load historical data + train/load models at startup so /ml/analyze is fast."""
    if os.path.exists(HISTORICAL_PATH):
        df = pd.read_csv(HISTORICAL_PATH)
        state["historical_df"] = df
        state["stat_engine"] = StatisticalEngine(df)

        ml = MLAnomalyModel()
        try:
            ml.load()
        except Exception:
            ml.train(df)
        state["ml_model"] = ml
        state["trained_at"] = datetime.utcnow().isoformat()
        print(f"[startup] Loaded {len(df)} historical records, model ready.")
    else:
        print("[startup] WARNING: no historical_plfs.csv found. Run data/generate_data.py first.")


@app.get("/")
def root():
    return {"service": "SurveyGuard AI ML Engine", "status": "running"}


@app.get("/ml/model-info")
def model_info():
    if state["ml_model"] is None:
        raise HTTPException(503, "Model not loaded")
    return {
        "algorithm": "IsolationForest",
        "historicalRecords": len(state["historical_df"]) if state["historical_df"] is not None else 0,
        "trainedAt": state["trained_at"],
        "features": ["age", "weeklyHours", "monthlyIncome", "householdSize", "education", "employmentStatus", "gender"],
        "weights": {"rule": 0.4, "statistical": 0.3, "ml": 0.3},
    }


@app.post("/ml/train")
def train(req: TrainRequest):
    """Retrain Isolation Forest on historical data (e.g. after new historical
    data is loaded). Statistical peer-group baselines are also rebuilt."""
    if state["historical_df"] is None:
        raise HTTPException(400, "No historical data loaded")

    ml = MLAnomalyModel()
    ml.train(state["historical_df"], contamination=req.contamination)
    state["ml_model"] = ml
    state["stat_engine"] = StatisticalEngine(state["historical_df"])
    state["trained_at"] = datetime.utcnow().isoformat()

    return {"status": "trained", "recordsUsed": len(state["historical_df"]), "trainedAt": state["trained_at"]}


@app.post("/ml/analyze")
def analyze(req: AnalyzeRequest):
    """Core endpoint: scores a batch of records across rule + statistical + ML
    layers and returns per-record results plus batch-level summary."""
    if state["ml_model"] is None or not state["ml_model"].is_trained():
        raise HTTPException(503, "ML model not ready. Call /ml/train first.")

    start = time.time()
    records = [r.dict() for r in req.records]
    if not records:
        return {"results": [], "summary": {}}

    records_df = pd.DataFrame(records)
    ml_scores, ml_is_anomaly = state["ml_model"].predict_batch(records_df)

    results = []
    for i, record in enumerate(records):
        rule_score, rule_flags = rule_check(record)
        stat_score, stat_flags, stat_details = state["stat_engine"].score(record)
        ml_score = float(ml_scores[i])
        is_ml_anomaly = bool(ml_is_anomaly[i])

        final_score, risk = combine_scores(rule_score, stat_score, ml_score)
        explanation = build_explanation(rule_flags, stat_flags, is_ml_anomaly, ml_score)

        results.append({
            "recordId": record["recordId"],
            "district": record.get("district"),
            "enumeratorId": record.get("enumeratorId"),
            "ruleScore": rule_score,
            "statisticalScore": stat_score,
            "mlScore": round(ml_score, 1),
            "finalScore": final_score,
            "risk": risk,
            "isAnomaly": risk != "NORMAL",
            "flags": explanation,
            "statisticalDetails": stat_details,
            "recommendation": recommendation_for(risk),
        })

    results_df = pd.DataFrame(results)
    enumerator_analysis = state["stat_engine"].enumerator_anomaly_rate(results_df) if "enumeratorId" in records_df else []
    district_analysis = state["stat_engine"].district_aggregate(results_df) if "district" in records_df else []

    summary = {
        "totalRecords": len(results),
        "anomalies": int(results_df["isAnomaly"].sum()),
        "critical": int((results_df["risk"] == "CRITICAL").sum()),
        "warning": int((results_df["risk"] == "WARNING").sum()),
        "anomalyRate": round(float(results_df["isAnomaly"].mean() * 100), 1),
        "processingTimeMs": round((time.time() - start) * 1000, 1),
        "enumeratorAnalysis": enumerator_analysis,
        "districtAnalysis": district_analysis,
    }

    return {"results": results, "summary": summary}


if __name__ == "__main__":
    import uvicorn
    # Render supplies PORT at runtime; localhost still uses 8000 by default.
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
