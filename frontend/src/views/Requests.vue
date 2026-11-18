<script setup>
import { computed, onMounted, ref } from "vue";
import Utils from "../config/utils.js";
import reservationServices from "../services/reservationServices.js";
import vehicleServices from "../services/vehicleServices.js";

const loading = ref(true);
const loadError = ref("");
const formError = ref("");
const dialog = ref(false);
const assignDialog = ref(false);
const saving = ref(false);
const editingId = ref(null);
const assignTarget = ref(null);
const assignVehicleId = ref(null);
const assignError = ref("");
const reservations = ref([]);
const drivers = ref([]);
const destinations = ref([]);
const vehicles = ref([]);

const emptyForm = () => ({
  partyName: "",
  driverId: null,
  destinationId: null,
  startAt: "",
  endAt: "",
  passengerCount: "",
  noteType: "",
  noteText: "",
});

const form = ref(emptyForm());
const isRequestor = computed(() => Utils.getStore("user")?.role !== "admin");
const isAdmin = computed(() => Utils.getStore("user")?.role === "admin");

const statusLabel = {
  requested: "Requested",
  awaiting_vehicle: "Awaiting vehicle",
  reserved: "Reserved",
};

function destinationName(id) {
  return destinations.value.find((item) => item.id === id)?.name || `Destination ${id}`;
}

function openCreate() {
  editingId.value = null;
  form.value = emptyForm();
  formError.value = "";
  dialog.value = true;
}

function openEdit(row) {
  editingId.value = row.id;
  form.value = {
    partyName: row.partyName || "",
    driverId: row.driverId,
    destinationId: row.destinationId,
    startAt: toLocalInput(row.startAt),
    endAt: toLocalInput(row.endAt),
    passengerCount: row.passengerCount,
    noteType: row.noteType || "",
    noteText: row.noteText || "",
  };
  formError.value = "";
  dialog.value = true;
}

