<script setup>
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <v-container class="py-10">
    <h1 class="text-h4 mb-4">Vehicle Reservation</h1>
    <v-btn
      class="oc-cta"
      color="primary"
      variant="elevated"
      @click="router.push({ name: 'vehicleIssueReporting' })"
    >
      Vehicle issues
    </v-btn>
  </v-container>
</template>
