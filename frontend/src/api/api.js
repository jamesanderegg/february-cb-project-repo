import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL, // Reads from .env
  timeout: 5001,
});

export const getHomeData = async () => {
  try {
    const response = await API.get("/");
    return response.data;
  } catch (error) {
    console.error("Error fetching API data:", error.message);
    return null;
  }
};