function toLocalInput(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function validate() {
  if (!form.value.driverId) {
    return "Driver is required.";
  }

  if (!form.value.destinationId) {
    return "Destination is required.";
  }

  const passengers = Number(form.value.passengerCount);

  if (!Number.isInteger(passengers) || passengers < 1) {
    return "Number of people must be at least 1.";
  }

  const start = new Date(form.value.startAt);
  const end = new Date(form.value.endAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return "End must be after start.";
  }

  return "";
}

function payload() {
  return {
    partyName: form.value.partyName,
    driverId: form.value.driverId,
    destinationId: form.value.destinationId,
    startAt: new Date(form.value.startAt).toISOString(),
    endAt: new Date(form.value.endAt).toISOString(),
    passengerCount: Number(form.value.passengerCount),
    noteType: form.value.noteType,
    noteText: form.value.noteText,
  };
}

async function submit() {
  formError.value = validate();

  if (formError.value) {
    return;
  }

  saving.value = true;

  try {
    if (editingId.value) {
      const response = await reservationServices.update(editingId.value, payload());
      reservations.value = reservations.value.map((row) =>
        row.id === response.data.id ? response.data : row,
      );
    } else {
      const response = await reservationServices.create(payload());
      reservations.value = [...reservations.value, response.data];
    }

    dialog.value = false;
  } catch (err) {
    formError.value = err.response?.data?.message || "Unable to save the reservation.";
  } finally {
    saving.value = false;
  }
}

function openAssign(row) {
  assignTarget.value = row;
  assignVehicleId.value = null;
  assignError.value = "";
  assignDialog.value = true;
}

async function reserveVehicle() {
  if (!assignVehicleId.value) {
    assignError.value = "Vehicle is required.";
    return;
  }

  saving.value = true;
  assignError.value = "";

  try {
    const response = await reservationServices.assign(assignTarget.value.id, {
      vehicleId: assignVehicleId.value,
    });
    reservations.value = reservations.value.map((row) =>
      row.id === response.data.id ? response.data : row,
    );
    assignDialog.value = false;
  } catch (err) {
    assignError.value = err.response?.data?.message || "Unable to assign the vehicle.";
  } finally {
    saving.value = false;
  }
}

async function markAwaiting(row) {
  try {
    const response = await reservationServices.assign(row.id, { vehicleId: null });
    reservations.value = reservations.value.map((item) =>
      item.id === response.data.id ? response.data : item,
    );
  } catch (err) {
    loadError.value = err.response?.data?.message || "Unable to mark awaiting vehicle.";
  }
}

onMounted(async () => {
  try {
    const requests = [
      reservationServices.list(),
      reservationServices.listDrivers(),
      reservationServices.listDestinations(),
    ];

    if (isAdmin.value) {
      requests.push(vehicleServices.getAll());
    }

    const [reservationResponse, driverResponse, destinationResponse, vehicleResponse] =
      await Promise.all(requests);
    reservations.value = reservationResponse.data;
    drivers.value = driverResponse.data;
    destinations.value = destinationResponse.data;
    vehicles.value = vehicleResponse?.data || [];
  } catch (err) {
    loadError.value = err.response?.data?.message || "Unable to load requests.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <v-container>
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h4">My Requests</h1>
      <v-btn v-if="isRequestor" color="primary" class="oc-cta" @click="openCreate">+ New Request</v-btn>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" />
    <v-alert v-else-if="loadError" type="error">{{ loadError }}</v-alert>
    <p v-else-if="reservations.length === 0">No requests yet. Create your first request.</p>

    <v-list v-else lines="two">
      <v-list-item v-for="row in reservations" :key="row.id">
        <v-list-item-title>
          {{ row.partyName || "Request" }} — {{ destinationName(row.destinationId) }}
        </v-list-item-title>
        <v-list-item-subtitle>
          {{ row.startAt }} to {{ row.endAt }} · {{ row.passengerCount }} people
        </v-list-item-subtitle>
        <template #append>
          <v-chip class="mr-2" size="small">{{ statusLabel[row.status] || row.status }}</v-chip>
          <v-btn
            v-if="isRequestor && row.status === 'requested'"
            icon="mdi-pencil"
            size="small"
            aria-label="Edit request"
            @click="openEdit(row)"
          />
          <v-btn
            v-if="isAdmin && row.status !== 'reserved'"
            size="small"
            class="ml-2"
            @click="openAssign(row)"
          >
            Assign vehicle
          </v-btn>
          <v-btn
            v-if="isAdmin && row.status !== 'reserved'"
            size="small"
            class="ml-2"
            @click="markAwaiting(row)"
          >
            Mark awaiting vehicle
          </v-btn>
        </template>
      </v-list-item>
    </v-list>

    <v-dialog v-model="dialog" max-width="560">
      <v-card>
        <v-card-title>{{ editingId ? "Edit request" : "New request" }}</v-card-title>
        <v-card-text>
          <v-alert v-if="formError" type="error" class="mb-4">{{ formError }}</v-alert>
          <v-text-field v-model="form.partyName" label="Party or team name" />
          <v-select v-model="form.driverId" :items="drivers" item-title="name" item-value="id" label="Driver" />
          <v-select
            v-model="form.destinationId"
            :items="destinations"
            item-title="name"
            item-value="id"
            label="Destination"
          />
          <v-text-field v-model="form.startAt" label="Start" type="datetime-local" />
          <v-text-field v-model="form.endAt" label="End" type="datetime-local" />
          <v-text-field v-model="form.passengerCount" label="Number of people" type="number" />
          <v-text-field v-model="form.noteType" label="Note type" />
          <v-text-field v-model="form.noteText" label="Note" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="dialog = false">Cancel</v-btn>
          <v-btn color="primary" class="oc-cta" :loading="saving" @click="submit">
            {{ editingId ? "Save" : "Submit" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="assignDialog" max-width="480">
      <v-card>
        <v-card-title>Assign vehicle</v-card-title>
        <v-card-text>
          <v-alert v-if="assignError" type="error" class="mb-4">{{ assignError }}</v-alert>
          <v-select
            v-model="assignVehicleId"
            :items="vehicles"
            item-title="name"
            item-value="id"
            label="Vehicle"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="assignDialog = false">Cancel</v-btn>
          <v-btn color="primary" class="oc-cta" :loading="saving" @click="reserveVehicle">Reserve</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
