import { useState, useEffect } from "react";
import { createPatient, updatePatient } from "../../api/patients";
import "./PatientFormModal.css";

const emptyForm = {
  full_name: "",
  date_of_birth: "",
  gender: "",
  blood_type: "",
  nationality: "",
  social_status: "",
  phone: "",
  email: "",
  address: "",
};

function PatientFormModal({ patient, onClose, onSaved }) {
  const isEditMode = Boolean(patient);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (patient) {
      setForm({
        full_name: patient.full_name || "",
        date_of_birth: patient.date_of_birth || "",
        gender: patient.gender || "",
        blood_type: patient.blood_type || "",
        nationality: patient.nationality || "",
        social_status: patient.social_status || "",
        phone: patient.phone || "",
        email: patient.email || "",
        address: patient.address || "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [patient]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const saved = isEditMode
      ? await updatePatient(patient.id, form)
      : await createPatient(form);
    onSaved(saved);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>{isEditMode ? "Edit Patient" : "New Patient"}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-field full-width">
            <label>Full Name</label>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                value={form.date_of_birth}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label>Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} required>
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Blood Type</label>
              <select name="blood_type" value={form.blood_type} onChange={handleChange} required>
                <option value="">Select...</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div className="form-field">
              <label>Nationality</label>
              <select name="nationality" value={form.nationality} onChange={handleChange} required>
                <option value="">Select...</option>
                <option value="Lebanese">Lebanese</option>
                <option value="Syrian">Syrian</option>
                <option value="Palestinian">Palestinian</option>
                <option value="Jordanian">Jordanian</option>
                <option value="Egyptian">Egyptian</option>
                <option value="Iraqi">Iraqi</option>
                <option value="Saudi">Saudi</option>
                <option value="Emirati">Emirati</option>
                <option value="French">French</option>
                <option value="American">American</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Social Status</label>
              <select name="social_status" value={form.social_status} onChange={handleChange} required>
                <option value="">Select...</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>

            <div className="form-field">
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label>Address</label>
              <input name="address" value={form.address} onChange={handleChange} required />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              {isEditMode ? "Save Changes" : "Save Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PatientFormModal;