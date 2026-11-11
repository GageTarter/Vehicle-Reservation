import apiClient from "./services.js";

const maintenanceServices = {
  getRequests() {
    return apiClient.get("/vehicleapi/maintenance-requests");
  },

  createRequest(payload) {
    return apiClient.post("/vehicleapi/maintenance-requests", payload);
  },

  updateStatus(id, status) {
    return apiClient.patch(`/vehicleapi/maintenance-requests/${id}/status`, { status });
  },

  getVehicleMaintenance(vehicleId) {
    return apiClient.get(`/vehicleapi/vehicles/${vehicleId}/maintenance`);
  },
};

export default maintenanceServices;
