import axiosClient from "./axiosClient";

export async function signup(payload) {
  const res = await axiosClient.post("/auth/signup", payload);
  return res.data;
}

export async function login(payload) {
  const res = await axiosClient.post("/auth/login", payload);
  return res.data;
}