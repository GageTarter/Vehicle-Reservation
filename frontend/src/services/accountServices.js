import apiClient from "./services.js";

const accountServices = {
  getAccount() {
    return apiClient.get("vehicles/me");
  },

  updateAccount(body) {
    return apiClient.put("vehicles/me", body);
  },

  deleteAccount() {
    return apiClient.delete("vehicles/me");
  },
};

export default accountServices;
