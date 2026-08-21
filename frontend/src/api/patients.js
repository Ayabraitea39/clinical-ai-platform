import axiosClient from "./axiosClient";

export async function getPatients() {
  const res = await axiosClient.get("/patients/");
  return res.data;
}

export async function getPatientById(id) {
  const res = await axiosClient.get(`/patients/${id}`);
  return res.data;
}

export async function createPatient(newPatient) {
  const res = await axiosClient.post("/patients/", newPatient);
  return res.data;
}

export async function updatePatient(id, updatedPatient) {
  const res = await axiosClient.put(`/patients/${id}`, updatedPatient);
  return res.data;
}

export async function getPatientFiles(patientId) {
  const res = await axiosClient.get(`/patients/${patientId}/attached-files/`);
  return res.data;
}

export async function uploadPatientFile(patientId, file, description) {
  const formData = new FormData();
  formData.append("file", file);
  if (description) formData.append("description", description);

  const res = await axiosClient.post(
    `/patients/${patientId}/attached-files/`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
}

export async function deletePatientFile(patientId, fileId) {
  const res = await axiosClient.delete(`/patients/${patientId}/attached-files/${fileId}`);
  return res.data;
}

// ---------------------------------------------------------------------------
// Medical history categories — same list/create/delete pattern per category.
// ---------------------------------------------------------------------------

export async function getChronicDiseases(patientId) {
  const res = await axiosClient.get(`/patients/${patientId}/chronic-diseases/`);
  return res.data;
}
export async function addChronicDisease(patientId, payload) {
  const res = await axiosClient.post(`/patients/${patientId}/chronic-diseases/`, payload);
  return res.data;
}
export async function deleteChronicDisease(patientId, entryId) {
  const res = await axiosClient.delete(`/patients/${patientId}/chronic-diseases/${entryId}`);
  return res.data;
}

export async function getFamilyHistory(patientId) {
  const res = await axiosClient.get(`/patients/${patientId}/family-history/`);
  return res.data;
}
export async function addFamilyHistory(patientId, payload) {
  const res = await axiosClient.post(`/patients/${patientId}/family-history/`, payload);
  return res.data;
}
export async function deleteFamilyHistory(patientId, entryId) {
  const res = await axiosClient.delete(`/patients/${patientId}/family-history/${entryId}`);
  return res.data;
}

export async function getSurgicalHistory(patientId) {
  const res = await axiosClient.get(`/patients/${patientId}/surgical-history/`);
  return res.data;
}
export async function addSurgicalHistory(patientId, payload) {
  const res = await axiosClient.post(`/patients/${patientId}/surgical-history/`, payload);
  return res.data;
}
export async function deleteSurgicalHistory(patientId, entryId) {
  const res = await axiosClient.delete(`/patients/${patientId}/surgical-history/${entryId}`);
  return res.data;
}

export async function getImmunizations(patientId) {
  const res = await axiosClient.get(`/patients/${patientId}/immunizations/`);
  return res.data;
}
export async function addImmunization(patientId, payload) {
  const res = await axiosClient.post(`/patients/${patientId}/immunizations/`, payload);
  return res.data;
}
export async function deleteImmunization(patientId, entryId) {
  const res = await axiosClient.delete(`/patients/${patientId}/immunizations/${entryId}`);
  return res.data;
}

export async function getAllergies(patientId) {
  const res = await axiosClient.get(`/patients/${patientId}/allergies/`);
  return res.data;
}
export async function addAllergy(patientId, payload) {
  const res = await axiosClient.post(`/patients/${patientId}/allergies/`, payload);
  return res.data;
}
export async function deleteAllergy(patientId, entryId) {
  const res = await axiosClient.delete(`/patients/${patientId}/allergies/${entryId}`);
  return res.data;
}

export async function getCurrentMedications(patientId) {
  const res = await axiosClient.get(`/patients/${patientId}/current-medications/`);
  return res.data;
}
export async function addCurrentMedication(patientId, payload) {
  const res = await axiosClient.post(`/patients/${patientId}/current-medications/`, payload);
  return res.data;
}
export async function deleteCurrentMedication(patientId, entryId) {
  const res = await axiosClient.delete(`/patients/${patientId}/current-medications/${entryId}`);
  return res.data;
}



export async function getInsuranceCoverage(patientId) {
  const res = await axiosClient.get(`/patients/${patientId}/insurance-coverage/`);
  return res.data;
}
export async function addInsuranceCoverage(patientId, payload) {
  const res = await axiosClient.post(`/patients/${patientId}/insurance-coverage/`, payload);
  return res.data;
}
export async function updateInsuranceCoverage(patientId, entryId, payload) {
  const res = await axiosClient.put(`/patients/${patientId}/insurance-coverage/${entryId}`, payload);
  return res.data;
}
export async function deleteInsuranceCoverage(patientId, entryId) {
  const res = await axiosClient.delete(`/patients/${patientId}/insurance-coverage/${entryId}`);
  return res.data;
}

//habits

export async function getHabits(patientId) {
  const res = await axiosClient.get(`/patients/${patientId}/habits/`);
  return res.data;
}
export async function addHabit(patientId, payload) {
  const res = await axiosClient.post(`/patients/${patientId}/habits/`, payload);
  return res.data;
}
export async function deleteHabit(patientId, entryId) {
  const res = await axiosClient.delete(`/patients/${patientId}/habits/${entryId}`);
  return res.data;
}