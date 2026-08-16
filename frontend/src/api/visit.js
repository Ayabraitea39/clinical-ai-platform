import axiosClient from "./axiosClient";

export async function createVisit(payload) {
  const res = await axiosClient.post("/visits/", payload);
  return res.data;
}

export async function getVisit(visitId) {
  const res = await axiosClient.get(`/visits/${visitId}`);
  return res.data;
}

export async function getPatientVisits(patientId) {
  const res = await axiosClient.get(`/visits/by-patient/${patientId}`);
  return res.data;
}

export async function getSignCategories() {
  const res = await axiosClient.get("/visits/sign-categories/");
  return res.data;
}

export async function createSignCategory(name) {
  const res = await axiosClient.post("/visits/sign-categories/", { name });
  return res.data;
}

export async function getSignForm(visitId) {
  const res = await axiosClient.get(`/visits/${visitId}/sign-form`);
  return res.data;
}

export async function getVisitSigns(visitId) {
  const res = await axiosClient.get(`/visits/${visitId}/signs`);
  return res.data;
}

export async function submitVisitSigns(visitId, signs) {
  const res = await axiosClient.post(`/visits/${visitId}/signs`, { signs });
  return res.data;
}

export async function updateConclusion(visitId, conclusion) {
  const res = await axiosClient.put(`/visits/${visitId}/conclusion`, { conclusion });
  return res.data;
}

export async function updateVisitStatus(visitId, status) {
  const res = await axiosClient.put(`/visits/${visitId}/status`, { status });
  return res.data;
}

// Add this export to your existing src/api/visit.js file.

export async function createSignDefinition(sign) {
  const res = await axiosClient.post("/visits/sign-definitions/", sign);
  return res.data;
}