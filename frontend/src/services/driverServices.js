import apiClient from "./services.js";

const driverServices = {
  getAll() {
    return apiClient.get("driverapi/drivers");
  },

  create(body) {
    return apiClient.post("driverapi/drivers", body);
  },

  update(id, body) {
    return apiClient.put(`driverapi/drivers/${id}`, body);
  },

  remove(id) {
    return apiClient.delete(`driverapi/drivers/${id}`);
  },
};

export default driverServices;
