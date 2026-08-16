import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getVisit,
  getSignForm,
  getVisitSigns,
  submitVisitSigns,
  updateConclusion,
  createSignDefinition,
} from "../api/visit";
import {
  getMedicalActs,
  createOrder,
  getVisitOrders,
  deleteOrder,
  createPrescription,
  getVisitPrescriptions,
  deletePrescription,
  uploadOrderResult,
} from "../api/MedicalActs";
import "./VisitCardPage.css";
import SignInput from "../components/patients/SignInput";

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

function MedicalActSelect({ classification, value, onChange }) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(() => {
      getMedicalActs(classification, query).then(setOptions);
    }, 200);
    return () => clearTimeout(timeout);
  }, [classification, query, open]);

  return (
    <div className="icd10-select">
      <input
        type="text"
        value={open ? query : value ? value.name : ""}
        placeholder="Search medical acts..."
        onFocus={() => { setOpen(true); setQuery(""); }}
        onChange={(e) => setQuery(e.target.value)}
      />
      {open && (
        <div className="icd10-dropdown">
          {options.length === 0 ? <div className="icd10-dropdown-empty">No matches</div> : options.map((act) => (
            <div
              key={act.id}
              className="icd10-dropdown-item"
              onClick={() => { onChange(act); setQuery(""); setOpen(false); }}
            >
              <span className="icd10-dropdown-explanation">{act.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const ORDER_TYPE_LABELS = {
  test: "Laboratory Test",
  imaging: "Imaging",
  other: "Other Medical Act",
};

function OrderMedicalActModal({ classification, onClose, onSave }) {
  const [medicalAct, setMedicalAct] = useState(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const label = ORDER_TYPE_LABELS[classification];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!medicalAct) {
      setError(`Please select a ${label.toLowerCase()}.`);
      return;
    }
    try {
      await onSave({
        medical_act_id: medicalAct.id,
        reason,
        notes,
      });
      onClose();
    } catch {
      setError("Could not save this medical act. Please try again.");
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <h3>Add {label}</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="field-row modal-field-row">
            <label className="field-label">{label}</label>
            <MedicalActSelect classification={classification} value={medicalAct} onChange={setMedicalAct} />
          </div>
          <div className="field-row modal-field-row">
            <label className="field-label">Reason (optional)</label>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this needed?" />
          </div>
          <div className="field-row modal-field-row">
            <label className="field-label">Notes (optional)</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional instructions..." />
          </div>
          {error && <p style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Add {label}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PrescribeMedicineModal({ onClose, onSave }) {
  const [medicine, setMedicine] = useState(null);
  const [dose, setDose] = useState("");
  const [frequency, setFrequency] = useState("");
  const [route, setRoute] = useState("");
  const [duration, setDuration] = useState("");
  const [startDate, setStartDate] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!medicine) {
      setError("Please select a medicine.");
      return;
    }
    try {
      await onSave({
        medical_act_id: medicine.id,
        dose,
        frequency,
        route,
        start_date: startDate || null,
        duration,
      });
      onClose();
    } catch {
      setError("Could not save this prescription. Please try again.");
    }
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
            <input type="text" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="e.g. 500mg" />
          </div>
          <div className="field-row modal-field-row">
            <label className="field-label">Frequency</label>
            <input type="text" value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="e.g. Twice daily" />
          </div>
          <div className="field-row modal-field-row">
            <label className="field-label">Route</label>
            <input type="text" value={route} onChange={(e) => setRoute(e.target.value)} placeholder="e.g. Oral" />
          </div>
          <div className="field-row modal-field-row">
            <label className="field-label">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="field-row modal-field-row">
            <label className="field-label">Duration</label>
            <select value={duration} onChange={(e) => setDuration(e.target.value)}>
              <option value="">Select duration...</option>
              <option value="1 week">1 week</option>
              <option value="2 weeks">2 weeks</option>
              <option value="1 month">1 month</option>
              <option value="2 months">2 months</option>
              <option value="3 months">3 months</option>
              <option value="6 months">6 months</option>
              <option value="1 year">1 year</option>
              <option value="Ongoing / Indefinite">Ongoing / Indefinite</option>
            </select>
          </div>
          {error && <p style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Add Prescription</button>
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
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    if (!label) setLabel(selectedFile.name);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a file.");
      return;
    }
    onSave({ file, label: label || file.name, url: URL.createObjectURL(file), size: file.size, type: file.type });
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
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Lab report, X-ray scan" />
          </div>
          {error && <p style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Attach</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddSignModal({ categories, onClose, onSave }) {
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [dataType, setDataType] = useState("text");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!categoryId || !name.trim()) {
      setError("Choose a category and enter a sign name.");
      return;
    }

    try {
      await onSave({
        category_id: Number(categoryId),
        name: name.trim(),
        data_type: dataType,
      });
      onClose();
    } catch {
      setError("Could not add this sign. Please try again.");
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <h3>Add Sign</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="field-row modal-field-row">
            <label className="field-label">Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Select category...</option>
            {categories
  .filter((category) => category.name !== "Chief Complaint")
  .map((category) => (
    <option key={category.id} value={category.id}>
      {category.name}
    </option>
  ))}
            </select>
          </div>
          <div className="field-row modal-field-row">
            <label className="field-label">Sign Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Oxygen saturation" />
          </div>
          <div className="field-row modal-field-row">
            <label className="field-label">Value Type</label>
            <select value={dataType} onChange={(e) => setDataType(e.target.value)}>
              <option value="text">Text</option>
              <option value="numeric">Numeric</option>
            </select>
          </div>
          {error && <p style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Add Sign</button>
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
  const [visit, setVisit] = useState(null);
  const [categories, setCategories] = useState([]);
  const [values, setValues] = useState({});
  const [conclusion, setConclusion] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [prescriptions, setPrescriptions] = useState([]);
  const [showPrescribeModal, setShowPrescribeModal] = useState(false);
  const [showMedicalActMenu, setShowMedicalActMenu] = useState(false);
  const [orders, setOrders] = useState([]);
  const [orderType, setOrderType] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [showAddSignModal, setShowAddSignModal] = useState(false);
  const [uploadingOrderId, setUploadingOrderId] = useState(null);
  const [uploadError, setUploadError] = useState({});

  useEffect(() => {
    async function load() {
      const [visitData, formData, existingSigns, savedOrders, savedPrescriptions] = await Promise.all([
        getVisit(id),
        getSignForm(id),
        getVisitSigns(id),
        getVisitOrders(id),
        getVisitPrescriptions(id),
      ]);
      setVisit(visitData);
      setCategories(formData);
      setConclusion(visitData.conclusion || "");
      const initialValues = {};
      existingSigns.forEach((sign) => { initialValues[sign.sign_definition_id] = sign.value; });
      setValues(initialValues);
      setOrders(savedOrders.map((order) => ({
        ...order,
        medical_act_name: order.medical_act.name,
        classification: order.medical_act.classification,
      })));
      setPrescriptions(savedPrescriptions.map((prescription) => ({
        ...prescription,
        medicine_name: prescription.medical_act.name,
      })));
      setLoading(false);
    }
    load();
  }, [id]);

  function updateValue(signId, value) { setValues((current) => ({ ...current, [signId]: value })); }
  async function handleAddPrescription(prescription) {
    const savedPrescription = await createPrescription({
      visit_id: Number(id),
      ...prescription,
    });
    setPrescriptions((current) => [
      ...current,
      { ...savedPrescription, medicine_name: savedPrescription.medical_act.name },
    ]);
  }

  async function handleRemovePrescription(prescriptionId) {
    await deletePrescription(prescriptionId);
    setPrescriptions((current) => current.filter((prescription) => prescription.id !== prescriptionId));
  }
  function handleAddFile(fileEntry) { setAttachedFiles((current) => [...current, fileEntry]); }
  function handleRemoveFile(index) { setAttachedFiles((current) => current.filter((_, i) => i !== index)); }
  async function handleAddOrder(order) {
    const savedOrder = await createOrder({
      visit_id: Number(id),
      medical_act_id: order.medical_act_id,
      reason: order.reason,
      notes: order.notes,
    });

    setOrders((current) => [
      ...current,
      {
        ...savedOrder,
        medical_act_name: savedOrder.medical_act.name,
        classification: savedOrder.medical_act.classification,
      },
    ]);
  }

  async function handleRemoveOrder(orderId) {
    await deleteOrder(orderId);
    setOrders((current) => current.filter((order) => order.id !== orderId));
  }

  async function handleUploadResult(orderId, file) {
    setUploadingOrderId(orderId);
    setUploadError((current) => ({ ...current, [orderId]: "" }));
    try {
      const savedOrder = await uploadOrderResult(orderId, file);
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? { ...order, result: savedOrder.result }
            : order
        )
      );
    } catch {
      setUploadError((current) => ({
        ...current,
        [orderId]: "Could not upload file. Please try again.",
      }));
    } finally {
      setUploadingOrderId(null);
    }
  }

  async function handleAddSign(sign) {
    const savedSign = await createSignDefinition({
      ...sign,
      doctor_id: visit.doctor_id,
    });

    setCategories((current) => current.map((category) => (
      category.id === savedSign.category_id
        ? { ...category, signs: [...category.signs, savedSign] }
        : category
    )));
  }

  async function handleFinish() {
    setSaving(true);
    setError("");
    try {
      const payload = Object.entries(values).filter(([, value]) => value !== undefined && value !== "").map(([sign_definition_id, value]) => ({ sign_definition_id: Number(sign_definition_id), value }));
      if (payload.length > 0) await submitVisitSigns(id, payload);
      await updateConclusion(id, conclusion);
      if (attachedFiles.length > 0) {
        localStorage.setItem(`visit_${id}_files`, JSON.stringify(attachedFiles.map(({ label, url, size, type }) => ({ label, url, size, type }))));
      }
      navigate(`/visits/${id}`);
    } catch (err) {
      setError("Could not save. Please try again.");
      setSaving(false);
    }
  }

  if (loading) return <div className="visit-card-page">Loading...</div>;
  if (!visit) return <div className="visit-card-page">Visit not found.</div>;

  function renderCategory(category) {
    return (
      <div className="patient-card-section" key={category.id}>
        <h3>{category.name}</h3>
        <div className="sign-form-grid">
          {category.signs.map((sign) => (
            <div className="field-row modal-field-row" key={sign.id}>
              <label className="field-label">{sign.name}</label>
              {sign.description && <p className="sign-description">{sign.description}</p>}
              <SignInput sign={sign} categoryName={category.name} value={values[sign.id]} onChange={(value) => updateValue(sign.id, value)} disabled={false} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const chiefComplaint = categories.find((category) => category.name === "Chief Complaint");
  const vitals = categories.find((category) => category.name === "Vital Signs" || category.name === "Vitals");
  const physicalExam = categories.find((category) => category.name === "Physical Exam");
  const featuredIds = new Set([chiefComplaint, vitals, physicalExam].filter(Boolean).map((category) => category.id));
  const remaining = categories.filter((category) => !featuredIds.has(category.id));
  const testOrders = orders.filter((order) => order.classification === "test");
  const imagingOrders = orders.filter((order) => order.classification === "imaging");
  const otherOrders = orders.filter((order) => order.classification === "other");

  function renderResultSection(order) {
    const isUploading = uploadingOrderId === order.id;
    const error = uploadError[order.id];

    if (order.result) {
      const attachment = order.result.attachments?.[0];
      return (
        <span className="field-value">
          {attachment ? (
            <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
              {attachment.file_name}
            </a>
          ) : (
            "Uploaded"
          )}
        </span>
      );
    }

    return (
      <>
        <label
          className="btn-secondary"
          style={{
            cursor: isUploading ? "default" : "pointer",
            opacity: isUploading ? 0.6 : 1,
          }}
        >
          {isUploading ? "Uploading..." : "Upload Result"}
          <input
            type="file"
            style={{ display: "none" }}
            disabled={isUploading}
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) handleUploadResult(order.id, file);
              e.target.value = "";
            }}
          />
        </label>
        {error && <p style={{ color: "#dc2626", fontSize: 13, margin: "4px 0 0" }}>{error}</p>}
      </>
    );
  }

  function renderOrderSection(title, sectionClass, sectionOrders, emptyText) {
    return (
      <div className={`patient-card-section medical-act-section ${sectionClass}`}>
        <h3>{title}</h3>
        {sectionOrders.length === 0 ? (
          <p className="empty-hint">{emptyText}</p>
        ) : (
          <div className="entries-scroll">
            {sectionOrders.map((order) => (
              <div className="history-entry" key={order.id}>
                <div className="field-value-lg">{order.medical_act_name}</div>
                {order.reason && <div className="field-row"><span className="field-label">Reason</span><span className="field-value">{order.reason}</span></div>}
                {order.notes && <div className="field-row"><span className="field-label">Notes</span><span className="field-value">{order.notes}</span></div>}
                <div className="order-action-row">
                  <button type="button" onClick={() => handleRemoveOrder(order.id)} className="entry-remove-btn">Remove</button>
                  {renderResultSection(order)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="visit-card-page">
      <div className="visit-card-header">
        <div>
          <p className="visit-card-eyebrow">{visit.visit_type} &middot; {visit.visit_date}</p>
          <h1>Visit &mdash; Fill</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn-secondary" onClick={() => setShowAttachModal(true)}>+ Attach File</button>
          <button className="btn-secondary" onClick={() => setShowAddSignModal(true)}>+ Sign</button>
          <div className="medical-act-menu">
            <button type="button" className="btn-primary medical-act-menu-trigger" onClick={() => setShowMedicalActMenu((open) => !open)} aria-expanded={showMedicalActMenu}>
              + Add Medical Act <span>&#9660;</span>
            </button>
            {showMedicalActMenu && (
              <div className="medical-act-menu-dropdown">
                <button type="button" onClick={() => { setShowPrescribeModal(true); setShowMedicalActMenu(false); }}>Medicine</button>
                <button type="button" onClick={() => { setOrderType("test"); setShowOrderModal(true); setShowMedicalActMenu(false); }}>Laboratory Test</button>
                <button type="button" onClick={() => { setOrderType("imaging"); setShowOrderModal(true); setShowMedicalActMenu(false); }}>Imaging</button>
                <button type="button" onClick={() => { setOrderType("other"); setShowOrderModal(true); setShowMedicalActMenu(false); }}>Other</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {categories.length === 0 ? <p className="empty-hint">No signs available to fill.</p> : (
        <>
          {chiefComplaint && <div className="sign-categories-grid full-width-row">{renderCategory(chiefComplaint)}</div>}
          {(vitals || physicalExam) && <div className="sign-categories-grid two-col-row">{vitals && renderCategory(vitals)}{physicalExam && renderCategory(physicalExam)}</div>}
          {remaining.length > 0 && <div className="sign-categories-grid">{[...remaining].sort((a, b) => a.signs.length - b.signs.length).map(renderCategory)}</div>}
        </>
      )}

      <div className="patient-card-section medical-act-section medical-act-section-medicine">
        <div className="section-header">
          <h3>Prescriptions</h3>
          <button className="add-entry-btn" onClick={() => setShowPrescribeModal(true)}>+ Add</button>
        </div>
        {prescriptions.length === 0 ? <p className="empty-hint">No medicines prescribed yet.</p> : (
          <div className="entries-scroll">
            {prescriptions.map((prescription) => (
              <div className="history-entry" key={prescription.id}>
                <div className="field-label">Medicine</div>
                <div className="field-value-lg">{prescription.medicine_name}</div>
                {prescription.dose && <div className="field-row"><span className="field-label">Dose</span><span className="field-value">{prescription.dose}</span></div>}
                {prescription.frequency && <div className="field-row"><span className="field-label">Frequency</span><span className="field-value">{prescription.frequency}</span></div>}
                {prescription.route && <div className="field-row"><span className="field-label">Route</span><span className="field-value">{prescription.route}</span></div>}
                {prescription.start_date && <div className="field-row"><span className="field-label">Start Date</span><span className="field-value">{prescription.start_date}</span></div>}
                {prescription.duration && <div className="field-row"><span className="field-label">Duration</span><span className="field-value">{prescription.duration}</span></div>}
                <div style={{ marginTop: 8 }}><button type="button" onClick={() => handleRemovePrescription(prescription.id)} className="entry-remove-btn">Remove</button></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="patient-card-section">
        <div className="section-header"><h3>Attached Files</h3><button className="add-entry-btn" onClick={() => setShowAttachModal(true)}>+ Add</button></div>
        {attachedFiles.length === 0 ? <p className="empty-hint">No files attached to this visit yet.</p> : (
          <div className="attached-files-grid">
            {attachedFiles.map((file, index) => (
              <div className="history-entry" key={index}>
                <div className="attached-file-top"><a href={file.url} target="_blank" rel="noopener noreferrer" className="attached-file-link">{file.label}</a><button type="button" onClick={() => handleRemoveFile(index)} className="entry-remove-btn">Remove</button></div>
                <div className="field-row"><span className="field-label">Size</span><span className="field-value">{formatFileSize(file.size)}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {renderOrderSection("Laboratory Tests", "medical-act-section-test", testOrders, "No laboratory tests added yet.")}
      {renderOrderSection("Imaging", "medical-act-section-imaging", imagingOrders, "No imaging studies added yet.")}
      {renderOrderSection("Other Medical Acts", "medical-act-section-other", otherOrders, "No other medical acts added yet.")}

      <div className="patient-card-section"><h3>Conclusion</h3><textarea className="conclusion-textarea" rows={4} value={conclusion} onChange={(e) => setConclusion(e.target.value)} placeholder="Clinical conclusion..." /></div>
      <div className="visit-card-actions" style={{ marginTop: 24 }}>
        {error && <span style={{ color: "#dc2626", fontSize: 13 }}>{error}</span>}
        <button className="btn-primary" onClick={handleFinish} disabled={saving}>{saving ? "Saving..." : "Finish & View Visit Card"}</button>
      </div>
      {showPrescribeModal && <PrescribeMedicineModal onClose={() => setShowPrescribeModal(false)} onSave={handleAddPrescription} />}
      {showOrderModal && orderType && <OrderMedicalActModal classification={orderType} onClose={() => setShowOrderModal(false)} onSave={handleAddOrder} />}
      {showAttachModal && <AttachFileModal onClose={() => setShowAttachModal(false)} onSave={handleAddFile} />}
      {showAddSignModal && <AddSignModal categories={categories} onClose={() => setShowAddSignModal(false)} onSave={handleAddSign} />}
    </div>
  );
}

export default VisitFillPage;