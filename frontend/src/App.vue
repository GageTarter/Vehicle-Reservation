<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import MenuBar from "./components/MenuBar.vue";
import Utils from "./config/utils.js";

const route = useRoute();
const user = ref(Utils.getStore("user"));

function refreshUser() {
  user.value = Utils.getStore("user");
}

watch(() => route.fullPath, refreshUser);

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
  <v-app>
    <MenuBar v-if="user && route.name !== 'login'" />
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<style>
/* OC Academic Edition — typography (see ui-style-system.mdc) */
.v-application {
  font-family: Inter, sans-serif !important;
  font-size: 16px;
  font-weight: 400;
}

.v-application :is(h1, h2, h3, h4, h5, h6) {
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
}

/* Primary labeled CTAs — shared size for peer buttons */
.v-btn.oc-cta {
  font-size: 0.875rem !important;
  font-weight: 500;
  letter-spacing: 0.01em;
  text-transform: none;
}
</style>
