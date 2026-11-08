import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import VehicleIssueReporting from "./views/VehicleIssueReporting.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: Home,
    },
    {
      path: "/issues",
      name: "vehicleIssueReporting",
      component: VehicleIssueReporting,
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: { name: "home" },
    },
  ],
});

export default router;
