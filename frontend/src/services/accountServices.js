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

  getUsers() {
    return apiClient.get("vehicles/users");
  },

  updateUserRole(id, body) {
    return apiClient.put(`vehicles/users/${id}/role`, body);
  },
};

export default accountServices;
