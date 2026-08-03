import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./PatientList.css";

const BLOOD_TYPE_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

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
  const [genderFilter, setGenderFilter] = useState("");
  const [bloodTypeFilter, setBloodTypeFilter] = useState("");
  const [ageFilter, setAgeFilter] = useState("");

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if (genderFilter && p.gender !== genderFilter) return false;
      if (bloodTypeFilter && p.blood_type !== bloodTypeFilter) return false;

      if (ageFilter !== "" && calculateAge(p.date_of_birth) !== Number(ageFilter)) return false;

      return true;
    });
  }, [patients, genderFilter, bloodTypeFilter, ageFilter]);

  function clearFilters() {
    setGenderFilter("");
    setBloodTypeFilter("");
    setAgeFilter("");
  }

  const hasActiveFilters = genderFilter || bloodTypeFilter || ageFilter !== "";

  return (
    <div className="patient-table">
      <div className="patient-filters">
        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">Genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <select
          value={bloodTypeFilter}
          onChange={(e) => setBloodTypeFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">Blood types</option>
          {BLOOD_TYPE_OPTIONS.map((bt) => (
            <option key={bt} value={bt}>
              {bt}
            </option>
          ))}
        </select>

        <input
          type="number"
          min="0"
          placeholder="Age"
          value={ageFilter}
          onChange={(e) => setAgeFilter(e.target.value)}
          className="filter-input age-input"
        />

        {hasActiveFilters && (
          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear filters
          </button>
        )}

        <span className="filter-result-count">
          {filteredPatients.length} of {patients.length}
        </span>
      </div>

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

      {filteredPatients.map((p) => (
        <div className="patient-table-row" key={p.id}>
          <div className="patient-id">P-{String(p.id).padStart(3, "0")}</div>
          <div className="patient-name">{p.full_name}</div>
          <div>
            {p.date_of_birth} <span className="patient-age">({calculateAge(p.date_of_birth)}y)</span>
          </div>
          <div style={{ textTransform: "capitalize" }}>{p.gender}</div>
          <div className="patient-blood-type">{p.blood_type}</div>

          <div className="patient-conditions">
            {p.condition || <span style={{ color: "#94a3b8" }}>—</span>}
          </div>

          <div>{p.last_visit || "—"}</div>

          <div className="row-actions">
            <button className="edit-btn" onClick={() => onEdit(p)}>Edit</button>
            <Link to={`/patients/${p.id}`} className="open-btn">Open →</Link>
          </div>
        </div>
      ))}

      {filteredPatients.length === 0 && (
        <div className="patient-table-empty">No patients match these filters.</div>
      )}
    </div>
  );
}

export default PatientList;