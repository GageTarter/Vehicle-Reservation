import apiClient from "./services.js";

const reservationServices = {
  list() {
    return apiClient.get("vehicles/reservations");
  },

  create(body) {
    return apiClient.post("vehicles/reservations", body);
  },

  update(id, body) {
    return apiClient.put(`vehicles/reservations/${id}`, body);
  },

  listDrivers() {
    return apiClient.get("vehicles/drivers");
  },

  listDestinations() {
    return apiClient.get("vehicles/destinations");
  },
};

export default reservationServices;
