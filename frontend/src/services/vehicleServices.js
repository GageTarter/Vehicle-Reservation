import apiClient from "./services.js";

const vehicleServices = {
  getAll() {
    return apiClient.get("fleets/vehicles");
  },

  create(body) {
    return apiClient.post("fleets/vehicles", body);
  },

  update(id, body) {
    return apiClient.put(`fleets/vehicles/${id}`, body);
  },

  remove(id) {
    return apiClient.delete(`fleets/vehicles/${id}`);
  },
};

export default vehicleServices;
