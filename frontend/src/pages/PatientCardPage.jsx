import { useEffect, useRef, useState } from "react";
import {
  getPatientById,
  getPatientFiles,
  uploadPatientFile,
  deletePatientFile,
  getChronicDiseases,
  addChronicDisease,
  deleteChronicDisease,
  getFamilyHistory,
  addFamilyHistory,
  deleteFamilyHistory,
  getSurgicalHistory,
  addSurgicalHistory,
  deleteSurgicalHistory,
  getImmunizations,
  addImmunization,
  deleteImmunization,
  getAllergies,
  addAllergy,
  deleteAllergy,
  getCurrentMedications,
  addCurrentMedication,
  deleteCurrentMedication,
  getInsuranceCoverage,
  addInsuranceCoverage,
  updateInsuranceCoverage,
  deleteInsuranceCoverage,
  getHabits,
  addHabit,
  deleteHabit,
} from "../api/patients";
import { getIcd10Codes } from "../api/icd10";
import "./PatientCardPage.css";
import VisitModal from "../components/patients/VisitModal";
import ChatWidget from "../components/chatbot/ChatWidget";
import { useParams, Link } from "react-router-dom";

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

// FastAPI validation errors come back as `detail: [{ type, loc, msg, input,
// ctx }, ...]` (or occasionally a plain string for non-validation errors).
// React can't render that array/object directly, so every catch block that
// wants to show `err` to the user must go through this first.
function extractErrorMessage(err, fallback) {
  const detail = err?.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return (
      detail
        .map((e) => {
          if (typeof e === "string") return e;
          const field = Array.isArray(e?.loc) ? e.loc[e.loc.length - 1] : null;
          return field ? `${field}: ${e.msg}` : e?.msg;
        })
        .filter(Boolean)
        .join(", ") || fallback
    );
  }
  return fallback;
}

