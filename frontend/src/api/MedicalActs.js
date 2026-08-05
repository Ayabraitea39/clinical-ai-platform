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