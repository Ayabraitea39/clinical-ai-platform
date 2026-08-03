import axiosClient from "./axiosClient";

export async function getMedicalActs(classification, search) {
  const params = {};
  if (classification) params.classification = classification;
  if (search && search.trim()) params.search = search.trim();

  const res = await axiosClient.get("/medical-acts/", { params });
  return res.data;
}