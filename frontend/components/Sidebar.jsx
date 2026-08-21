import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", icon: "◧" },
  { to: "/upload", label: "Upload Data", icon: "⇧" },
  { to: "/anomalies", label: "Anomaly Explorer", icon: "◈" },
  { to: "/clusters", label: "Cluster Analysis", icon: "⬡" },
  { to: "/reports", label: "Reports", icon: "▤" },
];

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-r border-border bg-panel h-screen sticky top-0 flex flex-col">
      <div className="px-5 py-6 border-b border-border">
        <div className="text-accent font-mono text-xs tracking-widest">NSO · MoSPI</div>
        <div className="text-lg font-semibold mt-1">SurveyGuard <span className="text-accent">AI</span></div>
        <div className="text-muted text-xs mt-1">Survey Data Validation Platform</div>
      </div>
      <nav className="flex-1 py-4">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                isActive
                  ? "bg-panel2 text-white border-l-2 border-accent"
                  : "text-muted hover:text-white hover:bg-panel2/50 border-l-2 border-transparent"
              }`
            }
          >
            <span className="text-base">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-border text-xs text-muted">
        Track 1 · Mavericks Hackathon
      </div>
    </aside>
  );
}
