import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import VehicleMaintenance from "./views/VehicleMaintenance.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: Home,
    },
    {
      path: "/maintenance",
      name: "vehicleMaintenance",
      component: VehicleMaintenance,
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: { name: "home" },
    },
  ],
});

export default router;
