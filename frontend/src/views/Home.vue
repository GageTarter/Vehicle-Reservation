<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import authServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const router = useRouter();
const user = ref(Utils.getStore("user"));
const signingOut = ref(false);

async function signOut() {
  signingOut.value = true;

  try {
    await authServices.logoutUser();
    Utils.removeItem("user");
    await router.push({ name: "login" });
  } finally {
    signingOut.value = false;
  }
}
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" class="text-center">
        <h1 class="text-h4 mb-4">Welcome, {{ user?.fName }}</h1>
        <v-chip class="mb-6">{{ user?.role }}</v-chip>
        <div>
          <v-btn :loading="signingOut" @click="signOut">Sign out</v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
