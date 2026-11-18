<script setup>
import { onMounted, ref } from "vue";
import reservationServices from "../services/reservationServices.js";
import vehicleServices from "../services/vehicleServices.js";

const loading = ref(true);
const loadError = ref("");
const formError = ref("");
const dialog = ref(false);
const saving = ref(false);
const sendingNotices = ref(false);
const snackbar = ref(false);
const snackbarText = ref("");
const reservations = ref([]);
const vehicles = ref([]);
const selected = ref(null);
const vehicleId = ref(null);

function openAssign(row) {
  selected.value = row;
  vehicleId.value = null;
  formError.value = "";
  dialog.value = true;
}

async function reserve() {
  if (!vehicleId.value) {
    formError.value = "Vehicle is required.";
    return;
  }

  saving.value = true;
  formError.value = "";

  try {
    await reservationServices.assign(selected.value.id, { vehicleId: vehicleId.value });
    reservations.value = reservations.value.filter((row) => row.id !== selected.value.id);
    dialog.value = false;
  } catch (err) {
    formError.value = err.response?.data?.message || "Unable to assign the vehicle.";
  } finally {
    saving.value = false;
  }
}

async function sendPickupNotices() {
  sendingNotices.value = true;
  loadError.value = "";

  try {
    const response = await reservationServices.sendPreTripNotices();
    snackbarText.value = `Sent ${response.data.sent} pickup notices.`;
    snackbar.value = true;
  } catch (err) {
    loadError.value = err.response?.data?.message || "Unable to send pickup notices.";
  } finally {
    sendingNotices.value = false;
  }
}

onMounted(async () => {
  try {
    const [reservationResponse, vehicleResponse] = await Promise.all([
      reservationServices.list({ status: "awaiting_vehicle" }),
      vehicleServices.getAll(),
    ]);
    reservations.value = reservationResponse.data;
    vehicles.value = vehicleResponse.data;
  } catch (err) {
    loadError.value = err.response?.data?.message || "Unable to load the queue.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <v-container>
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h4">Need Vehicle</h1>
      <v-btn color="primary" class="oc-cta" :loading="sendingNotices" @click="sendPickupNotices">
        Send pickup notices
      </v-btn>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" />
    <v-alert v-else-if="loadError" type="error">{{ loadError }}</v-alert>
    <p v-else-if="reservations.length === 0">No requests need a vehicle.</p>

    <v-list v-else lines="two">
      <v-list-item v-for="row in reservations" :key="row.id">
        <v-list-item-title>{{ row.partyName || `Requestor ${row.requestorUserId}` }}</v-list-item-title>
        <v-list-item-subtitle>
          Destination {{ row.destinationId }} · {{ row.startAt }} to {{ row.endAt }}
        </v-list-item-subtitle>
        <template #append>
          <v-btn color="primary" class="oc-cta" @click="openAssign(row)">Assign vehicle</v-btn>
        </template>
      </v-list-item>
    </v-list>

    <v-dialog v-model="dialog" max-width="480">
      <v-card>
        <v-card-title>Assign vehicle</v-card-title>
        <v-card-text>
          <v-alert v-if="formError" type="error" class="mb-4">{{ formError }}</v-alert>
          <v-select
            v-model="vehicleId"
            :items="vehicles"
            item-title="name"
            item-value="id"
            label="Vehicle"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="dialog = false">Cancel</v-btn>
          <v-btn color="primary" class="oc-cta" :loading="saving" @click="reserve">Reserve</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar">{{ snackbarText }}</v-snackbar>
  </v-container>
</template>
