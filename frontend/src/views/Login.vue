<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import authServices from "../services/authServices.js";
import Utils from "../config/utils.js";
import { requestGoogleIdToken } from "../config/googleIdentity.js";

const router = useRouter();
const loading = ref(false);
const errorMessage = ref("");

async function signInWithGoogle() {
  errorMessage.value = "";
  loading.value = true;

  try {
    const idToken = await requestGoogleIdToken();
    const response = await authServices.googleSignIn(idToken);
    Utils.setStore("user", response.data);
    await router.push({ name: "home" });
  } catch (error) {
    if (error?.code === "cancelled") {
      return;
    }

    errorMessage.value = error.response?.data?.message || "Google sign-in failed.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="4" class="text-center">
        <h1 class="text-h4 mb-6">Sign in</h1>
        <v-alert v-if="errorMessage" type="error" density="compact" class="mb-4 text-left">
          {{ errorMessage }}
        </v-alert>
        <v-btn
          color="primary"
          variant="elevated"
          class="oc-cta"
          :loading="loading"
          @click="signInWithGoogle"
        >
          Sign in with Google
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>
