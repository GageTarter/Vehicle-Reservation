<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import authServices from "../services/authServices.js";
import Utils from "../config/utils.js";
import { renderSignInButton } from "../config/googleIdentity.js";

const router = useRouter();
const buttonHost = ref(null);
const loading = ref(false);
const errorMessage = ref("");

async function completeSignIn(idToken) {
  errorMessage.value = "";
  loading.value = true;

  try {
    const response = await authServices.googleSignIn(idToken);
    Utils.setStore("user", response.data);
    await router.push({ name: "home" });
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Google sign-in failed.";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  renderSignInButton(buttonHost.value, {
    onCredential: completeSignIn,
    onCancel: () => {},
    onError: () => {
      errorMessage.value = "Google sign-in failed.";
    },
  });
});
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="4" class="text-center">
        <h1 class="text-h4 mb-6">Sign in</h1>
        <v-alert v-if="errorMessage" type="error" density="compact" class="mb-4 text-left">
          {{ errorMessage }}
        </v-alert>
        <v-progress-circular v-if="loading" indeterminate color="primary" />
        <div v-show="!loading" ref="buttonHost" class="d-inline-block"></div>
      </v-col>
    </v-row>
  </v-container>
</template>
