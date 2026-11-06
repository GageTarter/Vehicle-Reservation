import apiClient from "./services.js";

const issueServices = {
  getIssues() {
    return apiClient.get("issues");
  },

  getIssue(id) {
    return apiClient.get(`issues/${id}`);
  },

  createIssue(payload) {
    return apiClient.post("issues", payload);
  },

  updateIssueStatus(id, status) {
    return apiClient.patch(`issues/${id}/status`, { status });
  },

  getVehicleIssues(vehicleId) {
    return apiClient.get(`vehicles/${vehicleId}/issues`);
  },
};

export default issueServices;
