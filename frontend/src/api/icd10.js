import axiosClient from "./axiosClient";

export async function getIcd10Codes(search = "") {
  const res = await axiosClient.get("/icd10-codes/", {
    params: search ? { search } : {},
  });
  return res.data;
}