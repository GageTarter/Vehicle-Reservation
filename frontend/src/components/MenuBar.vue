<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import Utils from "../config/utils.js";
import authServices from "../services/authServices.js";
import {
  canManageMaintenance,
  canManageMileage,
  canReportIssue,
  canManageUsers,
  canReviewIssues,
  isSystemAdmin,
} from "../config/roles.js";

const router = useRouter();
const user = ref(Utils.getStore("user"));
const menu = ref(false);
const tripsOpen = ref(false);
const fleetOpen = ref(false);
const managementMenu = ref(false);
const signingOut = ref(false);

const admin = computed(() => isSystemAdmin(user.value));
const showUsers = computed(() => canManageUsers(user.value));
const showIssues = computed(
  () => canReportIssue(user.value) || canReviewIssues(user.value)
);
const showMaintenance = computed(() => canManageMaintenance(user.value));
const showMileage = computed(() => canManageMileage(user.value));
const showFleet = computed(
  () => showIssues.value || showMaintenance.value || showMileage.value
);

function refreshUser() {
  user.value = Utils.getStore("user");
}

function goHome() {
  router.push({ name: "home" });
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
    <v-app-bar-title style="cursor: pointer" @click="goHome">
      OC Vehicle Scheduling System
    </v-app-bar-title>
    <div v-if="user" class="nav-center">
      <v-menu v-model="tripsOpen">
        <template #activator="{ props }">
          <v-btn variant="text" color="white" class="ml-2" v-bind="props">Trips</v-btn>
        </template>
        <v-list>
          <v-list-item :to="{ name: 'requests' }" title="My Requests" />
          <v-list-item :to="{ name: 'checkoutReturn' }" title="Checkout and Return" />
          <v-list-item v-if="admin" :to="{ name: 'requestServicing' }" title="Need Vehicle" />
          <v-list-item v-if="admin" :to="{ name: 'calendar' }" title="Weekly calendar" />
        </v-list>
      </v-menu>
      <v-menu v-if="showFleet" v-model="fleetOpen">
        <template #activator="{ props }">
          <v-btn variant="text" color="white" class="ml-2" v-bind="props">Fleet</v-btn>
        </template>
        <v-list>
          <v-list-item v-if="showIssues" :to="{ name: 'vehicleIssueReporting' }" title="Vehicle issues" />
          <v-list-item
            v-if="showMaintenance"
            :to="{ name: 'vehicleMaintenance' }"
            title="Vehicle maintenance"
          />
          <v-list-item
            v-if="showMileage"
            :to="{ name: 'vehicleMileageService' }"
            title="Mileage and service logs"
          />
        </v-list>
      </v-menu>
      <v-menu v-if="admin || showUsers" v-model="managementMenu">
        <template #activator="{ props }">
          <v-btn
            variant="text"
            color="white"
            class="ml-2"
            aria-label="Open management menu"
            v-bind="props"
          >
            Management
          </v-btn>
        </template>
        <v-list>
          <v-list-item
            v-if="admin"
            :to="{ name: 'vehicles' }"
            title="Vehicles"
            @click="managementMenu = false"
          />
          <v-list-item
            v-if="admin"
            :to="{ name: 'drivers' }"
            title="Drivers"
            @click="managementMenu = false"
          />
          <v-list-item
            v-if="admin"
            :to="{ name: 'destinations' }"
            title="Destinations"
            @click="managementMenu = false"
          />
          <v-list-item
            v-if="showUsers"
            :to="{ name: 'users' }"
            title="Users"
            @click="managementMenu = false"
          />
        </v-list>
      </v-menu>
    </div>
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
          <v-list-item prepend-icon="mdi-account" :to="{ name: 'account' }" title="My account" />
          <v-list-item prepend-icon="mdi-logout" :disabled="signingOut" @click="signOut">
            Sign out
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>
  </v-app-bar>
</template>

<style scoped>
.nav-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
}
</style>
