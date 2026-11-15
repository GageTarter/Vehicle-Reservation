<script setup>
import { computed, onMounted, ref } from "vue";
import DriverForm from "../components/DriverForm.vue";
import Utils from "../config/utils.js";
import areaServices from "../services/areaServices.js";
import driverServices from "../services/driverServices.js";

const emptyForm = () => ({
  name: "",
  lastName: "",
  driverID: "",
  licenseState: "",
  licenseExp: "",
  approvedDate: "",
  area: "",
  status: "",
});

const requiredMessage = {
  name: "driver name is required.",
  lastName: "driver last name is required.",
  driverID: "driver ID is required.",
  licenseState: "driver license state is required.",
  licenseExp: "driver license expiration is required.",
  approvedDate: "driver approved date is required.",
  area: "driver area is required.",
  status: "driver status is required.",
};

const user = ref(Utils.getStore("user"));
const isAdmin = computed(() => user.value?.role === "admin");
const drivers = ref([]);
const areas = ref([]);
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
const driverToDelete = ref(null);

function serverMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

function displayName(driver) {
  return `${driver.lastName}, ${driver.name}`;
}

async function loadDrivers() {
  loading.value = true;
  listError.value = "";

  try {
    const response = await driverServices.getAll();
    drivers.value = response.data;
  } catch (error) {
    listError.value = serverMessage(error, "Failed to fetch drivers.");
  } finally {
    loading.value = false;
  }
}

async function loadAreas() {
  try {
    const response = await areaServices.getAll();
    areas.value = response.data.map((area) => area.name);
  } catch {
    areas.value = [];
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

function openEditDialog(driver) {
  isAddMode.value = false;
  editingId.value = driver.id;
  form.value = {
    name: driver.name,
    lastName: driver.lastName,
    driverID: driver.driverID,
    licenseState: driver.licenseState,
    licenseExp: driver.licenseExp,
    approvedDate: driver.approvedDate,
    area: driver.area,
    status: driver.status,
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
  return Object.fromEntries(Object.entries(form.value).map(([key, value]) => [key, String(value ?? "").trim()]));
}

function firstInlineMessage() {
  const body = payloadFromForm();
  const emptyKey = Object.keys(requiredMessage).find((key) => body[key] === "");

  if (emptyKey) {
    return requiredMessage[emptyKey];
  }

  if (isAddMode.value && drivers.value.some((driver) => driver.driverID === body.driverID)) {
    return "driver id is in use. Enter a different driver id.";
  }

  return "";
}

async function saveDriver() {
  formError.value = "";
  inlineError.value = firstInlineMessage();

  if (inlineError.value) {
    return;
  }

  saving.value = true;

  try {
    const body = payloadFromForm();

    if (isAddMode.value) {
      await driverServices.create(body);
    } else {
      await driverServices.update(editingId.value, body);
    }

    formDialogOpen.value = false;
    await loadDrivers();
  } catch (error) {
    formError.value = serverMessage(error, "Failed to save the driver.");
  } finally {
    saving.value = false;
  }
}

function openDeleteDialog(driver) {
  driverToDelete.value = driver;
  deleteDialogOpen.value = true;
}

function closeDeleteDialog() {
  deleteDialogOpen.value = false;
  driverToDelete.value = null;
}

async function confirmDelete() {
  deleting.value = true;
  listError.value = "";

  try {
    await driverServices.remove(driverToDelete.value.id);
    deleteDialogOpen.value = false;
    driverToDelete.value = null;
    await loadDrivers();
  } catch (error) {
    listError.value = serverMessage(error, "Failed to delete the driver.");
    deleteDialogOpen.value = false;
  } finally {
    deleting.value = false;
  }
}

onMounted(() => {
  loadDrivers();

  if (isAdmin.value) {
    loadAreas();
  }
});
</script>

<template>
  <v-container class="py-8">
    <v-row align="center" class="mb-4">
      <v-col><h1 class="text-h4">Drivers</h1></v-col>
      <v-col v-if="isAdmin" cols="auto">
        <v-btn color="primary" variant="elevated" class="oc-cta" @click="openAddDialog">+ New driver</v-btn>
      </v-col>
    </v-row>

    <v-progress-linear v-if="loading" indeterminate class="mb-4" />
    <v-alert v-if="listError" type="error" density="compact" class="mb-4">{{ listError }}</v-alert>
    <p v-if="!loading && !listError && drivers.length === 0" class="text-body-1">No drivers yet.</p>

    <v-table v-if="!loading && drivers.length > 0">
      <thead>
        <tr>
          <th class="text-left">Name</th>
          <th class="text-left">Last Name</th>
          <th class="text-left">Driver ID</th>
          <th class="text-left">License State</th>
          <th class="text-left">License Expiration</th>
          <th class="text-left">Approved Date</th>
          <th class="text-left">Area</th>
          <th class="text-left">Status</th>
          <th v-if="isAdmin" class="text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="driver in drivers" :key="driver.id">
          <td>{{ driver.name }}<span class="d-sr-only">{{ displayName(driver) }}</span></td>
          <td>{{ driver.lastName }}</td>
          <td>{{ driver.driverID }}</td>
          <td>{{ driver.licenseState }}</td>
          <td>{{ driver.licenseExp }}</td>
          <td>{{ driver.approvedDate }}</td>
          <td>{{ driver.area }}</td>
          <td>{{ driver.status }}</td>
          <td v-if="isAdmin">
            <div class="d-flex align-center ga-6">
              <v-btn icon size="small" variant="text" aria-label="Edit driver" @click="openEditDialog(driver)">
                <v-icon size="small">mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon size="small" variant="text" aria-label="Delete driver" @click="openDeleteDialog(driver)">
                <v-icon size="small">mdi-trash-can</v-icon>
              </v-btn>
            </div>
          </td>
        </tr>
      </tbody>
    </v-table>

    <v-dialog v-model="formDialogOpen" max-width="600">
      <v-card rounded="lg">
        <v-card-title>{{ isAddMode ? "Add driver" : "Edit driver" }}</v-card-title>
        <v-card-text>
          <DriverForm v-model="form" :areas="areas" @submit="saveDriver" />
          <v-alert v-if="inlineError" type="error" density="compact" class="mt-2">{{ inlineError }}</v-alert>
          <v-alert v-if="formError" type="error" density="compact" class="mt-2">{{ formError }}</v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeFormDialog">Close</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" :loading="saving" @click="saveDriver">
            {{ isAddMode ? "Create" : "Save driver" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialogOpen" max-width="420">
      <v-card rounded="lg">
        <v-card-title>Delete driver</v-card-title>
        <v-card-text>Delete {{ driverToDelete ? displayName(driverToDelete) : "" }}? This cannot be undone.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" :loading="deleting" @click="confirmDelete">Delete driver</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
