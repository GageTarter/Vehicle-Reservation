<script setup>
import { onMounted, ref } from "vue";
import accountServices from "../services/accountServices.js";

const roles = ["user", "admin", "area_admin", "maintenance"];
const users = ref([]);
const drafts = ref({});
const loading = ref(false);
const savingId = ref(null);
const errorMessage = ref("");

function serverMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

async function loadUsers() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await accountServices.getUsers();
    users.value = response.data;
    drafts.value = Object.fromEntries(response.data.map((user) => [user.userId, user.role]));
  } catch (error) {
    errorMessage.value = serverMessage(error, "Failed to load users.");
  } finally {
    loading.value = false;
  }
}

async function saveRole(user) {
  savingId.value = user.userId;
  errorMessage.value = "";

  try {
    const response = await accountServices.updateUserRole(user.userId, {
      role: drafts.value[user.userId],
    });
    const index = users.value.findIndex((row) => row.userId === user.userId);

    if (index >= 0) {
      users.value[index] = response.data;
    }
  } catch (error) {
    errorMessage.value = serverMessage(error, "Failed to update the role.");
  } finally {
    savingId.value = null;
  }
}

onMounted(loadUsers);
</script>

<template>
  <v-container class="py-8">
    <h1 class="text-h4 mb-4">Users</h1>
    <v-progress-linear v-if="loading" indeterminate class="mb-4" />
    <v-alert v-if="errorMessage" type="error" density="compact" class="mb-4">{{ errorMessage }}</v-alert>
    <v-table v-if="!loading && users.length > 0">
      <thead>
        <tr>
          <th class="text-left">Name</th>
          <th class="text-left">Email</th>
          <th class="text-left">Role</th>
          <th class="text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.userId">
          <td>{{ user.fName }} {{ user.lName }}</td>
          <td>{{ user.email }}</td>
          <td>
            <v-select
              v-model="drafts[user.userId]"
              :items="roles"
              :aria-label="`Role for ${user.email}`"
              density="comfortable"
              hide-details
            />
          </td>
          <td>
            <v-btn
              color="primary"
              variant="elevated"
              class="oc-cta"
              :loading="savingId === user.userId"
              @click="saveRole(user)"
            >
              Save
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
  </v-container>
</template>
