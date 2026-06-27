import { API_URL } from "@/settings";
import axios from "axios";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});
