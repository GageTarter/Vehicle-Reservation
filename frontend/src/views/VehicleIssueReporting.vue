<script setup>
import { computed, onMounted, ref } from "vue";
import Utils from "../config/utils.js";
import { canReportIssue, canReviewIssues } from "../config/roles.js";
import issueServices from "../services/issueServices.js";

const ISSUE_TYPES = ["Low Gas", "Dirty Vehicle", "Maintenance Needed"];
const STATUSES = ["Open", "In Progress", "Resolved"];

const user = computed(() => Utils.getStore("user"));
const isRequestor = computed(() => canReportIssue(user.value));
const isAdmin = computed(() => canReviewIssues(user.value));

const loading = ref(false);
const successMessage = ref("");
const errorMessage = ref("");

const vehicleId = ref("");
const reservationId = ref("");
const issueType = ref("");
const description = ref("");

const issues = ref([]);
const historyVehicleId = ref("");
const historyIssues = ref([]);
const historyLoaded = ref(false);
const selectedIssue = ref(null);
const nextStatus = ref("");
const editingId = ref(null);

function clearMessages() {
  successMessage.value = "";
  errorMessage.value = "";
}

function apiMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function issuePayload() {
  const payload = {
    vehicle_id: Number(vehicleId.value),
    issue_type: issueType.value,
    description: description.value.trim(),
  };

  if (reservationId.value !== "") {
    payload.reservation_id = Number(reservationId.value);
  }

  return payload;
}

function resetForm() {
  editingId.value = null;
  vehicleId.value = "";
  reservationId.value = "";
  issueType.value = "";
  description.value = "";
}

async function reportIssue() {
  clearMessages();

  if (!issueType.value || !description.value?.trim()) {
    errorMessage.value = "Issue type and description are required.";
    return;
  }

  loading.value = true;

  try {
    const res = await issueServices.createIssue(issuePayload());
    successMessage.value =
      res.data?.message || "Vehicle issue reported successfully.";
    resetForm();
    await loadIssues();
  } catch (error) {
    errorMessage.value = apiMessage(error, "Unable to report the vehicle issue.");
  } finally {
    loading.value = false;
  }
}

function startEdit(issue) {
  clearMessages();
  editingId.value = issue.issue_id;
  vehicleId.value = String(issue.vehicle_id ?? "");
  reservationId.value =
    issue.reservation_id === null || issue.reservation_id === undefined
      ? ""
      : String(issue.reservation_id);
  issueType.value = issue.issue_type;
  description.value = issue.description;
}

async function saveIssue() {
  if (!editingId.value) {
    return;
  }

  clearMessages();

  if (!issueType.value || !description.value?.trim()) {
    errorMessage.value = "Issue type and description are required.";
    return;
  }

  loading.value = true;

  try {
    const res = await issueServices.updateIssue(editingId.value, issuePayload());
    successMessage.value =
      res.data?.message || "Vehicle issue updated successfully.";
    resetForm();
    await loadIssues();
  } catch (error) {
    errorMessage.value = apiMessage(error, "Unable to update the vehicle issue.");
  } finally {
    loading.value = false;
  }
}

