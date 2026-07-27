import { Link } from "react-router-dom";
import "./PatientList.css";

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

function PatientList({ patients, onEdit }) {
  return (
    <div className="patient-table">
      <div className="patient-table-header">
        <div>Patient ID</div>
        <div>Full Name</div>
        <div>DOB / Age</div>
        <div>Gender</div>
        <div>Blood Type</div>
        <div>Conditions</div>
        <div>Last Visit</div>
        <div></div>
      </div>

      {patients.map((p) => (
        <div className="patient-table-row" key={p.id}>
          <div className="patient-id">P-{String(p.id).padStart(3, "0")}</div>
          <div className="patient-name">{p.full_name}</div>
          <div>
            {p.date_of_birth} <span className="patient-age">({calculateAge(p.date_of_birth)}y)</span>
          </div>
          <div style={{ textTransform: "capitalize" }}>{p.gender}</div>
          <div className="patient-blood-type">{p.blood_type}</div>

          <div className="patient-conditions">
            <span style={{ color: "#94a3b8" }}>—</span>
          </div>

          <div>—</div>

          <div className="row-actions">
            <button className="edit-btn" onClick={() => onEdit(p)}>Edit</button>
            <Link to={`/patients/${p.id}`} className="open-btn">Open →</Link>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PatientList;