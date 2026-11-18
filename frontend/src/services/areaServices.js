import apiClient from "./services.js";

const areaServices = {
  getAll() {
    return apiClient.get("areaapi/areas");
  },

  create(body) {
    return apiClient.post("areaapi/areas", body);
  },

  update(id, body) {
    return apiClient.put(`areaapi/areas/${id}`, body);
  },

  remove(id) {
    return apiClient.delete(`areaapi/areas/${id}`);
  },
};

export default areaServices;
