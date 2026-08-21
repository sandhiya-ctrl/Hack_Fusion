import axios from "axios";

// In development Vite proxies /api to localhost. In deployment this is set to
// the public backend URL, for example https://surveyguard-api.onrender.com/api.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const api = axios.create({ baseURL: API_BASE_URL });

export const uploadSurvey = (file, surveyId, surveyName) => {
  const form = new FormData();
  form.append("file", file);
  form.append("surveyId", surveyId);
  form.append("surveyName", surveyName);
  return api.post("/surveys/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
};

export const runValidation = (surveyId) => api.post("/validation/run", { surveyId });
export const getResults = (params) => api.get("/validation/results", { params });
export const getRecordDetail = (recordId) => api.get(`/validation/results/${recordId}`);
export const updateReview = (recordId, review) => api.patch(`/validation/results/${recordId}/review`, review);
export const getLatestBatch = (surveyId) => api.get("/validation/latest-batch", { params: { surveyId } });

export const getDashboardStats = (surveyId, params = {}) => api.get("/dashboard/stats", { params: { surveyId, ...params } });
export const getEnumeratorAnalysis = (surveyId) => api.get("/dashboard/enumerators", { params: { surveyId } });
export const getDistrictAnalysis = (surveyId) => api.get("/dashboard/districts", { params: { surveyId } });

export const exportReport = (params) => `${API_BASE_URL}/reports/export?${new URLSearchParams(params).toString()}`;

export default api;
