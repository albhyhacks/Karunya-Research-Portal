import { api } from "./client";

export const papersApi = {
  list: (params) => api.get("/api/papers/", params),
  get: (id) => api.get(`/api/papers/${id}`),
};

export const authorsApi = {
  list: (params) => api.get("/api/authors/", params),
  get: (id) => api.get(`/api/authors/${id}`),
  getPapers: (id, params) => api.get(`/api/authors/${id}/papers`, params),
};

export const analyticsApi = {
  getOverview: () => api.get("/api/analytics/overview"),
  getYearlyOutput: () => api.get("/api/analytics/yearly-output"),
  getTopJournals: () => api.get("/api/analytics/top-journals"),
  getTopKeywords: () => api.get("/api/analytics/top-keywords"),
  getDepartmentBreakdown: () => api.get("/api/analytics/department-breakdown"),
};

export const adminApi = {
  triggerSync: (mode) => api.post(`/api/admin/sync?mode=${mode}`, {}),
  getSyncStatus: () => api.get("/api/admin/sync/status"),
  getStats: () => api.get("/api/admin/stats"),
  uploadThesis: (formData) => api.postForm("/api/admin/thesis", formData),
  listUsers: () => api.get("/api/admin/users"),
  createUser: (userData) => api.post("/api/admin/users", userData),
  deleteUser: (userId) => api.delete(`/api/admin/users/${userId}`),
};
