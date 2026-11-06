import apiClient from "./services.js";

const notificationServices = {
  getInstructions(areaId) {
    return apiClient.get(`/vehicleapi/areas/${areaId}/instructions`);
  },

  saveInstructions(areaId, payload) {
    return apiClient.put(`/vehicleapi/areas/${areaId}/instructions`, payload);
  },

  getNotifications(reservationId) {
    return apiClient.get(`/vehicleapi/reservations/${reservationId}/notifications`);
  },
};

export default notificationServices;
