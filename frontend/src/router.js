import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import VehicleIssueReporting from "./views/VehicleIssueReporting.vue";
import VehicleMaintenance from "./views/VehicleMaintenance.vue";
import Login from "./views/Login.vue";
import Account from "./views/Account.vue";
import Requests from "./views/Requests.vue";
import RequestServicing from "./views/RequestServicing.vue";
import VehicleList from "./views/VehicleList.vue";
import Utils from "./config/utils.js";
import { isSystemAdmin } from "./config/roles.js";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: Login,
    },
    {
      path: "/",
      name: "home",
      component: Home,
    },
    {
      path: "/account",
      name: "account",
      component: Account,
    },
    {
      path: "/requests",
      name: "requests",
      component: Requests,
    },
    {
      path: "/request-servicing",
      name: "requestServicing",
      component: RequestServicing,
    },
    {
      path: "/vehicles",
      name: "vehicles",
      component: VehicleList,
    },
    {
      path: "/issues",
      name: "vehicleIssueReporting",
      component: VehicleIssueReporting,
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

router.beforeEach((to) => {
  const user = Utils.getStore("user");

  if (!user && to.name !== "login") {
    return { name: "login" };
  }

  if (user && to.name === "login") {
    return { name: "home" };
  }

  if (to.name === "requestServicing" && !isSystemAdmin(user)) {
    return { name: "home" };
  }

  return true;
});

export default router;
