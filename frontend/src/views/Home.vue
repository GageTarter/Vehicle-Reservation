<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import Utils from "../config/utils.js";
import { isSystemAdmin } from "../config/roles.js";

const router = useRouter();
const user = ref(Utils.getStore("user"));
const showAccountOnHome = computed(() => user.value && !isSystemAdmin(user.value));

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
        <p class="text-body-1 mb-6">
         
        </p>
        <v-btn
          v-if="showAccountOnHome"
          color="primary"
          variant="elevated"
          class="oc-cta"
          @click="openAccount"
        >
          My account
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>
