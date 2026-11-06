import apiClient from "./services.js";

const mileageServiceServices = {
  getMileage(vehicleId) {
    return apiClient.get(`/vehicleapi/vehicles/${vehicleId}/mileage`);
  },

  createMileage(vehicleId, payload) {
    return apiClient.post(`/vehicleapi/vehicles/${vehicleId}/mileage`, payload);
  },

  getServiceLogs(vehicleId) {
    return apiClient.get(`/vehicleapi/vehicles/${vehicleId}/service-logs`);
  },

  createServiceLog(vehicleId, payload) {
    return apiClient.post(`/vehicleapi/vehicles/${vehicleId}/service-logs`, payload);
  },
};

export default mileageServiceServices;
