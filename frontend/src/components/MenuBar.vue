<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import Utils from "../config/utils.js";
import authServices from "../services/authServices.js";
import { isSystemAdmin } from "../config/roles.js";

const router = useRouter();
const user = ref(Utils.getStore("user"));
const menu = ref(false);
const signingOut = ref(false);
const admin = () => isSystemAdmin(user.value);

function refreshUser() {
  user.value = Utils.getStore("user");
}

async function signOut() {
  signingOut.value = true;

  try {
    await authServices.logoutUser();
  } catch {
    // Local sign-out still clears the session the menu is showing.
  }

  Utils.removeItem("user");
  window.dispatchEvent(new Event("user-logged-out"));
  menu.value = false;
  signingOut.value = false;
  await router.push({ name: "login" });
}

onMounted(() => {
  window.addEventListener("user-logged-in", refreshUser);
  window.addEventListener("user-logged-out", refreshUser);
});

onUnmounted(() => {
  window.removeEventListener("user-logged-in", refreshUser);
  window.removeEventListener("user-logged-out", refreshUser);
});
</script>

<template>
  <v-app-bar color="primary" density="comfortable">
    <v-app-bar-title>OC Vehicle Scheduling System</v-app-bar-title>
    <v-btn v-if="user" variant="text" color="white" class="ml-4" :to="{ name: 'requests' }">My Requests</v-btn>
    <v-btn v-if="user && admin()" variant="text" color="white" class="ml-2" :to="{ name: 'requestServicing' }">
      Need Vehicle
    </v-btn>
    <v-btn v-if="user" variant="text" color="white" class="ml-2" :to="{ name: 'vehicles' }">Vehicles</v-btn>
    <v-spacer />
    <v-menu v-if="user" v-model="menu">
      <template #activator="{ props }">
        <v-btn
          icon
          variant="text"
          color="white"
          aria-label="Open profile menu"
          v-bind="props"
        >
          <v-icon>mdi-account-circle</v-icon>
        </v-btn>
      </template>
      <v-card min-width="300">
        <v-card-text>
          <p class="text-body-1">{{ user.fName }} {{ user.lName }}</p>
          <p class="text-body-2">{{ user.email }}</p>
        </v-card-text>
        <v-divider />
        <v-list>
          <v-list-item prepend-icon="mdi-logout" :disabled="signingOut" @click="signOut">Sign out</v-list-item>
        </v-list>
      </v-card>
    </v-menu>
  </v-app-bar>
</template>
