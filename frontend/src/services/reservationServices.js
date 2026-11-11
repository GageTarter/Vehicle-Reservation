import apiClient from "./services.js";

const reservationServices = {
  list(params = {}) {
    return apiClient.get("vehicles/reservations", { params });
  },

  create(body) {
    return apiClient.post("vehicles/reservations", body);
  },

  update(id, body) {
    return apiClient.put(`vehicles/reservations/${id}`, body);
  },

  assign(id, body) {
    return apiClient.put(`vehicles/reservations/${id}/assignment`, body);
  },

  sendPreTripNotices(body = {}) {
    return apiClient.post("vehicles/reservations/pre-trip-notices", body);
  },

  listDrivers() {
    return apiClient.get("vehicles/drivers");
  },

  listDestinations() {
    return apiClient.get("vehicles/destinations");
  },
};

export default reservationServices;
