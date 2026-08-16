import axiosClient from "./axiosClient";

export async function getMedicalActs(classification, search) {
  const params = {};
  if (classification) params.classification = classification;
  if (search && search.trim()) params.search = search.trim();
  const res = await axiosClient.get("/medical-acts/", { params });
  return res.data;
}

export async function createOrder(order) {
  const res = await axiosClient.post("/orders/", order);
  return res.data;
}

export async function getVisitOrders(visitId) {
  const res = await axiosClient.get(`/orders/visit/${visitId}`);
  return res.data;
}

export async function deleteOrder(orderId) {
  await axiosClient.delete(`/orders/${orderId}`);
}

export async function uploadOrderResult(orderId, file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axiosClient.post(`/orders/${orderId}/upload-result`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function createPrescription(prescription) {
  const res = await axiosClient.post("/prescriptions/", prescription);
  return res.data;
}

export async function getVisitPrescriptions(visitId) {
  const res = await axiosClient.get(`/prescriptions/visit/${visitId}`);
  return res.data;
}

export async function deletePrescription(prescriptionId) {
  await axiosClient.delete(`/prescriptions/${prescriptionId}`);
}