<script setup>
import { computed, onMounted, ref } from "vue";
import VehicleForm from "../components/VehicleForm.vue";
import Utils from "../config/utils.js";
import vehicleServices from "../services/vehicleServices.js";

const emptyForm = () => ({
  make: "",
  model: "",
  year: "",
  vin: "",
  purchaseDate: "",
  color: "",
  passengerCapacity: "",
  licensePlateNo: "",
  licensePlateExp: "",
  area: "",
});

const user = ref(Utils.getStore("user"));
const isAdmin = computed(() => user.value?.role === "admin");
const vehicles = ref([]);
const loading = ref(false);
const listError = ref("");
const formDialogOpen = ref(false);
const deleteDialogOpen = ref(false);
const isAddMode = ref(true);
const form = ref(emptyForm());
const formError = ref("");
const inlineError = ref("");
const saving = ref(false);
const deleting = ref(false);
const editingId = ref(null);
const vehicleToDelete = ref(null);

function serverMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

function displayName(vehicle) {
  return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
}

async function loadVehicles() {
  loading.value = true;
  listError.value = "";

  try {
    const response = await vehicleServices.getAll();
    vehicles.value = response.data;
  } catch (error) {
    listError.value = serverMessage(error, "Failed to fetch vehicles.");
  } finally {
    loading.value = false;
  }
}

function openAddDialog() {
  isAddMode.value = true;
  editingId.value = null;
  form.value = emptyForm();
  formError.value = "";
  inlineError.value = "";
  formDialogOpen.value = true;
}

function openEditDialog(vehicle) {
  isAddMode.value = false;
  editingId.value = vehicle.id;
  form.value = {
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    vin: vehicle.vin,
    purchaseDate: vehicle.purchaseDate,
    color: vehicle.color,
    passengerCapacity: String(vehicle.passengerCapacity),
    licensePlateNo: vehicle.licensePlateNo,
    licensePlateExp: vehicle.licensePlateExp,
    area: vehicle.area,
  };
  formError.value = "";
  inlineError.value = "";
  formDialogOpen.value = true;
}

function closeFormDialog() {
  formDialogOpen.value = false;
  formError.value = "";
  inlineError.value = "";
}

function payloadFromForm() {
  const capacity = String(form.value.passengerCapacity).trim();

  return {
    ...form.value,
    make: form.value.make.trim(),
    model: form.value.model.trim(),
    year: form.value.year.trim(),
    vin: form.value.vin.trim(),
    purchaseDate: form.value.purchaseDate.trim(),
    color: form.value.color.trim(),
    passengerCapacity: capacity === "" ? "" : Number(capacity),
    licensePlateNo: form.value.licensePlateNo.trim(),
    licensePlateExp: form.value.licensePlateExp.trim(),
    area: form.value.area.trim(),
  };
}

const requiredMessage = {
  make: "vehicle make is required.",
  model: "vehicle model is required.",
  year: "vehicle year is required.",
  vin: "vehicle vin is required.",
  purchaseDate: "vehicle purchase date is required.",
  color: "vehicle color is required.",
  passengerCapacity: "vehicle passenger capacity is required.",
  licensePlateNo: "vehicle license plate number is required.",
  licensePlateExp: "vehicle license plate expiration is required.",
  area: "vehicle area is required.",
};

function firstEmptyMessage() {
  const emptyKey = Object.keys(requiredMessage).find((key) => String(form.value[key] ?? "").trim() === "");

  if (!emptyKey) {
    return "";
  }

  return isAddMode.value ? requiredMessage[emptyKey] : "All fields must be filled.";
}

async function saveVehicle() {
  formError.value = "";
  inlineError.value = firstEmptyMessage();

  if (inlineError.value) {
    return;
  }

  saving.value = true;

  try {
    const body = payloadFromForm();

    if (isAddMode.value) {
      await vehicleServices.create(body);
    } else {
      await vehicleServices.update(editingId.value, body);
    }

    formDialogOpen.value = false;
    await loadVehicles();
  } catch (error) {
    formError.value = serverMessage(error, "Failed to save the vehicle.");
  } finally {
    saving.value = false;
  }
}

