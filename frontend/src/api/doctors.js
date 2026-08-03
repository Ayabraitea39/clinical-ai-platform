import axiosClient from "./axiosClient";

export async function getDoctors() {
  const res = await axiosClient.get("/doctors/");
  return res.data;
}