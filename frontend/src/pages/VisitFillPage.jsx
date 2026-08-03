import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getVisit,
  getSignForm,
  getVisitSigns,
  submitVisitSigns,
  updateConclusion,
} from "../api/visit";
import { getMedicalActs } from "../api/medicalActs";
import "./VisitCardPage.css";
import SignInput from "../components/patients/SignInput";

function currentUser() {
  return JSON.parse(localStorage.getItem("user") || "{}");
}

// Search-as-you-type medicine picker, reusing the seeded medical_acts table
// filtered to classification="medicine".
function MedicineSelect({ value, onChange }) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(() => {
      getMedicalActs("medicine", query).then(setOptions);
    }, 200);
    return () => clearTimeout(timeout);
  }, [query, open]);

  function handleSelect(act) {
    onChange(act);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="icd10-select">
      <input
        type="text"
        value={open ? query : value ? value.name : ""}
        placeholder="Search medicine..."
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => setQuery(e.target.value)}
      />
      {open && (
        <div className="icd10-dropdown">
          {options.length === 0 ? (
            <div className="icd10-dropdown-empty">No matches</div>
          ) : (
            options.map((act) => (
              <div
                key={act.id}
                className="icd10-dropdown-item"
                onClick={() => handleSelect(act)}
              >
                <span className="icd10-dropdown-explanation">{act.name}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function PrescribeMedicineModal({ onClose, onSave }) {
  const [medicine, setMedicine] = useState(null);
  const [dose, setDose] = useState("");
  const [frequency, setFrequency] = useState("");
  const [route, setRoute] = useState("");
  const [duration, setDuration] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!medicine) {
      setError("Please select a medicine.");
      return;
    }
    onSave({
      medical_act_id: medicine.id,
      medicine_name: medicine.name,
      dose,
      frequency,
      route,
      duration,
    });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <h3>Prescribe Medicine</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="field-row modal-field-row">
            <label className="field-label">Medicine</label>
            <MedicineSelect value={medicine} onChange={setMedicine} />
          </div>

          <div className="field-row modal-field-row">
            <label className="field-label">Dose</label>
            <input
              type="text"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              placeholder="e.g. 500mg"
            />
          </div>

          <div className="field-row modal-field-row">
            <label className="field-label">Frequency</label>
            <input
              type="text"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              placeholder="e.g. Twice daily"
            />
          </div>

          <div className="field-row modal-field-row">
            <label className="field-label">Route</label>
            <input
              type="text"
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              placeholder="e.g. Oral"
            />
          </div>

          <div className="field-row modal-field-row">
            <label className="field-label">Duration</label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 7 days"
            />
          </div>

          {error && <p style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Prescription
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AttachFileModal({ onClose, onSave }) {
  const [file, setFile] = useState(null);
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      if (!label) setLabel(f.name);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a file.");
      return;
    }
    onSave({
      file,
      label: label || file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      type: file.type,
    });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <h3>Attach File</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="field-row modal-field-row">
            <label className="field-label">File</label>
            <input type="file" onChange={handleFileChange} />
          </div>

          <div className="field-row modal-field-row">
            <label className="field-label">Label (optional)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Lab report, X-ray scan"
            />
          </div>

          {error && <p style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Attach
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function VisitFillPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = currentUser();
  const role = user.role || "staff";

  const [visit, setVisit] = useState(null);
  const [categories, setCategories] = useState([]);
  const [values, setValues] = useState({});
  const [conclusion, setConclusion] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Frontend-only for now — not yet saved to the backend
  const [prescriptions, setPrescriptions] = useState([]);
  const [showPrescribeModal, setShowPrescribeModal] = useState(false);

  // Frontend-only for now — not yet saved to the backend
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [showAttachModal, setShowAttachModal] = useState(false);

  useEffect(() => {
    async function load() {
      const [visitData, formData, existingSigns] = await Promise.all([
        getVisit(id),
        getSignForm(id),
        getVisitSigns(id),
      ]);
      setVisit(visitData);
      setCategories(formData);
      setConclusion(visitData.conclusion || "");

      const initialValues = {};
      existingSigns.forEach((s) => {
        initialValues[s.sign_definition_id] = s.value;
      });
      setValues(initialValues);
      setLoading(false);
    }
    load();
  }, [id]);

  function updateValue(signId, value) {
    setValues((v) => ({ ...v, [signId]: value }));
  }

  function handleAddPrescription(prescription) {
    setPrescriptions((prev) => [...prev, prescription]);
  }

  function handleRemovePrescription(idx) {
    setPrescriptions((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleAddFile(fileEntry) {
    setAttachedFiles((prev) => [...prev, fileEntry]);
  }

  function handleRemoveFile(idx) {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleFinish() {
    setSaving(true);
    setError("");
    try {
      const payload = Object.entries(values)
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([sign_definition_id, value]) => ({
          sign_definition_id: Number(sign_definition_id),
          value,
        }));

      if (payload.length > 0) {
        await submitVisitSigns(id, payload);
      }

      if (role === "doctor") {
        await updateConclusion(id, conclusion);
      }

      // TODO: once the backend endpoints exist, save `prescriptions` and
      // `attachedFiles` (as a real upload) here too.

      // Frontend-only persistence for now (no backend upload endpoint yet):
      // save file metadata to localStorage so the read-only Visit Card view
      // can display them after navigating away from this page.
      if (attachedFiles.length > 0) {
        const filesMeta = attachedFiles.map((f) => ({
          label: f.label,
          url: f.url,
          size: f.size,
          type: f.type,
        }));
        localStorage.setItem(`visit_${id}_files`, JSON.stringify(filesMeta));
      }

      navigate(`/visits/${id}`);
    } catch (err) {
      setError("Could not save. Please try again.");
      setSaving(false);
    }
  }

  if (loading) return <div className="visit-card-page">Loading...</div>;
  if (!visit) return <div className="visit-card-page">Visit not found.</div>;

  return (
    <div className="visit-card-page">
      <div className="visit-card-header">
        <div>
          <p className="visit-card-eyebrow">
            {visit.visit_type} &middot; {visit.visit_date}
          </p>
          <h1>Visit — Fill</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn-secondary" onClick={() => setShowAttachModal(true)}>
            + Attach File
          </button>
          {role === "doctor" && (
            <button className="btn-secondary" onClick={() => setShowPrescribeModal(true)}>
              + Prescribe Medicine
            </button>
          )}
          <span className={`role-badge role-${role}`}>
            {role === "doctor" ? "Doctor view" : "Staff view"}
          </span>
        </div>
      </div>

      {categories.length === 0 ? (
        <p className="empty-hint">No signs available to fill for your role yet.</p>
      ) : (
        (() => {
          const chiefComplaint = categories.find((c) => c.name === "Chief Complaint");
          const vitals = categories.find(
            (c) => c.name === "Vital Signs" || c.name === "Vitals"
          );
          const physicalExam = categories.find((c) => c.name === "Physical Exam");
          const featuredIds = new Set(
            [chiefComplaint, vitals, physicalExam].filter(Boolean).map((c) => c.id)
          );
          const remaining = categories.filter((c) => !featuredIds.has(c.id));

          function renderCategory(cat) {
            return (
              <div className="patient-card-section" key={cat.id}>
                <h3>{cat.name}</h3>
                <div className="sign-form-grid">
                  {cat.signs.map((sign) => {
                    const isDoctorOnlySign =
                      Boolean(sign.doctor_id) || cat.name === "Physical Exam";
                    const isLockedForStaff = isDoctorOnlySign && role !== "doctor";

                    return (
                      <div className="field-row modal-field-row" key={sign.id}>
                        <label className="field-label">{sign.name}</label>
                        {sign.description && (
                          <p className="sign-description">{sign.description}</p>
                        )}
                        <SignInput
                          sign={sign}
                          categoryName={cat.name}
                          value={values[sign.id]}
                          onChange={(val) => updateValue(sign.id, val)}
                          disabled={isLockedForStaff}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          return (
            <>
              {chiefComplaint && (
                <div className="sign-categories-grid full-width-row">
                  {renderCategory(chiefComplaint)}
                </div>
              )}

              {(vitals || physicalExam) && (
                <div className="sign-categories-grid two-col-row">
                  {vitals && renderCategory(vitals)}
                  {physicalExam && renderCategory(physicalExam)}
                </div>
              )}

              {remaining.length > 0 && (
                <div className="sign-categories-grid">
                  {[...remaining]
                    .sort((a, b) => a.signs.length - b.signs.length)
                    .map(renderCategory)}
                </div>
              )}
            </>
          );
        })()
      )}

      {role === "doctor" && (
        <div className="patient-card-section">
          <div className="section-header">
            <h3>Prescriptions</h3>
            <button className="add-entry-btn" onClick={() => setShowPrescribeModal(true)}>
              + Add
            </button>
          </div>

          {prescriptions.length === 0 ? (
            <p className="empty-hint">No medicines prescribed yet.</p>
          ) : (
            <div className="entries-scroll">
              {prescriptions.map((p, idx) => (
                <div className="history-entry" key={idx}>
                  <div className="field-label">Medicine</div>
                  <div className="field-value-lg">{p.medicine_name}</div>
                  {p.dose && (
                    <div className="field-row">
                      <span className="field-label">Dose</span>
                      <span className="field-value">{p.dose}</span>
                    </div>
                  )}
                  {p.frequency && (
                    <div className="field-row">
                      <span className="field-label">Frequency</span>
                      <span className="field-value">{p.frequency}</span>
                    </div>
                  )}
                  {p.route && (
                    <div className="field-row">
                      <span className="field-label">Route</span>
                      <span className="field-value">{p.route}</span>
                    </div>
                  )}
                  {p.duration && (
                    <div className="field-row">
                      <span className="field-label">Duration</span>
                      <span className="field-value">{p.duration}</span>
                    </div>
                  )}
                  <div style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => handleRemovePrescription(idx)}
                      className="entry-remove-btn"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="patient-card-section">
        <div className="section-header">
          <h3>Attached Files</h3>
          <button className="add-entry-btn" onClick={() => setShowAttachModal(true)}>
            + Add
          </button>
        </div>

        {attachedFiles.length === 0 ? (
          <p className="empty-hint">No files attached to this visit yet.</p>
        ) : (
          <div className="attached-files-grid">
            {attachedFiles.map((f, idx) => (
              <div className="history-entry" key={idx}>
                <div className="attached-file-top">
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="attached-file-link"
                  >
                    {f.label}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="entry-remove-btn"
                  >
                    Remove
                  </button>
                </div>
                <div className="field-row">
                  <span className="field-label">Size</span>
                  <span className="field-value">{formatFileSize(f.size)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {role === "doctor" && (
        <div className="patient-card-section">
          <h3>Conclusion</h3>
          <textarea
            className="conclusion-textarea"
            rows={4}
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
            placeholder="Clinical conclusion..."
          />
        </div>
      )}

      <div className="visit-card-actions" style={{ marginTop: 24 }}>
        {error && <span style={{ color: "#dc2626", fontSize: 13 }}>{error}</span>}
        <button className="btn-primary" onClick={handleFinish} disabled={saving}>
          {saving ? "Saving..." : "Finish & View Visit Card"}
        </button>
      </div>

      {showPrescribeModal && (
        <PrescribeMedicineModal
          onClose={() => setShowPrescribeModal(false)}
          onSave={handleAddPrescription}
        />
      )}

      {showAttachModal && (
        <AttachFileModal
          onClose={() => setShowAttachModal(false)}
          onSave={handleAddFile}
        />
      )}
    </div>
  );
}

export default VisitFillPage;