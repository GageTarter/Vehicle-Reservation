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

  updateIssueStatus(id, status) {
    return apiClient.patch(`/vehicleapi/issues/${id}/status`, { status });
  },

  getVehicleIssues(vehicleId) {
    return apiClient.get(`/vehicleapi/vehicles/${vehicleId}/issues`);
  },
};

export default issueServices;
