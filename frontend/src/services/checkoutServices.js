import apiClient from "./services.js";

const checkoutServices = {
  getCheckoutReturn(id) {
    return apiClient.get(`vehicleapi/reservations/${id}/checkout-return`);
  },

  checkout(id) {
    return apiClient.post(`vehicleapi/reservations/${id}/checkout`);
  },

  returnVehicle(id) {
    return apiClient.post(`vehicleapi/reservations/${id}/return`);
  },

  getCheckoutStatus() {
    return apiClient.get("vehicleapi/reservations/checkout-status");
  },
};

export default checkoutServices;
