import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getDoctors } from "../../api/doctors";
import { createVisit, submitVisitSigns, getSignCategories } from "../../api/visit";
import SignInput from "./SignInput";

const VISIT_TYPE_OPTIONS = ["First Visit", "Follow-up", "Emergency", "Consultation"];

function VisitModal({ patientId, onClose }) {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [visitType, setVisitType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submittingRef = useRef(false); // synchronous guard, unlike state

  const [commonCategories, setCommonCategories] = useState([]);
  const [signValues, setSignValues] = useState({});

  useEffect(() => {
    getDoctors().then(setDoctors);
    getSignCategories().then((cats) => {
      const filtered = cats
       .map((c) => ({ ...c, signs: (c.signs ?? []).filter((s) => s.doctor_id === null) }))
        .filter((c) => c.signs.length > 0);
      setCommonCategories(filtered);
    });
  }, []);

  function updateSignValue(signId, value) {
    setSignValues((v) => ({ ...v, [signId]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Synchronous guard: blocks a second call immediately, even if it fires
    // before React re-renders the button as disabled (state updates are
    // async/batched, so `disabled={submitting}` alone isn't fast enough to
    // stop a rapid double-click or double Enter-press).
    if (submittingRef.current) return;
    submittingRef.current = true;

    if (!doctorId || !visitDate || !visitType) {
      setError("Please fill in all fields.");
      submittingRef.current = false;
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const visit = await createVisit({
        patient_id: Number(patientId),
        doctor_id: Number(doctorId),
        visit_date: visitDate,
        visit_type: visitType,
      });

      const signsPayload = Object.entries(signValues)
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([sign_definition_id, value]) => ({
          sign_definition_id: Number(sign_definition_id),
          value,
        }));

      if (signsPayload.length > 0) {
        await submitVisitSigns(visit.id, signsPayload);
      }

      navigate(`/visits/${visit.id}/fill`);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not create visit.");
      submittingRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <h3>New Visit</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="field-row modal-field-row">
            <label className="field-label">Doctor</label>
            <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              <option value="">Select doctor...</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.name} {d.specialty ? `— ${d.specialty}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="field-row modal-field-row">
            <label className="field-label">Visit date</label>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
            />
          </div>

          <div className="field-row modal-field-row">
            <label className="field-label">Visit type</label>
            <select value={visitType} onChange={(e) => setVisitType(e.target.value)}>
              <option value="">Select type...</option>
              {VISIT_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {commonCategories.length > 0 && (
            <>
              <hr style={{ margin: "16px 0", border: "none", borderTop: "1px solid #e2e8f0" }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: "#64748b", margin: "0 0 8px" }}>
                Vitals & Initial Assessment (optional)
              </p>
              {commonCategories.map((cat) => (
                <div key={cat.id} style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", margin: "0 0 6px" }}>
                    {cat.name}
                  </p>
                  {cat.signs.map((sign) => (
                    <div className="field-row modal-field-row" key={sign.id}>
                      <label className="field-label">{sign.name}</label>
                      {sign.description && (
                        <p className="sign-description">{sign.description}</p>
                      )}
                      <SignInput
                        sign={sign}
                        categoryName={cat.name}
                        value={signValues[sign.id]}
                        onChange={(val) => updateSignValue(sign.id, val)}
                        disabled={false}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}

          {error && <p style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Creating..." : "Start Visit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VisitModal;