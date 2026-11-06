<script setup>
import { computed, ref } from "vue";
import Utils from "../config/utils.js";
import notificationServices from "../services/notificationServices.js";

const user = computed(() => Utils.getStore("user"));
const canView = computed(() => ["area_admin", "system_admin"].includes(user.value?.role));

const loading = ref(false);
const errorMessage = ref("");
const reservationId = ref("");
const notifications = ref([]);
const loaded = ref(false);

function apiMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

async function loadHistory() {
  errorMessage.value = "";
  loaded.value = false;
  notifications.value = [];

  if (!canView.value) {
    errorMessage.value = "You cannot view notification history.";
    return;
  }

  if (reservationId.value === "") {
    errorMessage.value = "Enter a reservation ID.";
    return;
  }

  loading.value = true;

  try {
    const res = await notificationServices.getNotifications(reservationId.value);
    notifications.value = Array.isArray(res.data) ? res.data : [];
    loaded.value = true;
  } catch (error) {
    errorMessage.value = apiMessage(error, "Unable to load notification history.");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-container class="py-8">
    <h1 class="text-h4 mb-4">Email Notification History</h1>

    <v-progress-linear v-if="loading" indeterminate class="mb-4" data-testid="loading" />

    <v-alert v-if="errorMessage" type="error" class="mb-4" data-testid="error-alert">
      {{ errorMessage }}
    </v-alert>

    <v-card v-if="canView" class="pa-4" elevation="2">
      <v-card-text>
        <v-text-field
          id="reservation-id"
          v-model="reservationId"
          label="Reservation ID"
          type="number"
        />
        <v-btn color="secondary" variant="outlined" class="mb-4" @click="loadHistory">
          View history
        </v-btn>
        <v-alert
          v-if="loaded && notifications.length === 0"
          type="info"
          data-testid="empty-history"
        >
          No notifications have been sent for this reservation.
        </v-alert>
        <v-table v-if="notifications.length" data-testid="notification-list">
          <thead>
            <tr>
              <th>Reservation ID</th>
              <th>Recipient</th>
              <th>Type</th>
              <th>Sent date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in notifications" :key="row.notification_id">
              <td>{{ row.reservation_id }}</td>
              <td>{{ row.recipient_email }}</td>
              <td>{{ row.notification_type }}</td>
              <td>{{ row.sent_date }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>
