import apiClient from "./services.js";

const authServices = {
  googleSignIn(idToken) {
    return apiClient.post("vehicles/auth/google", { idToken });
  },

  logoutUser() {
    return apiClient.post("vehicles/logout");
  },
};

export default authServices;
