import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Upload from "./pages/Upload.jsx";
import Anomalies from "./pages/Anomalies.jsx";
import RecordDetails from "./pages/RecordDetails.jsx";
import ClusterAnalysis from "./pages/ClusterAnalysis.jsx";
import Reports from "./pages/Reports.jsx";

export default function App() {
  return (
    <div className="flex min-h-screen bg-ink text-white font-display">
      <Sidebar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/anomalies" element={<Anomalies />} />
          <Route path="/records/:recordId" element={<RecordDetails />} />
          <Route path="/clusters" element={<ClusterAnalysis />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  );
}
