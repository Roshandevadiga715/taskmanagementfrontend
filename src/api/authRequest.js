import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/auth";

// Signup with cookies (no localStorage)
export const signup = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/signup`, data, {
    withCredentials: true,
  });
  return response.data;
};

// Login with cookies (no localStorage)
export const login = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/login`, data, {
    withCredentials: true,
  });
  return response.data;
};

export const logout = async () => {
  const response = await axios.post(`${API_BASE_URL}/logout`, {}, {
    withCredentials: true,
  });
  return response.data;
};