function openDeleteDialog(vehicle) {
  vehicleToDelete.value = vehicle;
  deleteDialogOpen.value = true;
}

function closeDeleteDialog() {
  deleteDialogOpen.value = false;
  vehicleToDelete.value = null;
}

async function confirmDelete() {
  deleting.value = true;
  listError.value = "";

  try {
    await vehicleServices.remove(vehicleToDelete.value.id);
    deleteDialogOpen.value = false;
    vehicleToDelete.value = null;
    await loadVehicles();
  } catch (error) {
    listError.value = serverMessage(error, "Failed to delete the vehicle.");
    deleteDialogOpen.value = false;
  } finally {
    deleting.value = false;
  }
}

onMounted(loadVehicles);
</script>

<template>
  <v-container class="py-8">
    <v-row align="center" class="mb-4">
      <v-col><h1 class="text-h4">Vehicles</h1></v-col>
      <v-col v-if="isAdmin" cols="auto">
        <v-btn color="primary" variant="elevated" class="oc-cta" @click="openAddDialog">+ New vehicle</v-btn>
      </v-col>
    </v-row>

    <v-progress-linear v-if="loading" indeterminate class="mb-4" />
    <v-alert v-if="listError" type="error" density="compact" class="mb-4">{{ listError }}</v-alert>
    <p v-if="!loading && !listError && vehicles.length === 0" class="text-body-1">No vehicles yet. Create your first vehicle.</p>

    <v-table v-if="!loading && vehicles.length > 0">
      <thead>
        <tr>
          <th class="text-left">Make</th>
          <th class="text-left">Model</th>
          <th class="text-left">Year</th>
          <th class="text-left">VIN</th>
          <th class="text-left">Purchase Date</th>
          <th class="text-left">Color</th>
          <th class="text-left">Passenger Capacity</th>
          <th class="text-left">License Plate Number</th>
          <th class="text-left">License Plate Expiration</th>
          <th class="text-left">Area</th>
          <th v-if="isAdmin" class="text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="vehicle in vehicles" :key="vehicle.id">
          <td>{{ vehicle.make }}<span class="d-sr-only">{{ displayName(vehicle) }}</span></td>
          <td>{{ vehicle.model }}</td>
          <td>{{ vehicle.year }}</td>
          <td>{{ vehicle.vin }}</td>
          <td>{{ vehicle.purchaseDate }}</td>
          <td>{{ vehicle.color }}</td>
          <td>{{ vehicle.passengerCapacity }}</td>
          <td>{{ vehicle.licensePlateNo }}</td>
          <td>{{ vehicle.licensePlateExp }}</td>
          <td>{{ vehicle.area }}</td>
          <td v-if="isAdmin">
            <div class="d-flex align-center ga-6">
              <v-btn icon size="small" variant="text" aria-label="Edit vehicle" @click="openEditDialog(vehicle)">
                <v-icon size="small">mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon size="small" variant="text" aria-label="Delete vehicle" @click="openDeleteDialog(vehicle)">
                <v-icon size="small">mdi-trash-can</v-icon>
              </v-btn>
            </div>
          </td>
        </tr>
      </tbody>
    </v-table>

    <v-dialog v-model="formDialogOpen" max-width="600">
      <v-card rounded="lg">
        <v-card-title>{{ isAddMode ? "Add Vehicle" : "Edit Vehicle" }}</v-card-title>
        <v-card-text>
          <VehicleForm v-model="form" :is-add-mode="isAddMode" @submit="saveVehicle" />
          <v-alert v-if="inlineError" type="error" density="compact" class="mt-2">{{ inlineError }}</v-alert>
          <v-alert v-if="formError" type="error" density="compact" class="mt-2">{{ formError }}</v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeFormDialog">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" :loading="saving" @click="saveVehicle">
            {{ isAddMode ? "Create" : "Save Vehicle" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialogOpen" max-width="420">
      <v-card rounded="lg">
        <v-card-title>Delete Vehicle</v-card-title>
        <v-card-text>Delete {{ vehicleToDelete ? displayName(vehicleToDelete) : "" }}? This cannot be undone.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" :loading="deleting" @click="confirmDelete">Delete Vehicle</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
