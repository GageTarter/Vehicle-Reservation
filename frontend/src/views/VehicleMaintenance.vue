<script setup>
import { computed, onMounted, ref } from "vue";
import Utils from "../config/utils.js";
import maintenanceServices from "../services/maintenanceServices.js";

const STATUSES = ["Open", "In Progress", "Completed"];

const user = computed(() => Utils.getStore("user"));
const canManage = computed(() =>
  ["maintenance", "area_admin", "system_admin"].includes(user.value?.role)
);

const loading = ref(false);
const successMessage = ref("");
const errorMessage = ref("");
const requests = ref([]);
const vehicleId = ref("");
const issueId = ref("");
const description = ref("");
const historyVehicleId = ref("");
const historyRequests = ref([]);
const historyLoaded = ref(false);
const selected = ref(null);
const nextStatus = ref("");

function apiMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

async function loadRequests() {
  if (!canManage.value) {
    return;
  }

  loading.value = true;

  try {
    const res = await maintenanceServices.getRequests();
    requests.value = Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    errorMessage.value = apiMessage(error, "Unable to load maintenance requests.");
    requests.value = [];
  } finally {
    loading.value = false;
  }
}

async function createRequest() {
  errorMessage.value = "";
  successMessage.value = "";

  if (!description.value?.trim()) {
    errorMessage.value = "Description is required.";
    return;
  }

  loading.value = true;

  try {
    const payload = {
      vehicle_id: Number(vehicleId.value),
      description: description.value.trim(),
    };

    if (issueId.value !== "") {
      payload.issue_id = Number(issueId.value);
    }

    const res = await maintenanceServices.createRequest(payload);
    successMessage.value =
      res.data?.message || "Maintenance request created successfully.";
    description.value = "";
    issueId.value = "";
    await loadRequests();
  } catch (error) {
    errorMessage.value = apiMessage(error, "Unable to create the maintenance request.");
  } finally {
    loading.value = false;
  }
}

async function updateStatus() {
  if (!selected.value) {
    return;
  }

  errorMessage.value = "";
  successMessage.value = "";
  loading.value = true;

  try {
    const res = await maintenanceServices.updateStatus(
      selected.value.maintenance_request_id,
      nextStatus.value
    );
    selected.value = res.data?.maintenance_request || selected.value;
    successMessage.value =
      res.data?.message || "Maintenance request status updated successfully.";
    await loadRequests();
  } catch (error) {
    errorMessage.value = apiMessage(error, "Unable to update the maintenance request.");
  } finally {
    loading.value = false;
  }
}

async function loadHistory() {
  historyLoaded.value = false;
  historyRequests.value = [];
  errorMessage.value = "";

  if (historyVehicleId.value === "") {
    errorMessage.value = "Select a vehicle to view maintenance information.";
    return;
  }

  loading.value = true;

  try {
    const res = await maintenanceServices.getVehicleMaintenance(historyVehicleId.value);
    historyRequests.value = Array.isArray(res.data) ? res.data : [];
    historyLoaded.value = true;
  } catch (error) {
    errorMessage.value = apiMessage(error, "Unable to load vehicle maintenance.");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadRequests();
});
</script>

<template>
  <v-container class="py-8">
    <h1 class="text-h4 mb-4">Vehicle Maintenance Management</h1>

    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <v-alert v-if="successMessage" type="success" class="mb-4" data-testid="success-alert">
      {{ successMessage }}
    </v-alert>
    <v-alert v-if="errorMessage" type="error" class="mb-4" data-testid="error-alert">
      {{ errorMessage }}
    </v-alert>

    <v-card v-if="canManage" class="mb-6 pa-4" elevation="2">
      <v-card-title>Create a maintenance request</v-card-title>
      <v-card-text>
        <v-text-field id="vehicle-id" v-model="vehicleId" label="Vehicle ID" type="number" />
        <v-text-field id="issue-id" v-model="issueId" label="Issue ID (optional)" type="number" />
        <v-textarea id="description" v-model="description" label="Description" />
      </v-card-text>
      <v-card-actions>
        <v-btn class="oc-cta" color="primary" variant="elevated" @click="createRequest">
          Create Request
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-card v-if="canManage" class="mb-6 pa-4" elevation="2">
      <v-card-title>Maintenance requests</v-card-title>
      <v-card-text>
        <v-alert
          v-if="!loading && requests.length === 0"
          type="info"
          data-testid="empty-requests"
        >
          No maintenance requests are available.
        </v-alert>
        <v-table v-if="requests.length" data-testid="request-list">
          <thead>
            <tr>
              <th>ID</th>
              <th>Vehicle</th>
              <th>Description</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in requests" :key="row.maintenance_request_id">
              <td>{{ row.maintenance_request_id }}</td>
              <td>{{ row.vehicle_id }}</td>
              <td>{{ row.description }}</td>
              <td>{{ row.status }}</td>
              <td>
                <v-btn
                  variant="text"
                  color="primary"
                  @click="selected = row; nextStatus = row.status"
                >
                  View
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
        <div v-if="selected" class="mt-4">
          <p>Status: {{ selected.status }}</p>
          <v-select v-model="nextStatus" label="Status" :items="STATUSES" />
          <v-btn class="oc-cta" color="primary" variant="elevated" @click="updateStatus">
            Update Status
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-card v-if="canManage" class="pa-4" elevation="2">
      <v-card-title>Vehicle maintenance information</v-card-title>
      <v-card-text>
        <v-text-field
          id="history-vehicle-id"
          v-model="historyVehicleId"
          label="Vehicle ID"
          type="number"
        />
        <v-btn color="secondary" variant="outlined" class="mb-4" @click="loadHistory">
          View maintenance
        </v-btn>
        <v-alert
          v-if="historyLoaded && historyRequests.length === 0"
          type="info"
          data-testid="empty-history"
        >
          No maintenance requests for this vehicle.
        </v-alert>
        <v-table v-if="historyRequests.length" data-testid="history-list">
          <thead>
            <tr>
              <th>Description</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in historyRequests" :key="row.maintenance_request_id">
              <td>{{ row.description }}</td>
              <td>{{ row.status }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>
