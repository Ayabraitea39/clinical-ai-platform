import axiosClient from "./axiosClient";

export async function listChatSessions(patientId) {
  const response = await axiosClient.get(`/patients/${patientId}/chat/sessions`);
  return response.data;
}

export async function createChatSession(patientId) {
  const response = await axiosClient.post(`/patients/${patientId}/chat/sessions`);
  return response.data;
}

export async function deleteChatSession(patientId, sessionId) {
  await axiosClient.delete(`/patients/${patientId}/chat/sessions/${sessionId}`);
}

export async function sendChatMessage(patientId, sessionId, message) {
  const response = await axiosClient.post(
    `/patients/${patientId}/chat/sessions/${sessionId}/messages`,
    { message }
  );
  return response.data.reply;
}

export async function getChatHistory(patientId, sessionId) {
  const response = await axiosClient.get(
    `/patients/${patientId}/chat/sessions/${sessionId}/messages`
  );
  return response.data;
}