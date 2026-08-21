"""
Layer 2: Statistical / probabilistic anomaly detection.
This is what static CAPI rule-checks structurally cannot do - it compares each
record against the DISTRIBUTION of its historical peer group (same district +
education level), not a fixed threshold.
"""
import numpy as np
import pandas as pd

NUMERIC_FIELDS = ["monthlyIncome", "weeklyHours"]
PEER_GROUP_COLS = ["district", "education"]


class StatisticalEngine:
    def __init__(self, historical_df: pd.DataFrame):
        self.historical_df = historical_df
        self._build_peer_group_stats()

    def _build_peer_group_stats(self):
        """Pre-compute mean/median/std/IQR per peer group per numeric field.
        Done once at startup so per-record scoring is fast (no full scan)."""
        self.group_stats = {}
        grouped = self.historical_df.groupby(PEER_GROUP_COLS)
        for group_key, group_df in grouped:
            stats = {}
            for field in NUMERIC_FIELDS:
                vals = group_df[field].dropna()
                if len(vals) < 5:
                    continue
                q1, q3 = np.percentile(vals, [25, 75])
                stats[field] = {
                    "mean": vals.mean(),
                    "std": vals.std() if vals.std() > 0 else 1.0,
                    "median": vals.median(),
                    "q1": q1,
                    "q3": q3,
                    "iqr": q3 - q1 if (q3 - q1) > 0 else 1.0,
                }
            self.group_stats[group_key] = stats

        # Global fallback stats (used when peer group has too few historical records)
        self.global_stats = {}
        for field in NUMERIC_FIELDS:
            vals = self.historical_df[field].dropna()
            q1, q3 = np.percentile(vals, [25, 75])
            self.global_stats[field] = {
                "mean": vals.mean(), "std": vals.std(), "median": vals.median(),
                "q1": q1, "q3": q3, "iqr": (q3 - q1) if (q3 - q1) > 0 else 1.0,
            }

    def _get_stats_for(self, record):
        key = tuple(record.get(c) for c in PEER_GROUP_COLS)
        return self.group_stats.get(key, self.global_stats)

    def score(self, record: dict):
        """Returns (statistical_score 0-100, flags[], details{})."""
        stats_for_group = self._get_stats_for(record)
        flags = []
        deviations = []
        details = {}

        for field in NUMERIC_FIELDS:
            value = record.get(field)
            if value is None or field not in stats_for_group:
                continue
            fs = stats_for_group[field]

            z = abs(value - fs["mean"]) / fs["std"]
            iqr_dist = 0
            if value < fs["q1"]:
                iqr_dist = (fs["q1"] - value) / fs["iqr"]
            elif value > fs["q3"]:
                iqr_dist = (value - fs["q3"]) / fs["iqr"]

            deviations.append(z)
            details[field] = {"zscore": round(float(z), 2), "peer_median": round(float(fs["median"]), 0)}

            if z > 3:
                flags.append(
                    f"{field} ({value:,.0f}) is {z:.1f}\u03c3 from peer-group median "
                    f"({fs['median']:,.0f}) for {record.get('district')}/{record.get('education')}"
                )
            elif iqr_dist > 1.5:
                flags.append(f"{field} ({value:,.0f}) is a statistical outlier vs. peer group (IQR method)")

        if not deviations:
            return 0, [], {}

        max_z = max(deviations)
        # Convert Z-score to a 0-100 severity scale (z=0 -> 0, z>=5 -> 100)
        score = float(np.clip((max_z / 5.0) * 100, 0, 100))
        return round(score, 1), flags, details

    def enumerator_anomaly_rate(self, results_df: pd.DataFrame):
        """Cluster-level: anomaly rate per enumerator vs. overall average -
        surfaces potential enumerator bias per problem statement objective 2."""
        overall_rate = results_df["isAnomaly"].mean()
        grouped = results_df.groupby("enumeratorId").agg(
            totalRecords=("recordId", "count"),
            anomalies=("isAnomaly", "sum"),
        )
        grouped["anomalyRate"] = (grouped["anomalies"] / grouped["totalRecords"] * 100).round(1)
        grouped["regionalAverage"] = round(overall_rate * 100, 1)
        grouped["deviationFlag"] = grouped["anomalyRate"] > (grouped["regionalAverage"] * 2)
        return grouped.reset_index().to_dict(orient="records")

    def district_aggregate(self, results_df: pd.DataFrame):
        """Aggregate-level anomaly rate by district."""
        grouped = results_df.groupby("district").agg(
            totalRecords=("recordId", "count"),
            anomalies=("isAnomaly", "sum"),
        )
        grouped["anomalyRate"] = (grouped["anomalies"] / grouped["totalRecords"] * 100).round(1)
        return grouped.reset_index().to_dict(orient="records")
