<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import accountServices from "../services/accountServices.js";
import authServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const router = useRouter();
const account = ref(null);
const editing = ref(false);
const confirmDelete = ref(false);
const draft = ref({ fName: "", lName: "" });
const errorMessage = ref("");
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const signingOut = ref(false);

function serverMessage(error) {
  return error.response?.data?.message || "";
}

function storeAccount(data) {
  const stored = Utils.getStore("user");

  if (!stored) {
    return;
  }

  Utils.setStore("user", {
    ...stored,
    userId: data.userId,
    email: data.email,
    fName: data.fName,
    lName: data.lName,
    role: data.role,
  });
}

async function loadAccount() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await accountServices.getAccount();
    account.value = response.data;
  } catch (error) {
    errorMessage.value = serverMessage(error);
  } finally {
    loading.value = false;
  }
}

function startEdit() {
  draft.value = { fName: account.value.fName, lName: account.value.lName };
  errorMessage.value = "";
  editing.value = true;
}

function cancelEdit() {
  editing.value = false;
  errorMessage.value = "";
}

async function saveName() {
  saving.value = true;
  errorMessage.value = "";

  try {
    const response = await accountServices.updateAccount({
      fName: draft.value.fName,
      lName: draft.value.lName,
    });
    account.value = response.data;
    storeAccount(response.data);
    editing.value = false;
  } catch (error) {
    errorMessage.value = serverMessage(error);
  } finally {
    saving.value = false;
  }
}

function askDelete() {
  confirmDelete.value = true;
  errorMessage.value = "";
}

function cancelDelete() {
  confirmDelete.value = false;
}

async function removeAccount() {
  deleting.value = true;
  errorMessage.value = "";

  try {
    await accountServices.deleteAccount();
    Utils.removeItem("user");
    await router.push({ name: "login" });
  } catch (error) {
    errorMessage.value = serverMessage(error);
  } finally {
    deleting.value = false;
  }
}

async function signOut() {
  signingOut.value = true;
  errorMessage.value = "";

  try {
    await authServices.logoutUser();
    Utils.removeItem("user");
    await router.push({ name: "login" });
  } catch (error) {
    errorMessage.value = serverMessage(error);
  } finally {
    signingOut.value = false;
  }
}

onMounted(loadAccount);
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6">
        <h1 class="text-h4 mb-4">My account</h1>
        <v-alert v-if="errorMessage" type="error" density="compact" class="mb-4">
          {{ errorMessage }}
        </v-alert>
        <v-progress-circular v-if="loading" indeterminate color="primary" class="mb-4" />
        <template v-if="account && !editing">
          <p class="text-body-1 mb-2">{{ account.email }}</p>
          <v-chip class="mb-4">{{ account.role }}</v-chip>
          <p class="text-body-1 mb-1">{{ account.fName }}</p>
          <p class="text-body-1 mb-6">{{ account.lName }}</p>
          <v-btn class="mb-6" variant="outlined" @click="startEdit">Edit</v-btn>
        </template>
        <template v-else-if="account && editing">
          <v-text-field v-model="draft.fName" label="First name" density="comfortable" />
          <v-text-field v-model="draft.lName" label="Last name" density="comfortable" />
          <div class="d-flex ga-2 mb-6">
            <v-btn color="primary" variant="elevated" class="oc-cta" :loading="saving" @click="saveName">Save</v-btn>
            <v-btn variant="text" @click="cancelEdit">Cancel</v-btn>
          </div>
        </template>
        <div class="d-flex ga-2">
          <v-btn variant="outlined" @click="askDelete">Delete account</v-btn>
          <v-btn :loading="signingOut" @click="signOut">Sign out</v-btn>
        </div>
        <v-card v-if="confirmDelete" class="mt-6 pa-2">
          <v-card-text>Delete your account?</v-card-text>
          <v-card-actions>
            <v-btn variant="text" @click="cancelDelete">Cancel</v-btn>
            <v-btn color="error" variant="elevated" :loading="deleting" @click="removeAccount">Delete account</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
