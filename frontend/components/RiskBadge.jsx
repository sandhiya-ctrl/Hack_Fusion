const STYLES = {
  CRITICAL: "bg-critical/15 text-critical border-critical/40",
  WARNING: "bg-warning/15 text-warning border-warning/40",
  NORMAL: "bg-normal/15 text-normal border-normal/40",
};

export default function RiskBadge({ risk }) {
  return (
    <span className={`px-2.5 py-1 rounded text-xs font-medium border ${STYLES[risk] || STYLES.NORMAL}`}>
      {risk}
    </span>
  );
}
