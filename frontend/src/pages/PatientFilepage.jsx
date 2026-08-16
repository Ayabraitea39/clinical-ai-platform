import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPatientById } from "../api/patients";
import { getPatientVisits, getSignForm, getVisitSigns, updateVisitStatus } from "../api/visit";
import { getVisitOrders, getVisitPrescriptions } from "../api/MedicalActs";
import VisitModal from "../components/patients/VisitModal";
import "./PatientFilePage.css";

function calculateAge(dob) {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "cancelled", label: "Cancelled" },
];

async function loadVisitSigns(visitId) {
  const [form, recorded] = await Promise.all([
    getSignForm(visitId),
    getVisitSigns(visitId),
  ]);

  const valueByDefId = {};
  recorded.forEach((r) => {
    valueByDefId[r.sign_definition_id] = r.value;
  });

  const signs = [];
  form.forEach((category) => {
    category.signs.forEach((sign) => {
      const value = valueByDefId[sign.id];
      if (value !== undefined && value !== null && value !== "") {
        signs.push({ name: sign.name, value });
      }
    });
  });

  return signs;
}

async function loadVisitMedicalActs(visitId) {
  const [orders, prescriptions] = await Promise.all([
    getVisitOrders(visitId),
    getVisitPrescriptions(visitId),
  ]);

  const acts = [];

  prescriptions.forEach((p) => {
    acts.push({
      label: p.medical_act.name,
      kindLabel: "Medicine",
      kind: "medicine",
    });
  });

  orders.forEach((o) => {
    const kindLabels = { test: "Lab Test", imaging: "Imaging", other: "Other" };
    acts.push({
      label: o.medical_act.name,
      kindLabel: kindLabels[o.medical_act.classification] || "Ordered",
      kind: o.medical_act.classification,
    });
  });

  return acts;
}

function VisitStatusSelect({ visitId, status, onChanged }) {
  const [saving, setSaving] = useState(false);

  async function handleChange(e) {
    const newStatus = e.target.value;
    setSaving(true);
    try {
      await updateVisitStatus(visitId, newStatus);
      onChanged(visitId, newStatus);
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      className={`visit-status-select visit-status-${status}`}
      value={status}
      disabled={saving}
      onChange={handleChange}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function PatientFilePage() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [visits, setVisits] = useState([]);
  const [visitSignsById, setVisitSignsById] = useState({});
  const [visitActsById, setVisitActsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [showVisitModal, setShowVisitModal] = useState(false);

  useEffect(() => {
    Promise.all([getPatientById(id), getPatientVisits(id)]).then(
      ([patientData, visitsData]) => {
        setPatient(patientData);
        setVisits(visitsData);
        setLoading(false);

        Promise.all(
          visitsData.map((v) =>
            loadVisitSigns(v.id).then((signs) => [v.id, signs])
          )
        ).then((pairs) => {
          const map = {};
          pairs.forEach(([visitId, signs]) => {
            map[visitId] = signs;
          });
          setVisitSignsById(map);
        });

        Promise.all(
          visitsData.map((v) =>
            loadVisitMedicalActs(v.id).then((acts) => [v.id, acts])
          )
        ).then((pairs) => {
          const map = {};
          pairs.forEach(([visitId, acts]) => {
            map[visitId] = acts;
          });
          setVisitActsById(map);
        });
      }
    );
  }, [id]);

  function handleStatusChanged(visitId, newStatus) {
    setVisits((prev) =>
      prev.map((v) => (v.id === visitId ? { ...v, status: newStatus } : v))
    );
  }

  if (loading) return <div className="patient-file-page">Loading...</div>;
  if (!patient) return <div className="patient-file-page">Patient not found.</div>;

  const age = calculateAge(patient.date_of_birth);

  return (
    <div className="patient-file-page">
      <div className="patient-file-header">
        <div>
          <p className="patient-file-eyebrow">Patient File &middot; Longitudinal Record</p>
          <h1>{patient.full_name}</h1>
          <p className="patient-file-subline">
            {age}y &middot; {patient.gender} &middot; {patient.blood_type} &middot; {patient.nationality}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link to={`/patients/${id}`} className="btn-secondary-link">
            &larr; Back to Patient Card
          </Link>
          <button className="new-visit-btn" onClick={() => setShowVisitModal(true)}>
            + New Visit
          </button>
        </div>
      </div>

      <div className="patient-card-section">
        <h3>Visit History</h3>

        {visits.length === 0 ? (
          <p className="empty-hint">No visits recorded yet.</p>
        ) : (
          <div className="visit-timeline">
            {visits.map((v) => {
              const signs = visitSignsById[v.id];
              const acts = visitActsById[v.id];
              const status = v.status || "active";

              return (
                <div
                  className={`visit-timeline-item ${status === "cancelled" ? "visit-timeline-item-cancelled" : ""}`}
                  key={v.id}
                >
                  <div className="visit-timeline-date">
                    <span className="visit-timeline-day">
                      {new Date(v.visit_date).toLocaleDateString(undefined, {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                    <span className="visit-timeline-year">
                      {new Date(v.visit_date).getFullYear()}
                    </span>
                  </div>
                  <div className="visit-timeline-body">
                    <div className="visit-timeline-top">
                      <span className={`visit-type-badge visit-type-${v.visit_type.toLowerCase().replace(/\s+/g, "-")}`}>
                        {v.visit_type}
                      </span>
                      <span className="visit-timeline-doctor">Dr. {v.doctor_name}</span>

                      <span className="visit-timeline-status-wrap">
                        <VisitStatusSelect
                          visitId={v.id}
                          status={status}
                          onChanged={handleStatusChanged}
                        />
                      </span>

                      <Link to={`/visits/${v.id}`} className="visit-timeline-view-link">
                        View &rarr;
                      </Link>
                    </div>

                    {signs === undefined ? (
                      <p className="visit-timeline-signs-loading">Loading signs...</p>
                    ) : signs.length > 0 ? (
                      <div className="visit-timeline-signs">
                        {signs.map((s, idx) => (
                          <span className="visit-timeline-sign" key={idx}>
                            <span className="visit-timeline-sign-name">{s.name}</span>
                            <span className="visit-timeline-sign-value">{s.value}</span>
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {acts === undefined ? (
                      <p className="visit-timeline-signs-loading">Loading medical acts...</p>
                    ) : acts.length > 0 ? (
                      <div className="visit-timeline-acts">
                        {acts.map((a, idx) => (
                          <span
                            className={`visit-timeline-act visit-timeline-act-${a.kind}`}
                            key={idx}
                          >
                            <span className="visit-timeline-act-kind">{a.kindLabel}</span>
                            <span className="visit-timeline-act-name">{a.label}</span>
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {v.conclusion ? (
                      <p className="visit-timeline-conclusion">{v.conclusion}</p>
                    ) : (
                      <p className="visit-timeline-conclusion empty">No conclusion recorded yet.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showVisitModal && (
        <VisitModal patientId={id} onClose={() => setShowVisitModal(false)} />
      )}
    </div>
  );
}

export default PatientFilePage;