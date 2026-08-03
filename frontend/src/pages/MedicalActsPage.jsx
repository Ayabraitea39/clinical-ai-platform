import { useEffect, useState } from "react";
import { getMedicalActs } from "../api/medicalActs";
import "./MedicalActsPage.css";

const CLASSIFICATIONS = [
  { key: "medicine", label: "Medicine" },
  { key: "test", label: "Test" },
  { key: "imaging", label: "Imaging" },
  { key: "other", label: "Other" },
];

function MedicalActsPage() {
  const [activeTab, setActiveTab] = useState("medicine");
  const [acts, setActs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      getMedicalActs(activeTab, search).then((data) => {
        setActs(data);
        setLoading(false);
      });
    }, 250);

    return () => clearTimeout(timeout);
  }, [activeTab, search]);

  return (
    <div className="medical-acts-page">
      <div className="medical-acts-header">
        <h1>Medical Acts</h1>
      </div>

      <div className="tabs">
        {CLASSIFICATIONS.map((c) => (
          <button
            key={c.key}
            className={`tab ${activeTab === c.key ? "active" : ""}`}
            onClick={() => {
              setActiveTab(c.key);
              setSearch("");
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="medical-acts-search-wrap">
        <input
          type="text"
          placeholder={`Search ${CLASSIFICATIONS.find((c) => c.key === activeTab)?.label.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="medical-acts-search-input"
        />
      </div>

      <div className="medical-acts-table">
        <div className="medical-acts-table-header">
          <div>Name</div>
        </div>

        {loading ? (
          <div className="medical-acts-table-empty">Loading...</div>
        ) : acts.length === 0 ? (
          <div className="medical-acts-table-empty">
            No {CLASSIFICATIONS.find((c) => c.key === activeTab)?.label.toLowerCase()} found.
          </div>
        ) : (
          acts.map((act) => (
            <div className="medical-acts-table-row" key={act.id}>
              <div className="medical-acts-name">{act.name}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MedicalActsPage;