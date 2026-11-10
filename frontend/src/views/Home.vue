<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import Utils from "../config/utils.js";

const router = useRouter();
const user = ref(Utils.getStore("user"));

function openAccount() {
  router.push({ name: "account" });
}
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" class="text-center">
        <h1 class="text-h4 mb-4">Welcome, {{ user?.fName }}</h1>
        <v-chip color="primary" variant="tonal" class="mb-6">{{ user?.role }}</v-chip>
        <p class="text-body-1 mb-6">Use the menu for Vehicles.</p>
        <div>
          <v-btn color="primary" variant="elevated" class="oc-cta" @click="openAccount">My account</v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            class="ml-2"
            @click="router.push({ name: 'vehicleIssueReporting' })"
          >
            Vehicle issues
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
