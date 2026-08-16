import axiosClient from "./axiosClient";

export async function sendChatMessage(patientId, message) {
  const response = await axiosClient.post(`/patients/${patientId}/chat`, { message });
  return response.data.reply;
}

export async function getChatHistory(patientId) {
  const response = await axiosClient.get(`/patients/${patientId}/chat`);
  return response.data;
}