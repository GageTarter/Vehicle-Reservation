<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import Utils from "../config/utils.js";
import { canManageMaintenance, canManageMileage } from "../config/roles.js";

const router = useRouter();
const user = ref(Utils.getStore("user"));
const showMaintenance = computed(() => canManageMaintenance(user.value));
const showMileage = computed(() => canManageMileage(user.value));

function openAccount() {
  router.push({ name: "account" });
}

function openRequests() {
  router.push({ name: "requests" });
}
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" class="text-center">
        <h1 class="text-h4 mb-4">Welcome, {{ user?.fName }}</h1>
        <v-chip color="primary" variant="tonal" class="mb-6">{{ user?.role }}</v-chip>
        <p class="text-body-1 mb-6">Use the menu for Vehicles.</p>
        <div class="d-flex justify-center ga-2">
          <v-btn color="primary" variant="elevated" class="oc-cta" @click="openAccount">My account</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" @click="openRequests">My Requests</v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            class="oc-cta"
            @click="router.push({ name: 'vehicleIssueReporting' })"
          >
            Vehicle issues
          </v-btn>
          <v-btn
            v-if="showMaintenance"
            color="primary"
            variant="tonal"
            class="ml-2"
            @click="router.push({ name: 'vehicleMaintenance' })"
          >
            Vehicle maintenance
          </v-btn>
          <v-btn
            v-if="showMileage"
            color="primary"
            variant="tonal"
            class="ml-2"
            @click="router.push({ name: 'vehicleMileageService' })"
          >
            Mileage and service logs
          </v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            class="ml-2"
            @click="router.push({ name: 'checkoutReturn' })"
          >
            Checkout and Return
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
