import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/auth";

export const signup = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/signup`, data);
  // Save token to localStorage if present
  if (response.data?.token) {
    localStorage.setItem("token", response.data.token);
  }
  return response.data;
};

// Add login function
export const login = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/login`, data);
  if (response.data?.token) {
    localStorage.setItem("token", response.data.token);
  }
  return response.data;
};