const CATEGORY_META = {
  chronic_diseases: {
    label: "Chronic Disease",
    sectionTitle: "Chronic Conditions",
    fields: [
      { key: "icd10_code", label: "ICD-10 code", type: "icd10", required: true },
      { key: "discovery_date", label: "Discovery date", type: "date" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  family_history: {
    label: "Family History",
    sectionTitle: "Family History",
    fields: [
      { key: "icd10_code", label: "Disease (ICD-10)", type: "icd10", required: true },
      {
        key: "kinship",
        label: "Kinship relation",
        type: "select",
        options: [
          "Mother",
          "Father",
          "Sister",
          "Brother",
          "Grandmother",
          "Grandfather",
          "Aunt/Uncle",
          "Cousin",
          "Other",
        ],
      },
      {
        key: "living_conditions",
        label: "Living conditions",
        type: "select",
        options: ["Alive", "Deceased", "Unknown"],
      },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  surgical_history: {
    label: "Surgical History",
    sectionTitle: "Surgical History",
    fields: [
      { key: "procedure", label: "Procedure description", type: "text", required: true },
      { key: "surgery_date", label: "Surgery date", type: "date" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  immunizations: {
    label: "Immunization",
    sectionTitle: "Immunizations",
    fields: [
      { key: "vaccine_type", label: "Vaccine type", type: "text", required: true },
      { key: "age_at_vaccination", label: "Age at vaccination", type: "number" },
      {
        key: "age_unit",
        label: "Age unit",
        type: "select",
        options: ["days", "months", "years"],
      },
      { key: "taken_status", label: "Taken", type: "checkbox" },
    ],
  },
  allergies: {
    label: "Allergy",
    sectionTitle: "Allergies",
    fields: [
      { key: "allergen", label: "Allergen", type: "text", required: true },
      { key: "reaction", label: "Reaction description", type: "text" },
      {
        key: "severity",
        label: "Severity",
        type: "select",
        options: ["Mild", "Moderate", "Severe"],
      },
    ],
  },
  current_medications: {
    label: "Current Medication",
    sectionTitle: "Medications",
    fields: [
      { key: "medicine_name", label: "Medicine name", type: "text", required: true },
      { key: "start_date", label: "Start date", type: "date" },
      { key: "dose", label: "Dosage", type: "text" },
      { key: "frequency", label: "Frequency", type: "text" },
      {
        key: "duration",
        label: "Duration",
        type: "select",
        options: [
          "1 week",
          "2 weeks",
          "1 month",
          "2 months",
          "3 months",
          "6 months",
          "1 year",
          "Ongoing / Indefinite",
        ],
      },
    ],
  },
  insurance_coverage: {
    label: "Insurance Coverage",
    sectionTitle: "Insurance Coverage",
    fields: [
      { key: "provider", label: "Insurance provider", type: "text", required: true },
      { key: "policy_number", label: "Policy number", type: "text" },
    ],
  },
  habits: {
    label: "Addiction & Lifestyle Habit",
    sectionTitle: "Lifestyle Habits",
    fields: [
      { key: "smoking_packs_per_day", label: "Smoking (packs/day)", type: "number" },
      { key: "smoking_quit_date", label: "Smoking quit date", type: "date" },
      { key: "hookah", label: "Hookah", type: "checkbox" },
      { key: "cigarettes", label: "E-cigarettes", type: "checkbox" },
      { key: "alcohol", label: "Alcohol use", type: "checkbox" },
      { key: "drug_use", label: "Drug use", type: "checkbox" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
};

// Maps each backend-wired category to its get/add/delete (and, for insurance,
// update) functions, so the rest of the component can stay generic instead
// of a big switch statement. Only insurance_coverage has an `update` key,
// since it's the only category whose backend exposes a PUT endpoint — habits
// is backend-wired now too (get/add/remove) but intentionally has no edit
// flow, same as chronic_diseases.
const CATEGORY_API = {
  chronic_diseases: { get: getChronicDiseases, add: addChronicDisease, remove: deleteChronicDisease },
  habits: { get: getHabits, add: addHabit, remove: deleteHabit },
  family_history: { get: getFamilyHistory, add: addFamilyHistory, remove: deleteFamilyHistory },
  surgical_history: { get: getSurgicalHistory, add: addSurgicalHistory, remove: deleteSurgicalHistory },
  immunizations: { get: getImmunizations, add: addImmunization, remove: deleteImmunization },
  allergies: { get: getAllergies, add: addAllergy, remove: deleteAllergy },
  current_medications: { get: getCurrentMedications, add: addCurrentMedication, remove: deleteCurrentMedication },
  insurance_coverage: {
    get: getInsuranceCoverage,
    add: addInsuranceCoverage,
    remove: deleteInsuranceCoverage,
    update: updateInsuranceCoverage,
  },
};

// Which tab each category belongs to. chronic_diseases + habits live inside
// the Overview tab as two side-by-side cards (habits is backend-wired but
// still doesn't get its own tab); everything else gets its own tab.
// "attached_files" is intentionally NOT in CATEGORY_META anymore — it's real
// backend data now, handled separately from the generic category pattern.
const TABS = [
  { key: "overview", label: "Overview" },
  { key: "allergies", label: "Allergies", categoryKey: "allergies" },
  { key: "medications", label: "Medications", categoryKey: "current_medications" },
  { key: "family_history", label: "Family History", categoryKey: "family_history" },
  { key: "surgical_history", label: "Surgical History", categoryKey: "surgical_history" },
  { key: "immunizations", label: "Immunizations", categoryKey: "immunizations" },
  { key: "insurance", label: "Insurance", categoryKey: "insurance_coverage" },
  { key: "attached_files", label: "Attached Files" },
];

// Pydantic's Optional[date] / Optional[int] fields accept a real value or
// null — but NOT an empty string. Our forms default every text-like field
// to "" (see emptyFormFor), so an untouched date/number field sends ""
// straight into the request body and the backend 422s on it. This walks
// the form right before submit and swaps "" -> null for any field whose
// type isn't plain text/textarea/select/checkbox, so blank fields survive
// validation as "not provided" instead of "invalid date".
function sanitizeFormForSubmit(categoryKey, form) {
  const meta = CATEGORY_META[categoryKey];
  const cleaned = { ...form };
  meta.fields.forEach((f) => {
    const value = cleaned[f.key];
    if (value === "" && (f.type === "date" || f.type === "number")) {
      cleaned[f.key] = null;
    }
  });
  return cleaned;
}

function emptyFormFor(categoryKey) {
  const meta = CATEGORY_META[categoryKey];
  const initial = {};
  meta.fields.forEach((f) => {
    initial[f.key] = f.type === "checkbox" ? false : f.type === "file" ? null : "";
  });
  return initial;
}

// Searchable ICD-10 combobox: types a query, fetches matching codes from the
// backend (debounced), picks one from the dropdown. Stores just the code as
// the value, but displays "CODE — explanation" once something is selected.
function Icd10Select({ value, onChange }) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("");
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(() => {
      getIcd10Codes(query).then(setOptions);
    }, 200);
    return () => clearTimeout(timeout);
  }, [query, open]);

  function handleSelect(opt) {
    onChange(opt.code);
    setSelectedLabel(`${opt.code} — ${opt.english_explanation}`);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="icd10-select" ref={wrapRef}>
      <input
        type="text"
        value={open ? query : value ? selectedLabel || value : ""}
        placeholder="Search by code or condition"
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
            options.map((opt) => (
              <div
                key={opt.code}
                className="icd10-dropdown-item"
                onClick={() => handleSelect(opt)}
              >
                <span className="icd10-dropdown-code">{opt.code}</span>
                <span className="icd10-dropdown-explanation">{opt.english_explanation}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// AddInfoModal now doubles as the edit form: when `initialData` is passed
// (editing an existing entry), the form pre-fills from it and the header
// switches to "Edit". Saving still goes through whatever `onSave` the
// caller wired up — add or update — so this component doesn't need to know
// which one it is.
function AddInfoModal({ categoryKey, initialData, onClose, onSave }) {
  const meta = CATEGORY_META[categoryKey];
  const [form, setForm] = useState(
    initialData ? { ...emptyFormFor(categoryKey), ...initialData } : emptyFormFor(categoryKey)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    const missingRequired = meta.fields.some((f) => f.required && !form[f.key]);
    if (missingRequired) return;

    setSaving(true);
    setError("");
    try {
      await onSave(categoryKey, sanitizeFormForSubmit(categoryKey, form));
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, "Could not save entry."));
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <h3>{initialData ? "Edit" : "Add"} {meta.label}</h3>
        <form onSubmit={handleSave} className="modal-form">
          {meta.fields.map((f) => (
            <div className="field-row modal-field-row" key={f.key}>
              <label className="field-label">{f.label}</label>
              {f.type === "textarea" ? (
                <textarea
                  value={form[f.key]}
                  onChange={(e) => update(f.key, e.target.value)}
                  rows={3}
                />
              ) : f.type === "icd10" ? (
                <Icd10Select
                  value={form[f.key]}
                  onChange={(code) => update(f.key, code)}
                />
              ) : f.type === "select" ? (
                <select
                  value={form[f.key]}
                  onChange={(e) => update(f.key, e.target.value)}
                >
                  <option value="">Select...</option>
                  {f.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : f.type === "checkbox" ? (
                <input
                  type="checkbox"
                  checked={form[f.key]}
                  onChange={(e) => update(f.key, e.target.checked)}
                />
              ) : (
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={(e) => update(f.key, e.target.value)}
                />
              )}
            </div>
          ))}

          {error && <p style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CategoryCard({ categoryKey, entries, onAdd, onEdit, onDelete }) {
  const meta = CATEGORY_META[categoryKey];
  const titleField = meta.fields.find((f) => f.required);
  const otherFields = meta.fields.filter((f) => f !== titleField);
  const isBackendWired = Boolean(CATEGORY_API[categoryKey]);
  const canEdit = Boolean(CATEGORY_API[categoryKey]?.update);

  function titleValue(entry) {
    if (!titleField) return null;
    return entry[titleField.key];
  }

  return (
    <div className="patient-card-section">
      <div className="section-header">
        <h3>{meta.sectionTitle}</h3>
        <button className="add-entry-btn" onClick={onAdd}>
          + Add
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="empty-hint">No entries yet.</p>
      ) : (
        <div className="entries-scroll">
          {entries.map((entry) => (
            <div className="history-entry" key={entry.id ?? Math.random()}>
              {titleField && titleValue(entry) !== "" && (
                <>
                  <div className="field-label">{titleField.label}</div>
                  <div className="field-value-lg">{titleValue(entry)}</div>
                </>
              )}
              {otherFields.map((f) => {
                const value = entry[f.key];
                if (value === "" || value === undefined || value === null) return null;
                const displayValue =
                  f.type === "checkbox" ? (value ? "Yes" : "No") : String(value);
                return (
                  <div className="field-row" key={f.key}>
                    <span className="field-label">{f.label}</span>
                    <span className="field-value">{displayValue}</span>
                  </div>
                );
              })}
             {isBackendWired && entry.id && (
  <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
    {canEdit && (
      <button
        type="button"
        className="entry-edit-btn"
        onClick={() => onEdit(entry)}
      >
        Edit
      </button>
    )}
    <button
      type="button"
      className="entry-remove-btn"
      onClick={() => onDelete(categoryKey, entry.id)}
    >
      Remove
    </button>
  </div>
)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Real backend-connected files card — separate from CategoryCard because
// the data shape (id, file_url, description) and actions (upload/delete via
// API) differ from the generic backend-wired categories.
function AttachedFilesCard({ files, onAdd, onDelete }) {
  return (
    <div className="patient-card-section">
      <div className="section-header">
        <h3>Attached Files</h3>
        <button className="add-entry-btn" onClick={onAdd}>
          + Add
        </button>
      </div>

      {files.length === 0 ? (
        <p className="empty-hint">No files yet.</p>
      ) : (
        <div className="entries-scroll">
          {files.map((f) => (
            <div className="history-entry" key={f.id}>
            <a  
                href={`http://127.0.0.1:8000${f.file_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="field-value-lg"
              >
                {f.description || "File"}
              </a>
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="entry-remove-btn"
                  onClick={() => onDelete(f.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AttachFileModal({ onClose, onSave }) {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      if (!description) setDescription(f.name);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a file.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(file, description);
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, "Upload failed."));
      setSaving(false);
    }
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
            <label className="field-label">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Lab report, X-ray scan"
            />
          </div>

          {error && <p style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Uploading..." : "Attach"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PatientCardPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  const [extraData, setExtraData] = useState({
    chronic_diseases: [],
    family_history: [],
    surgical_history: [],
    immunizations: [],
    allergies: [],
    current_medications: [],
    insurance_coverage: [],
    habits: [],
  });

  const [patientFiles, setPatientFiles] = useState([]);
  const [showAttachModal, setShowAttachModal] = useState(false);

  const [activeTab, setActiveTab] = useState("overview");
  const [activeCategory, setActiveCategory] = useState(null); // which "add" modal is open
  const [editingEntry, setEditingEntry] = useState(null); // { categoryKey, entry } — which "edit" modal is open
  const [showVisitModal, setShowVisitModal] = useState(false);

  useEffect(() => {
    getPatientById(id).then((data) => {
      setPatient(data);
      setLoading(false);
    });
    getPatientFiles(id).then(setPatientFiles);

    // Fetch all backend-wired categories in parallel.
    const categoryKeys = Object.keys(CATEGORY_API);
    Promise.all(categoryKeys.map((key) => CATEGORY_API[key].get(id))).then(
      (results) => {
        setExtraData((prev) => {
          const next = { ...prev };
          categoryKeys.forEach((key, idx) => {
            next[key] = results[idx];
          });
          return next;
        });
      }
    );
  }, [id]);

  async function saveEntry(categoryKey, form) {
    const api = CATEGORY_API[categoryKey];

    if (!api) {
      // Fallback for any future category added to CATEGORY_META without a
      // backend wired up yet — keeps the UI working as local-state only.
      setExtraData((prev) => ({
        ...prev,
        [categoryKey]: [...prev[categoryKey], form],
      }));
    } else {
      const created = await api.add(id, form);
      setExtraData((prev) => ({
        ...prev,
        [categoryKey]: [...prev[categoryKey], created],
      }));
    }

    // Jump to whichever tab owns this category, so the person immediately
    // sees the entry saved in place, under its category.
    const owningTab = TABS.find((t) => t.categoryKey === categoryKey);
    setActiveTab(owningTab ? owningTab.key : "overview");
  }

  async function updateEntry(categoryKey, entryId, form) {
    const api = CATEGORY_API[categoryKey];
    if (!api?.update) return;

    const updated = await api.update(id, entryId, form);
    setExtraData((prev) => ({
      ...prev,
      [categoryKey]: prev[categoryKey].map((e) => (e.id === entryId ? updated : e)),
    }));
  }

  async function deleteEntry(categoryKey, entryId) {
    const api = CATEGORY_API[categoryKey];
    if (!api) return;

    await api.remove(id, entryId);
    setExtraData((prev) => ({
      ...prev,
      [categoryKey]: prev[categoryKey].filter((e) => e.id !== entryId),
    }));
  }

  async function handleUploadFile(file, description) {
    const uploaded = await uploadPatientFile(id, file, description);
    setPatientFiles((prev) => [...prev, uploaded]);
    setActiveTab("attached_files");
  }

  async function handleDeleteFile(fileId) {
    await deletePatientFile(id, fileId);
    setPatientFiles((prev) => prev.filter((f) => f.id !== fileId));
  }

  if (loading) return <div className="patient-card-page">Loading...</div>;
  if (!patient) return <div className="patient-card-page">Patient not found.</div>;

  const age = calculateAge(patient.date_of_birth);
  const activeTabMeta = TABS.find((t) => t.key === activeTab);
  const patientCode = `P-${String(id).padStart(3, "0")}`;

  return (
    <div style={{ display: "flex", gap: "0", alignItems: "flex-start" }}>
      <div className="patient-card-page" style={{ flex: 1, minWidth: 0, paddingRight: "400px" }}>
        <div className="patient-card-header">
          <div>
            <h1>{patient.full_name}</h1>
          </div>

          <div className="header-actions">
            <Link to={`/patients/${id}/file`} className="view-file-btn">
              View Patient Visits
            </Link>
            <button className="new-visit-btn" onClick={() => setShowVisitModal(true)}>
              + New Visit
            </button>
          </div>
        </div>

        <div className="patient-card-grid">
          <div className="patient-card-section">
            <h3>Demographics</h3>

            <div className="field-row">
              <span className="field-label">Date of Birth</span>
              <span className="field-value">
                {patient.date_of_birth} <span className="age-suffix">({age}y)</span>
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

        <div className="tabs">
          {TABS.map((tab) => {
            const count = tab.key === "attached_files"
              ? patientFiles.length
              : tab.categoryKey ? extraData[tab.categoryKey].length : null;
            return (
              <button
                key={tab.key}
                className={`tab ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {count !== null && count > 0 ? ` (${count})` : ""}
              </button>
            );
          })}
        </div>

        {activeTab === "overview" ? (
          <div className="patient-card-grid">
            <CategoryCard
              categoryKey="chronic_diseases"
              entries={extraData.chronic_diseases}
              onAdd={() => setActiveCategory("chronic_diseases")}
              onEdit={(entry) => setEditingEntry({ categoryKey: "chronic_diseases", entry })}
              onDelete={deleteEntry}
            />
            <CategoryCard
              categoryKey="habits"
              entries={extraData.habits}
              onAdd={() => setActiveCategory("habits")}
              onEdit={(entry) => setEditingEntry({ categoryKey: "habits", entry })}
              onDelete={deleteEntry}
            />
          </div>
        ) : activeTab === "attached_files" ? (
          <div className="patient-card-grid single-col">
            <AttachedFilesCard
              files={patientFiles}
              onAdd={() => setShowAttachModal(true)}
              onDelete={handleDeleteFile}
            />
          </div>
        ) : (
          <div className="patient-card-grid single-col">
            <CategoryCard
              categoryKey={activeTabMeta.categoryKey}
              entries={extraData[activeTabMeta.categoryKey]}
              onAdd={() => setActiveCategory(activeTabMeta.categoryKey)}
              onEdit={(entry) => setEditingEntry({ categoryKey: activeTabMeta.categoryKey, entry })}
              onDelete={deleteEntry}
            />
          </div>
        )}

        {(activeCategory || editingEntry) && (
          <AddInfoModal
            categoryKey={editingEntry ? editingEntry.categoryKey : activeCategory}
            initialData={editingEntry ? editingEntry.entry : null}
            onClose={() => {
              setActiveCategory(null);
              setEditingEntry(null);
            }}
            onSave={
              editingEntry
                ? (categoryKey, form) => updateEntry(categoryKey, editingEntry.entry.id, form)
                : saveEntry
            }
          />
        )}

        {showAttachModal && (
          <AttachFileModal
            onClose={() => setShowAttachModal(false)}
            onSave={handleUploadFile}
          />
        )}

        {showVisitModal && (
          <VisitModal
            patientId={id}
            onClose={() => setShowVisitModal(false)}
          />
        )}
      </div>

      <ChatWidget
        patientId={id}
        patientName={patient.full_name}
        patientCode={patientCode}
      />
    </div>
  );
}

export default PatientCardPage;