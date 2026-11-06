<script setup>
import { computed, ref } from "vue";
import Utils from "../config/utils.js";
import mileageServiceServices from "../services/mileageServiceServices.js";

const user = computed(() => Utils.getStore("user"));
const canManage = computed(() =>
  ["maintenance", "area_admin", "system_admin"].includes(user.value?.role)
);

const loading = ref(false);
const successMessage = ref("");
const errorMessage = ref("");
const vehicleId = ref("");
const mileageRecords = ref([]);
const serviceRecords = ref([]);
const mileageLoaded = ref(false);
const serviceLoaded = ref(false);
const dateRecorded = ref("");
const currentMileage = ref("");
const serviceDate = ref("");
const servicePerformed = ref("");

function apiMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

async function loadRecords() {
  errorMessage.value = "";
  mileageLoaded.value = false;
  serviceLoaded.value = false;
  mileageRecords.value = [];
  serviceRecords.value = [];

  if (!canManage.value) {
    errorMessage.value = "You cannot view mileage or service records.";
    return;
  }

  if (vehicleId.value === "") {
    errorMessage.value = "Select a vehicle to view mileage and service records.";
    return;
  }

  loading.value = true;

  try {
    const [mileageRes, serviceRes] = await Promise.all([
      mileageServiceServices.getMileage(vehicleId.value),
      mileageServiceServices.getServiceLogs(vehicleId.value),
    ]);
    mileageRecords.value = Array.isArray(mileageRes.data) ? mileageRes.data : [];
    serviceRecords.value = Array.isArray(serviceRes.data) ? serviceRes.data : [];
    mileageLoaded.value = true;
    serviceLoaded.value = true;
  } catch (error) {
    errorMessage.value = apiMessage(error, "Unable to load vehicle records.");
  } finally {
    loading.value = false;
  }
}

async function submitMileage() {
  errorMessage.value = "";
  successMessage.value = "";

  if (currentMileage.value === "" || currentMileage.value === null) {
    errorMessage.value = "Current mileage is required.";
    return;
  }

  if (Number(currentMileage.value) < 0) {
    errorMessage.value = "Mileage must be a non-negative number.";
    return;
  }

  loading.value = true;

  try {
    const res = await mileageServiceServices.createMileage(vehicleId.value, {
      date_recorded: dateRecorded.value,
      current_mileage: Number(currentMileage.value),
    });
    successMessage.value = res.data?.message || "Mileage record created successfully.";
    currentMileage.value = "";
    await loadRecords();
  } catch (error) {
    errorMessage.value = apiMessage(error, "Unable to create the mileage record.");
  } finally {
    loading.value = false;
  }
}

async function submitService() {
  errorMessage.value = "";
  successMessage.value = "";

  if (!serviceDate.value) {
    errorMessage.value = "A valid service_date is required.";
    return;
  }

  if (!servicePerformed.value?.trim()) {
    errorMessage.value = "Service description is required.";
    return;
  }

  loading.value = true;

  try {
    const res = await mileageServiceServices.createServiceLog(vehicleId.value, {
      service_date: serviceDate.value,
      service_performed: servicePerformed.value.trim(),
    });
    successMessage.value = res.data?.message || "Service record created successfully.";
    servicePerformed.value = "";
    await loadRecords();
  } catch (error) {
    errorMessage.value = apiMessage(error, "Unable to create the service record.");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-container class="py-8">
    <h1 class="text-h4 mb-4">Vehicle Mileage and Service Logs</h1>

    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <v-alert v-if="successMessage" type="success" class="mb-4" data-testid="success-alert">
      {{ successMessage }}
    </v-alert>
    <v-alert v-if="errorMessage" type="error" class="mb-4" data-testid="error-alert">
      {{ errorMessage }}
    </v-alert>

    <v-card v-if="canManage" class="mb-6 pa-4" elevation="2">
      <v-card-title>Select a vehicle</v-card-title>
      <v-card-text>
        <v-text-field id="vehicle-id" v-model="vehicleId" label="Vehicle ID" type="number" />
      </v-card-text>
      <v-card-actions>
        <v-btn color="secondary" variant="outlined" @click="loadRecords">View records</v-btn>
      </v-card-actions>
    </v-card>

    <v-card v-if="canManage" class="mb-6 pa-4" elevation="2">
      <v-card-title>Mileage records</v-card-title>
      <v-card-text>
        <v-text-field id="date-recorded" v-model="dateRecorded" label="Date recorded" type="date" />
        <v-text-field
          id="current-mileage"
          v-model="currentMileage"
          label="Current mileage"
          type="number"
        />
        <v-btn class="oc-cta mb-4" color="primary" variant="elevated" @click="submitMileage">
          Record mileage
        </v-btn>
        <v-alert
          v-if="mileageLoaded && mileageRecords.length === 0"
          type="info"
          data-testid="empty-mileage"
        >
          No mileage records for this vehicle.
        </v-alert>
        <v-table v-if="mileageRecords.length" data-testid="mileage-list">
          <thead>
            <tr>
              <th>Date recorded</th>
              <th>Current mileage</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in mileageRecords" :key="row.mileage_log_id">
              <td>{{ row.date_recorded }}</td>
              <td>{{ row.current_mileage }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <v-card v-if="canManage" class="pa-4" elevation="2">
      <v-card-title>Service records</v-card-title>
      <v-card-text>
        <v-text-field id="service-date" v-model="serviceDate" label="Service date" type="date" />
        <v-textarea id="service-performed" v-model="servicePerformed" label="Service performed" />
        <v-btn class="oc-cta mb-4" color="primary" variant="elevated" @click="submitService">
          Record service
        </v-btn>
        <v-alert
          v-if="serviceLoaded && serviceRecords.length === 0"
          type="info"
          data-testid="empty-service"
        >
          No service records for this vehicle.
        </v-alert>
        <v-table v-if="serviceRecords.length" data-testid="service-list">
          <thead>
            <tr>
              <th>Service date</th>
              <th>Service performed</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in serviceRecords" :key="row.service_log_id">
              <td>{{ row.service_date }}</td>
              <td>{{ row.service_performed }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>
