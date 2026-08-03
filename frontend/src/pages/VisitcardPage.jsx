import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getVisit, getSignForm, getVisitSigns } from "../api/visit";
import "./VisitCardPage.css";

function formatValue(sign, rawValue) {
  if (rawValue === undefined || rawValue === null || rawValue === "") return null;

  const type = String(sign.data_type || "").trim().toLowerCase();

  if (type === "boolean") {
    return rawValue === "true" ? "Yes" : "No";
  }
  if (type === "multi_select") {
    return rawValue
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .join(", ");
  }
  return rawValue;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function VisitCardPage() {
  const { id } = useParams();
  const [visit, setVisit] = useState(null);
  const [categories, setCategories] = useState([]);
  const [signValues, setSignValues] = useState({});
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const results = await Promise.all([
        getVisit(id),
        getSignForm(id),
        getVisitSigns(id),
      ]);
      const visitData = results[0];
      const formData = results[1];
      const existingSigns = results[2];

      setVisit(visitData);
      setCategories(formData);

      const valuesMap = {};
      existingSigns.forEach(function (s) {
        valuesMap[s.sign_definition_id] = s.value;
      });
      setSignValues(valuesMap);

      try {
        const stored = localStorage.getItem("visit_" + id + "_files");
        setAttachedFiles(stored ? JSON.parse(stored) : []);
      } catch (e) {
        setAttachedFiles([]);
      }

      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="visit-card-page">Loading...</div>;
  }

  if (!visit) {
    return <div className="visit-card-page">Visit not found.</div>;
  }

  const filledCategories = categories
    .map(function (cat) {
      const filteredSigns = cat.signs.filter(function (s) {
        return formatValue(s, signValues[s.id]) !== null;
      });
      return Object.assign({}, cat, { signs: filteredSigns });
    })
    .filter(function (cat) {
      return cat.signs.length > 0;
    });

  return (
    <div className="visit-card-page">
      <div className="visit-card-header">
        <div>
          <p className="visit-card-eyebrow">
            {visit.visit_type} &middot; {visit.visit_date}
          </p>
          <h1>Visit</h1>
        </div>
        <Link to={"/visits/" + id + "/fill"} className="btn-secondary">
          Edit
        </Link>
      </div>

      {filledCategories.length === 0 && (
        <p className="empty-hint">No clinical data recorded for this visit yet.</p>
      )}

      {filledCategories.length > 0 && (
        <div className="sign-categories-grid">
          {filledCategories.map(function (cat) {
            return (
              <div className="patient-card-section" key={cat.id}>
                <h3>{cat.name}</h3>
                {cat.signs.map(function (sign) {
                  return (
                    <div className="view-field-row" key={sign.id}>
                      <span className="view-field-label">{sign.name}</span>
                      <span className="view-field-value">
                        {formatValue(sign, signValues[sign.id])}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {attachedFiles.length > 0 && (
        <div className="patient-card-section">
          <h3>Attached Files</h3>
          <div className="attached-files-grid">
            {attachedFiles.map(function (f, idx) {
              const parts = f.label.split(".");
              const extension = parts[parts.length - 1].toUpperCase().slice(0, 4);
              return (
                <div className="history-entry" key={idx}>
                  <div className="attached-file-top">
                    <div className="attached-file-icon">{extension}</div>
                    <span className="attached-file-size">{formatFileSize(f.size)}</span>
                  </div>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="attached-file-link"
                  >
                    {f.label}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {visit.conclusion && (
        <div className="patient-card-section">
          <h3>Conclusion</h3>
          <p className="conclusion-text">{visit.conclusion}</p>
        </div>
      )}
    </div>
  );
}

export default VisitCardPage;