async function loadIssues() {
  if (!isAdmin.value && !isRequestor.value) {
    return;
  }

  loading.value = true;

  try {
    const res = await issueServices.getIssues();
    issues.value = Array.isArray(res.data) ? res.data : res.data?.issues || [];
  } catch (error) {
    errorMessage.value = apiMessage(error, "Unable to load vehicle issues.");
    issues.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadIssue(issueId) {
  clearMessages();
  selectedIssue.value = null;

  try {
    const res = await issueServices.getIssue(issueId);
    selectedIssue.value = res.data?.issue || res.data;
    nextStatus.value = selectedIssue.value?.status || "";
  } catch (error) {
    errorMessage.value = apiMessage(error, "Unable to load this vehicle issue.");
  }
}

async function updateStatus() {
  if (!selectedIssue.value) {
    return;
  }

  clearMessages();
  loading.value = true;

  try {
    const id = selectedIssue.value.issue_id;
    const res = await issueServices.updateIssueStatus(id, nextStatus.value);
    selectedIssue.value = res.data?.issue || {
      ...selectedIssue.value,
      status: nextStatus.value,
    };
    successMessage.value =
      res.data?.message || "Vehicle issue status updated successfully.";
    await loadIssues();
  } catch (error) {
    errorMessage.value = apiMessage(error, "Unable to update issue status.");
  } finally {
    loading.value = false;
  }
}

async function deleteIssue(issueId) {
  clearMessages();
  loading.value = true;

  try {
    await issueServices.deleteIssue(issueId);
    successMessage.value = "Vehicle issue deleted successfully.";
    if (selectedIssue.value?.issue_id === issueId) {
      selectedIssue.value = null;
    }
    await loadIssues();
  } catch (error) {
    errorMessage.value = apiMessage(error, "Unable to delete the vehicle issue.");
  } finally {
    loading.value = false;
  }
}

async function loadHistory() {
  clearMessages();
  historyLoaded.value = false;
  historyIssues.value = [];

  if (historyVehicleId.value === "") {
    errorMessage.value = "Select a vehicle to view issue history.";
    return;
  }

  loading.value = true;

  try {
    const res = await issueServices.getVehicleIssues(historyVehicleId.value);
    historyIssues.value = Array.isArray(res.data)
      ? res.data
      : res.data?.issues || [];
    historyLoaded.value = true;
  } catch (error) {
    errorMessage.value = apiMessage(error, "Unable to load vehicle issue history.");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadIssues();
});
</script>

<template>
  <v-container class="py-8">
    <h1 class="text-h4 mb-4">{{ isRequestor && !isAdmin ? "Report a vehicle issue" : "Vehicle issues" }}</h1>

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
      <v-card-title>{{ editingId ? "Edit a vehicle issue" : "Report a vehicle issue" }}</v-card-title>
      <v-card-text>
        <v-text-field
          id="vehicle-id"
          v-model="vehicleId"
          label="Vehicle ID (from the Vehicles list)"
          type="number"
        />
        <v-text-field
          id="reservation-id"
          v-model="reservationId"
          label="Reservation ID (optional)"
          type="number"
        />
        <v-select
          id="issue-type"
          v-model="issueType"
          label="Issue type"
          :items="ISSUE_TYPES"
        />
        <v-textarea
          id="issue-description"
          v-model="description"
          label="Description"
        />
      </v-card-text>
      <v-card-actions>
        <v-btn
          v-if="!editingId"
          class="oc-cta"
          color="primary"
          variant="elevated"
          :loading="loading"
          @click="reportIssue"
        >
          Report Issue
        </v-btn>
        <v-btn
          v-else
          class="oc-cta"
          color="primary"
          variant="elevated"
          :loading="loading"
          @click="saveIssue"
        >
          Save Changes
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-card v-if="isRequestor" class="mb-6 pa-4" elevation="2">
      <v-card-title>My reported issues</v-card-title>
      <v-card-text>
        <v-table v-if="issues.length" data-testid="my-issue-list">
          <thead>
            <tr>
              <th>Type</th>
              <th>Description</th>
              <th>Report date</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="issue in issues" :key="issue.issue_id">
              <td>{{ issue.issue_type }}</td>
              <td>{{ issue.description }}</td>
              <td>{{ issue.reported_date }}</td>
              <td>{{ issue.status }}</td>
              <td>
                <v-btn
                  variant="text"
                  color="primary"
                  @click="loadIssue(issue.issue_id)"
                >
                  View
                </v-btn>
                <v-btn variant="text" color="primary" @click="startEdit(issue)">
                  Edit
                </v-btn>
                <v-btn
                  variant="text"
                  color="error"
                  @click="deleteIssue(issue.issue_id)"
                >
                  Delete
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <v-card
      v-if="isRequestor && selectedIssue"
      class="mb-6 pa-4"
      elevation="2"
      data-testid="my-issue-detail"
    >
      <v-card-title>Issue details</v-card-title>
      <v-card-text>
        <p>{{ selectedIssue.issue_type }}</p>
        <p>{{ selectedIssue.description }}</p>
        <p>{{ selectedIssue.reported_date }}</p>
        <p>{{ selectedIssue.status }}</p>
      </v-card-text>
    </v-card>

    <v-card v-if="isAdmin" class="mb-6 pa-4" elevation="2">
      <v-card-title>Reported vehicle issues</v-card-title>
      <v-card-text>
        <v-table v-if="issues.length" data-testid="issue-list">
          <thead>
            <tr>
              <th>Type</th>
              <th>Description</th>
              <th>Reporting user</th>
              <th>Report date</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="issue in issues" :key="issue.issue_id">
              <td>{{ issue.issue_type }}</td>
              <td>{{ issue.description }}</td>
              <td>{{ issue.reported_by }}</td>
              <td>{{ issue.reported_date }}</td>
              <td>{{ issue.status }}</td>
              <td>
                <v-btn
                  variant="text"
                  color="primary"
                  @click="loadIssue(issue.issue_id)"
                >
                  View
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <v-card v-if="isAdmin && selectedIssue" class="mb-6 pa-4" elevation="2">
      <v-card-title>Update status</v-card-title>
      <v-card-text>
        <p>{{ selectedIssue.issue_type }} — {{ selectedIssue.description }}</p>
        <p>Current status: {{ selectedIssue.status }}</p>
        <v-select v-model="nextStatus" label="Status" :items="STATUSES" />
      </v-card-text>
      <v-card-actions>
        <v-btn
          class="oc-cta"
          color="primary"
          variant="elevated"
          :loading="loading"
          @click="updateStatus"
        >
          Update Status
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-card v-if="isAdmin" class="pa-4" elevation="2">
      <v-card-title>Vehicle issue history</v-card-title>
      <v-card-text>
        <v-text-field
          id="history-vehicle-id"
          v-model="historyVehicleId"
          label="Vehicle ID"
          type="number"
        />
        <v-btn color="secondary" variant="outlined" class="mb-4" @click="loadHistory">
          View history
        </v-btn>

        <v-alert
          v-if="historyLoaded && historyIssues.length === 0"
          type="info"
          data-testid="empty-history"
        >
          No reported issues for this vehicle.
        </v-alert>

        <v-table v-if="historyIssues.length" data-testid="issue-history">
          <thead>
            <tr>
              <th>Type</th>
              <th>Description</th>
              <th>Report date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="issue in historyIssues" :key="issue.issue_id">
              <td>{{ issue.issue_type }}</td>
              <td>{{ issue.description }}</td>
              <td>{{ issue.reported_date }}</td>
              <td>{{ issue.status }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>
