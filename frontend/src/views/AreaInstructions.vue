<script setup>
import { computed, onMounted, ref } from "vue";
import Utils from "../config/utils.js";
import notificationServices from "../services/notificationServices.js";

const user = computed(() => Utils.getStore("user"));
const isAreaAdmin = computed(() => user.value?.role === "area_admin");
const isSystemAdmin = computed(() => user.value?.role === "system_admin");
const canManage = computed(() => isAreaAdmin.value || isSystemAdmin.value);

const loading = ref(false);
const successMessage = ref("");
const errorMessage = ref("");
const areaId = ref("");
const pickup = ref("");
const returnInstructions = ref("");
const contact = ref("");

function apiMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

async function loadInstructions() {
  errorMessage.value = "";

  if (!canManage.value) {
    errorMessage.value = "You cannot manage area instructions.";
    return;
  }

  if (areaId.value === "") {
    errorMessage.value = "Select an area to view instructions.";
    return;
  }

  loading.value = true;

  try {
    const res = await notificationServices.getInstructions(areaId.value);
    pickup.value = res.data?.pickup_instructions || "";
    returnInstructions.value = res.data?.return_instructions || "";
    contact.value = res.data?.contact_information || "";
  } catch (error) {
    errorMessage.value = apiMessage(error, "Unable to load area instructions.");
  } finally {
    loading.value = false;
  }
}

async function saveInstructions() {
  errorMessage.value = "";
  successMessage.value = "";

  if (!pickup.value?.trim() || !returnInstructions.value?.trim()) {
    errorMessage.value = "Required instruction information is missing.";
    return;
  }

  loading.value = true;

  try {
    const res = await notificationServices.saveInstructions(areaId.value, {
      pickup_instructions: pickup.value.trim(),
      return_instructions: returnInstructions.value.trim(),
      contact_information: contact.value.trim(),
    });
    successMessage.value = res.data?.message || "Area instructions updated successfully.";
  } catch (error) {
    errorMessage.value = apiMessage(error, "Unable to save area instructions.");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (isAreaAdmin.value && user.value?.area_id != null) {
    areaId.value = String(user.value.area_id);
    loadInstructions();
  }
});
</script>

<template>
  <v-container class="py-8">
    <h1 class="text-h4 mb-4">Area Pickup and Return Instructions</h1>

    <v-progress-linear v-if="loading" indeterminate class="mb-4" data-testid="loading" />

    <v-alert v-if="successMessage" type="success" class="mb-4" data-testid="success-alert">
      {{ successMessage }}
    </v-alert>
    <v-alert v-if="errorMessage" type="error" class="mb-4" data-testid="error-alert">
      {{ errorMessage }}
    </v-alert>

    <v-card v-if="canManage" class="pa-4" elevation="2">
      <v-card-title>Instructions</v-card-title>
      <v-card-text>
        <v-text-field
          id="area-id"
          v-model="areaId"
          label="Area ID"
          type="number"
          :disabled="isAreaAdmin"
        />
        <v-btn
          v-if="isSystemAdmin"
          color="secondary"
          variant="outlined"
          class="mb-4"
          @click="loadInstructions"
        >
          Load instructions
        </v-btn>
        <v-textarea id="pickup-instructions" v-model="pickup" label="Pickup instructions" />
        <v-textarea
          id="return-instructions"
          v-model="returnInstructions"
          label="Return instructions"
        />
        <v-text-field id="contact-information" v-model="contact" label="Contact information" />
      </v-card-text>
      <v-card-actions>
        <v-btn class="oc-cta" color="primary" variant="elevated" @click="saveInstructions">
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>
