import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPatientById } from "../api/patients";
import { getPatientVisits, getSignForm, getVisitSigns } from "../api/visit";
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

function PatientFilePage() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [visits, setVisits] = useState([]);
  const [visitSignsById, setVisitSignsById] = useState({});
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
      }
    );
  }, [id]);

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

              return (
                <Link to={`/visits/${v.id}`} className="visit-timeline-item" key={v.id}>
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

                    {v.conclusion ? (
                      <p className="visit-timeline-conclusion">{v.conclusion}</p>
                    ) : (
                      <p className="visit-timeline-conclusion empty">No conclusion recorded yet.</p>
                    )}
                  </div>
                </Link>
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