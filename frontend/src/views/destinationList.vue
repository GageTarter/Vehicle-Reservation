<script setup>
import { computed, onMounted, ref } from "vue";
import DestinationForm from "../components/DestinationForm.vue";
import Utils from "../config/utils.js";
import { isSystemAdmin } from "../config/roles.js";
import destinationServices from "../services/destinationServices.js";

const emptyForm = () => ({
  name: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zip: "",
});

const requiredMessage = {
  name: "destination name is required.",
  addressLine1: "destination address line 1 is required.",
  city: "destination city is required.",
  state: "destination state is required.",
  zip: "destination zip is required.",
};

const user = ref(Utils.getStore("user"));
const isAdmin = computed(() => isSystemAdmin(user.value));
const destinations = ref([]);
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
const destinationToDelete = ref(null);

function serverMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

async function loadDestinations() {
  loading.value = true;
  listError.value = "";

  try {
    const response = await destinationServices.getAll();
    destinations.value = response.data;
  } catch (error) {
    listError.value = serverMessage(error, "Failed to fetch destinations.");
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

function openEditDialog(destination) {
  isAddMode.value = false;
  editingId.value = destination.id;
  form.value = {
    name: destination.name,
    addressLine1: destination.addressLine1,
    addressLine2: destination.addressLine2 ?? "",
    city: destination.city,
    state: destination.state,
    zip: destination.zip,
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

  const nameTaken = destinations.value.some(
    (destination) =>
      destination.name === body.name && (!editingId.value || destination.id !== editingId.value),
  );

  if (nameTaken) {
    return "destination name is in use. Enter a different destination name.";
  }

  return "";
}

async function saveDestination() {
  formError.value = "";
  inlineError.value = firstInlineMessage();

  if (inlineError.value) {
    return;
  }

  saving.value = true;

  try {
    const body = payloadFromForm();

    if (isAddMode.value) {
      await destinationServices.create(body);
    } else {
      await destinationServices.update(editingId.value, body);
    }

    formDialogOpen.value = false;
    await loadDestinations();
  } catch (error) {
    formError.value = serverMessage(error, "Failed to save the destination.");
  } finally {
    saving.value = false;
  }
}

function openDeleteDialog(destination) {
  destinationToDelete.value = destination;
  deleteDialogOpen.value = true;
}

function closeDeleteDialog() {
  deleteDialogOpen.value = false;
  destinationToDelete.value = null;
}

async function confirmDelete() {
  deleting.value = true;
  listError.value = "";

  try {
    await destinationServices.remove(destinationToDelete.value.id);
    deleteDialogOpen.value = false;
    destinationToDelete.value = null;
    await loadDestinations();
  } catch (error) {
    listError.value = serverMessage(error, "Failed to delete the destination.");
    deleteDialogOpen.value = false;
  } finally {
    deleting.value = false;
  }
}

onMounted(loadDestinations);
</script>

<template>
  <v-container class="py-8">
    <v-row align="center" class="mb-4">
      <v-col><h1 class="text-h4">Destinations</h1></v-col>
      <v-col v-if="isAdmin" cols="auto">
        <v-btn color="primary" variant="elevated" class="oc-cta" @click="openAddDialog">+ New destination</v-btn>
      </v-col>
    </v-row>

    <v-progress-linear v-if="loading" indeterminate class="mb-4" />
    <v-alert v-if="listError" type="error" density="compact" class="mb-4">{{ listError }}</v-alert>
    <p v-if="!loading && !listError && destinations.length === 0" class="text-body-1">No destinations yet.</p>

    <v-table v-if="!loading && destinations.length > 0">
      <thead>
        <tr>
          <th class="text-left">Name</th>
          <th class="text-left">Address Line 1</th>
          <th class="text-left">Address Line 2</th>
          <th class="text-left">City</th>
          <th class="text-left">State</th>
          <th class="text-left">Zip</th>
          <th v-if="isAdmin" class="text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="destination in destinations" :key="destination.id">
          <td>{{ destination.name }}</td>
          <td>{{ destination.addressLine1 }}</td>
          <td>{{ destination.addressLine2 || "" }}</td>
          <td>{{ destination.city }}</td>
          <td>{{ destination.state }}</td>
          <td>{{ destination.zip }}</td>
          <td v-if="isAdmin">
            <div class="d-flex align-center ga-6">
              <v-btn icon size="small" variant="text" aria-label="Edit destination" @click="openEditDialog(destination)">
                <v-icon size="small">mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon size="small" variant="text" aria-label="Delete destination" @click="openDeleteDialog(destination)">
                <v-icon size="small">mdi-trash-can</v-icon>
              </v-btn>
            </div>
          </td>
        </tr>
      </tbody>
    </v-table>

    <v-dialog v-model="formDialogOpen" max-width="600">
      <v-card rounded="lg">
        <v-card-title>{{ isAddMode ? "Add destination" : "Edit destination" }}</v-card-title>
        <v-card-text>
          <DestinationForm v-model="form" @submit="saveDestination" />
          <v-alert v-if="inlineError" type="error" density="compact" class="mt-2">{{ inlineError }}</v-alert>
          <v-alert v-if="formError" type="error" density="compact" class="mt-2">{{ formError }}</v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeFormDialog">Close</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" :loading="saving" @click="saveDestination">
            {{ isAddMode ? "Create" : "Save destination" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialogOpen" max-width="420">
      <v-card rounded="lg">
        <v-card-title>Delete destination</v-card-title>
        <v-card-text>
          Delete {{ destinationToDelete ? destinationToDelete.name : "" }}? This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" :loading="deleting" @click="confirmDelete">
            Delete destination
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
