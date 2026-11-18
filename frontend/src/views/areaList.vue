<script setup>
import { computed, onMounted, ref } from "vue";
import AreaForm from "../components/AreaForm.vue";
import Utils from "../config/utils.js";
import { isSystemAdmin } from "../config/roles.js";
import areaServices from "../services/areaServices.js";

const emptyForm = () => ({ name: "" });

const user = ref(Utils.getStore("user"));
const isAdmin = computed(() => isSystemAdmin(user.value));
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
const areaToDelete = ref(null);

function serverMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

async function loadAreas() {
  loading.value = true;
  listError.value = "";

  try {
    const response = await areaServices.getAll();
    areas.value = response.data;
  } catch (error) {
    listError.value = serverMessage(error, "Failed to fetch areas.");
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

function openEditDialog(area) {
  isAddMode.value = false;
  editingId.value = area.id;
  form.value = { name: area.name };
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
  return { name: String(form.value.name ?? "").trim() };
}

function firstInlineMessage() {
  const body = payloadFromForm();

  if (body.name === "") {
    return "Area name is required.";
  }

  const nameTaken = areas.value.some(
    (area) => area.name === body.name && (!editingId.value || area.id !== editingId.value),
  );

  if (nameTaken) {
    return "Area name is in use. Enter a different area name.";
  }

  return "";
}

async function submitForm() {
  inlineError.value = firstInlineMessage();
  formError.value = "";

  if (inlineError.value) {
    return;
  }

  saving.value = true;

  try {
    const body = payloadFromForm();

    if (isAddMode.value) {
      await areaServices.create(body);
    } else {
      await areaServices.update(editingId.value, body);
    }

    closeFormDialog();
    await loadAreas();
  } catch (error) {
    formError.value = serverMessage(error, "Failed to save the area.");
  } finally {
    saving.value = false;
  }
}

function openDeleteDialog(area) {
  areaToDelete.value = area;
  deleteDialogOpen.value = true;
}

function closeDeleteDialog() {
  deleteDialogOpen.value = false;
  areaToDelete.value = null;
}

async function confirmDelete() {
  if (!areaToDelete.value) {
    return;
  }

  deleting.value = true;
  listError.value = "";

  try {
    await areaServices.remove(areaToDelete.value.id);
    closeDeleteDialog();
    await loadAreas();
  } catch (error) {
    listError.value = serverMessage(error, "Failed to delete the area.");
  } finally {
    deleting.value = false;
  }
}

onMounted(loadAreas);
</script>

<template>
  <v-container class="py-6">
    <v-row class="mb-4" align="center">
      <v-col><h1 class="text-h4">Areas</h1></v-col>
      <v-col cols="auto" v-if="isAdmin">
        <v-btn color="primary" variant="elevated" class="oc-cta" @click="openAddDialog">+ New area</v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="listError" type="error" class="mb-4">{{ listError }}</v-alert>
    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <v-table v-if="!loading && areas.length > 0">
      <thead>
        <tr>
          <th>Name</th>
          <th v-if="isAdmin" class="text-end">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="area in areas" :key="area.id">
          <td>{{ area.name }}</td>
          <td v-if="isAdmin" class="text-end">
            <v-btn icon size="small" variant="text" aria-label="Edit area" @click="openEditDialog(area)">
              <v-icon icon="mdi-pencil" />
            </v-btn>
            <v-btn icon size="small" variant="text" aria-label="Delete area" @click="openDeleteDialog(area)">
              <v-icon icon="mdi-delete" />
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>

    <v-dialog v-model="formDialogOpen" max-width="480" persistent>
      <v-card>
        <v-card-title>{{ isAddMode ? "Add area" : "Edit area" }}</v-card-title>
        <v-card-text>
          <v-alert v-if="inlineError || formError" type="error" class="mb-4">
            {{ inlineError || formError }}
          </v-alert>
          <AreaForm v-model="form" @submit="submitForm" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeFormDialog">Close</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" :loading="saving" @click="submitForm">
            {{ isAddMode ? "Create" : "Save area" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialogOpen" max-width="420" persistent>
      <v-card>
        <v-card-title>Delete area</v-card-title>
        <v-card-text>
          Delete {{ areaToDelete ? areaToDelete.name : "" }}? This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" :loading="deleting" @click="confirmDelete">
            Delete area
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
