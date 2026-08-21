"""
Combines the 3 layers (Rule, Statistical, ML) into one final anomaly score
and generates a human-readable explanation - what a supervisor actually needs
to act on a flagged record.
"""

WEIGHTS = {"rule": 0.40, "statistical": 0.30, "ml": 0.30}

RISK_THRESHOLDS = {"CRITICAL": 70, "WARNING": 40}


def combine_scores(rule_score, statistical_score, ml_score):
    final = (
        WEIGHTS["rule"] * rule_score
        + WEIGHTS["statistical"] * statistical_score
        + WEIGHTS["ml"] * ml_score
    )
    final = round(final, 1)

    if final >= RISK_THRESHOLDS["CRITICAL"]:
        risk = "CRITICAL"
    elif final >= RISK_THRESHOLDS["WARNING"]:
        risk = "WARNING"
    else:
        risk = "NORMAL"

    return final, risk


def build_explanation(rule_flags, statistical_flags, ml_is_anomaly, ml_score):
    reasons = list(rule_flags) + list(statistical_flags)
    if ml_is_anomaly:
        reasons.append(
            f"ML model (Isolation Forest) flagged this record's overall feature "
            f"combination as anomalous (severity {ml_score:.0f}/100)"
        )
    if not reasons:
        reasons.append("No anomalies detected across rule, statistical, or ML checks")
    return reasons


def recommendation_for(risk):
    return {
        "CRITICAL": "Manual verification required before data is used in bulletins",
        "WARNING": "Recommend supervisor review; may be valid but unusual",
        "NORMAL": "No action needed",
    }[risk]
