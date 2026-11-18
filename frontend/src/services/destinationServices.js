import apiClient from "./services.js";

const destinationServices = {
  getAll() {
    return apiClient.get("destinationapi/destinations");
  },

  create(body) {
    return apiClient.post("destinationapi/destinations", body);
  },

  update(id, body) {
    return apiClient.put(`destinationapi/destinations/${id}`, body);
  },

  remove(id) {
    return apiClient.delete(`destinationapi/destinations/${id}`);
  },
};

export default destinationServices;
