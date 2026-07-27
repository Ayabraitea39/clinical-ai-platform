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