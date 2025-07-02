import axios from "axios";

const API_BASE_URL = "http://localhost:5000";

export const createTask = async (data) => {
  const response =  await axios.post(`${API_BASE_URL}/api/tasks/create-task`, data, {
    withCredentials: true,
     headers: {
        Authorization: `Bearer ${token}`,
      },
  });
  return response.data;
};