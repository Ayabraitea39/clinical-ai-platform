import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPatientById } from "../api/patients";
import "./PatientCardPage.css";

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

function PatientCardPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPatientById(id).then((data) => {
      setPatient(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="patient-card-page">Loading...</div>;
  if (!patient) return <div className="patient-card-page">Patient not found.</div>;

  return (
    <div className="patient-card-page">

      <div className="patient-card-header">
        <div>
          <h1>{patient.full_name}</h1>
        </div>
      </div>

      <div className="patient-card-grid">
        <div className="patient-card-section">
          <h3>Demographics</h3>

        <div className="field-row">
  <span className="field-label">Date of Birth</span>
  <span className="field-value">
    {patient.date_of_birth} <span className="age-suffix">({calculateAge(patient.date_of_birth)}y)</span>
  </span>
</div>
          <div className="field-row">
            <span className="field-label">Gender</span>
            <span className="field-value" style={{ textTransform: "capitalize" }}>
              {patient.gender}
            </span>
          </div>

          <div className="field-row">
            <span className="field-label">Blood Type</span>
            <span className="field-value blood-type">{patient.blood_type}</span>
          </div>

          <div className="field-row">
            <span className="field-label">Nationality</span>
            <span className="field-value">{patient.nationality}</span>
          </div>

          <div className="field-row">
            <span className="field-label">Social Status</span>
            <span className="field-value" style={{ textTransform: "capitalize" }}>
              {patient.social_status}
            </span>
          </div>
        </div>

        <div className="patient-card-section">
          <h3>Contact</h3>

          <div className="field-row">
            <span className="field-label">Phone</span>
            <span className="field-value">{patient.phone}</span>
          </div>

          <div className="field-row">
            <span className="field-label">Email</span>
            <span className="field-value">{patient.email}</span>
          </div>

          <div className="field-row">
            <span className="field-label">Address</span>
            <span className="field-value">{patient.address}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientCardPage;