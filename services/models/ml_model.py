"""
Layer 3: Machine Learning - Isolation Forest.
Catches anomalies in the COMBINATION of features that statistical single-field
checks miss (e.g. age+education+hours+income together look "off" even though
no single field crosses a threshold). Unsupervised - no labeled bad records
are needed, which matches the real-world situation (NSO has no "fraud" labels).
"""
import numpy as np
import pandas as pd
import joblib
import os
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder

FEATURES_NUMERIC = ["age", "weeklyHours", "monthlyIncome", "householdSize"]
FEATURES_CATEGORICAL = ["education", "employmentStatus", "gender"]

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "artifacts", "isolation_forest.pkl")
ENCODERS_PATH = os.path.join(os.path.dirname(__file__), "..", "artifacts", "encoders.pkl")


class MLAnomalyModel:
    def __init__(self):
        self.model = None
        self.encoders = {}

    def _prepare_features(self, df: pd.DataFrame, fit_encoders=False):
        feat_df = df.copy()
        for col in FEATURES_CATEGORICAL:
            if fit_encoders:
                le = LabelEncoder()
                feat_df[col] = le.fit_transform(feat_df[col].astype(str))
                self.encoders[col] = le
            else:
                le = self.encoders[col]
                # handle unseen categories gracefully
                feat_df[col] = feat_df[col].astype(str).map(
                    lambda x: le.transform([x])[0] if x in le.classes_ else -1
                )
        for col in FEATURES_NUMERIC:
            feat_df[col] = feat_df[col].fillna(feat_df[col].median())
        return feat_df[FEATURES_NUMERIC + FEATURES_CATEGORICAL]

    def train(self, historical_df: pd.DataFrame, contamination=0.05):
        X = self._prepare_features(historical_df, fit_encoders=True)
        self.model = IsolationForest(
            n_estimators=200,
            contamination=contamination,
            random_state=42,
            n_jobs=-1,
        )
        self.model.fit(X)
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        joblib.dump(self.model, MODEL_PATH)
        joblib.dump(self.encoders, ENCODERS_PATH)
        return self

    def load(self):
        self.model = joblib.load(MODEL_PATH)
        self.encoders = joblib.load(ENCODERS_PATH)
        return self

    def is_trained(self):
        return self.model is not None

    def predict_batch(self, records_df: pd.DataFrame):
        """Returns (ml_scores[0-100], is_anomaly[bool]) for a batch of records."""
        X = self._prepare_features(records_df, fit_encoders=False)
        raw_scores = self.model.decision_function(X)   # higher = more normal
        predictions = self.model.predict(X)              # -1 anomaly, 1 normal

        # Normalize decision_function output (~ -0.5 to 0.5) to a 0-100 severity scale
        ml_scores = np.clip((0.15 - raw_scores) * 250, 0, 100)
        is_anomaly = predictions == -1
        return ml_scores, is_anomaly
