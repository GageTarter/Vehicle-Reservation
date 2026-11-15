import apiClient from "./services.js";

const areaServices = {
  getAll() {
    return apiClient.get("areaapi/areas");
  },
};

export default areaServices;
