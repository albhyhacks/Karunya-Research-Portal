import { api } from "./client";

export const analyticsApi = {
  getOverview: () => api.get("/api/analytics/overview"),
  getYearlyOutput: () => api.get("/api/analytics/yearly-output"),
  getTopJournals: () => api.get("/api/analytics/top-journals"),
  getTopKeywords: () => api.get("/api/analytics/top-keywords"),
  getDepartmentBreakdown: () => api.get("/api/analytics/department-breakdown"),
  getOutputTypes: () => api.get("/api/analytics/output-types"),
  getOutputTypesYearly: (year, month) => {
    const params = new URLSearchParams();
    if (year) params.append("year", year);
    if (month) params.append("month", month);
    const qs = params.toString();
    return api.get(`/api/analytics/output-types/yearly${qs ? `?${qs}` : ''}`);
  },
  getOutputTypesAvailableYears: () => api.get("/api/analytics/output-types/available-years"),
  getOutputTypesByDept: (year, month) => {
    const params = new URLSearchParams();
    if (year) params.append("year", year);
    if (month) params.append("month", month);
    const qs = params.toString();
    return api.get(`/api/analytics/output-types/by-department${qs ? `?${qs}` : ''}`);
  },
  getMonthlyComparison: (years) => api.get(`/api/analytics/output-types/monthly-comparison?years=${years}`),
  getResearcherGrowth: () => api.get("/api/analytics/researcher-growth"),
  getGaps: () => api.get("/api/analytics/gaps"),
  getCollaboration: () => api.get("/api/analytics/collaboration"),
  getContributorsBreakdown: (year) => api.get(`/api/analytics/contributors-breakdown?year=${year}`)
};
