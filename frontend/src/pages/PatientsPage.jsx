import { useEffect, useState } from "react";
import { getPatients } from "../api/patients";
import PatientList from "../components/patients/PatientList";
import PatientFormModal from "../components/patients/PatientFormModal";
import "./PatientsPage.css";

function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);

  useEffect(() => {
    getPatients().then(setPatients);
  }, []);

  const filtered = patients.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase())
  );

  function handleAddClick() {
    setEditingPatient(null);
    setShowModal(true);
  }

  function handleEditClick(patient) {
    setEditingPatient(patient);
    setShowModal(true);
  }

  function handleSaved(savedPatient) {
    setPatients((prev) => {
      const exists = prev.some((p) => p.id === savedPatient.id);
      return exists
        ? prev.map((p) => (p.id === savedPatient.id ? savedPatient : p))
        : [...prev, savedPatient];
    });
  }

  return (
    <div className="patients-page">
      <div className="patients-header">
        <div>
          <h1>Patient List</h1>
          <p className="patients-count">{patients.length} records</p>
        </div>
        <button className="new-patient-btn" onClick={handleAddClick}>+ New Patient</button>
      </div>

      <input
        className="patients-search"
        placeholder="Search patients..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 20 }}
      />

      <PatientList patients={filtered} onEdit={handleEditClick} />

      {showModal && (
        <PatientFormModal
          patient={editingPatient}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

export default PatientsPage;