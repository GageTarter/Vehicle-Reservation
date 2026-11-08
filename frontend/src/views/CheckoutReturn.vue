<script setup>
import { computed, onMounted, ref } from "vue";
import Utils from "../config/utils.js";
import checkoutServices from "../services/checkoutServices.js";

const user = computed(() => Utils.getStore("user"));
const isRequestor = computed(() =>
  ["requestor", "user"].includes(user.value?.role)
);
const isAdmin = computed(() =>
  ["area_admin", "system_admin", "admin"].includes(user.value?.role)
);

const loading = ref(false);
const successMessage = ref("");
const errorMessage = ref("");
const reservationId = ref("");
const reservation = ref(null);
const reservations = ref([]);

function clearMessages() {
  successMessage.value = "";
  errorMessage.value = "";
}

function apiMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function canCheckout() {
  return (
    isRequestor.value &&
    reservation.value?.status === "Assigned" &&
    reservation.value?.vehicle_id
  );
}

function canReturn() {
  return isAdmin.value && reservation.value?.status === "Checked Out";
}

async function loadReservation() {
  if (reservationId.value === "") {
    return;
  }

  clearMessages();
  loading.value = true;

  try {
    const res = await checkoutServices.getCheckoutReturn(reservationId.value);
    reservation.value = res.data?.reservation || res.data;
  } catch (error) {
    reservation.value = null;
    errorMessage.value = apiMessage(error, "Unable to load this reservation.");
  } finally {
    loading.value = false;
  }
}

async function checkOutVehicle() {
  if (!reservation.value) {
    return;
  }

  clearMessages();
  loading.value = true;

  try {
    const res = await checkoutServices.checkout(reservation.value.reservation_id);
    reservation.value = res.data?.reservation || reservation.value;
    successMessage.value =
      res.data?.message || "Vehicle checkout recorded successfully.";
  } catch (error) {
    errorMessage.value = apiMessage(error, "Unable to record vehicle checkout.");
  } finally {
    loading.value = false;
  }
}

async function markAsReturned() {
  if (!reservation.value) {
    return;
  }

  clearMessages();
  loading.value = true;

  try {
    const res = await checkoutServices.returnVehicle(
      reservation.value.reservation_id
    );
    reservation.value = res.data?.reservation || reservation.value;
    successMessage.value =
      res.data?.message || "Vehicle return recorded successfully.";
    await loadStatus();
  } catch (error) {
    errorMessage.value = apiMessage(error, "Unable to record vehicle return.");
  } finally {
    loading.value = false;
  }
}

async function loadStatus() {
  if (!isAdmin.value) {
    return;
  }

  loading.value = true;

  try {
    const res = await checkoutServices.getCheckoutStatus();
    reservations.value = Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    errorMessage.value = apiMessage(
      error,
      "Unable to load checkout and return statuses."
    );
    reservations.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadStatus();
});
</script>

<template>
  <v-container class="py-8">
    <h1 class="text-h4 mb-4">Checkout and Return</h1>

    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <v-alert
      v-if="successMessage"
      type="success"
      class="mb-4"
      data-testid="success-alert"
    >
      {{ successMessage }}
    </v-alert>

    <v-alert
      v-if="errorMessage"
      type="error"
      class="mb-4"
      data-testid="error-alert"
    >
      {{ errorMessage }}
    </v-alert>

    <v-card v-if="isRequestor" class="mb-6 pa-4" elevation="2">
      <v-card-title>My reservation</v-card-title>
      <v-card-text>
        <v-text-field
          id="reservation-id"
          v-model="reservationId"
          label="Reservation ID"
          type="number"
        />
        <v-btn color="secondary" variant="outlined" class="mb-4" @click="loadReservation">
          Open reservation
        </v-btn>

        <div v-if="reservation" data-testid="reservation-details">
          <p>Reservation ID: {{ reservation.reservation_id }}</p>
          <p>Assigned vehicle: {{ reservation.vehicle_name || reservation.vehicle_id }}</p>
          <p>Status: {{ reservation.status }}</p>
          <p>Start: {{ reservation.start_datetime }}</p>
          <p>End: {{ reservation.end_datetime }}</p>
          <p>Checkout: {{ reservation.checkout_datetime || "Not checked out" }}</p>
          <p>Return: {{ reservation.return_datetime || "Not returned" }}</p>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn
          v-if="canCheckout()"
          class="oc-cta"
          color="primary"
          variant="elevated"
          :loading="loading"
          @click="checkOutVehicle"
        >
          Check Out Vehicle
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-card v-if="isAdmin" class="pa-4" elevation="2">
      <v-card-title>Checkout and return statuses</v-card-title>
      <v-card-text>
        <v-alert
          v-if="!loading && reservations.length === 0"
          type="info"
          data-testid="empty-reservations"
        >
          No reservations require checkout or return.
        </v-alert>

        <v-table v-if="reservations.length" data-testid="reservation-list">
          <thead>
            <tr>
              <th>Reservation</th>
              <th>Requestor</th>
              <th>Vehicle</th>
              <th>Status</th>
              <th>Checkout</th>
              <th>Return</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in reservations" :key="row.reservation_id">
              <td>{{ row.reservation_id }}</td>
              <td>{{ row.requester_name || row.requester_id }}</td>
              <td>{{ row.vehicle_name || row.vehicle_id }}</td>
              <td>{{ row.status }}</td>
              <td>{{ row.checkout_datetime }}</td>
              <td>{{ row.return_datetime }}</td>
              <td>
                <v-btn
                  variant="text"
                  color="primary"
                  @click="reservation = row"
                >
                  View
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>

        <div v-if="reservation && isAdmin" class="mt-4">
          <p>Reservation ID: {{ reservation.reservation_id }}</p>
          <p>Status: {{ reservation.status }}</p>
          <v-btn
            v-if="canReturn()"
            class="oc-cta"
            color="primary"
            variant="elevated"
            :loading="loading"
            @click="markAsReturned"
          >
            Mark as Returned
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>
