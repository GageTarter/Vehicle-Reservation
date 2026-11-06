import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import VehicleMileageService from "./views/VehicleMileageService.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: Home,
    },
    {
      path: "/mileage-service",
      name: "vehicleMileageService",
      component: VehicleMileageService,
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: { name: "home" },
    },
  ],
});

export default router;
