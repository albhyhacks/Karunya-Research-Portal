import { api } from "./client";

export const analyticsApi = {
  getOverview: () => api.get("/api/analytics/overview"),
  getYearlyOutput: () => api.get("/api/analytics/yearly-output"),
  getTopJournals: () => api.get("/api/analytics/top-journals"),
  getTopKeywords: () => api.get("/api/analytics/top-keywords"),
  getDepartmentBreakdown: () => api.get("/api/analytics/department-breakdown"),
  getOutputTypes: () => api.get("/api/analytics/output-types"),
  getOutputTypesYearly: () => api.get("/api/analytics/output-types/yearly"),
  getOutputTypesAvailableYears: () => api.get("/api/analytics/output-types/available-years"),
  getOutputTypesByDept: (year) => api.get(`/api/analytics/output-types/by-department${year ? `?year=${year}` : ''}`),
  getResearcherGrowth: () => api.get("/api/analytics/researcher-growth"),
  getGaps: () => api.get("/api/analytics/gaps"),
  getCollaboration: () => api.get("/api/analytics/collaboration")
};
