import apiClient from "./services.js";

const issueServices = {
  getIssues() {
    return apiClient.get("/vehicleapi/issues");
  },

  getIssue(id) {
    return apiClient.get(`/vehicleapi/issues/${id}`);
  },

  createIssue(payload) {
    return apiClient.post("/vehicleapi/issues", payload);
  },

  updateIssue(id, payload) {
    return apiClient.patch(`/vehicleapi/issues/${id}`, payload);
  },

  updateIssueStatus(id, status) {
    return apiClient.patch(`/vehicleapi/issues/${id}/status`, { status });
  },

  deleteIssue(id) {
    return apiClient.delete(`/vehicleapi/issues/${id}`);
  },

  getVehicleIssues(vehicleId) {
    return apiClient.get(`/vehicleapi/vehicles/${vehicleId}/issues`);
  },
};

export default issueServices;
