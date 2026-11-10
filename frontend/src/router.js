import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
<<<<<<< HEAD
import VehicleIssueReporting from "./views/VehicleIssueReporting.vue";
=======
import Login from "./views/Login.vue";
import Account from "./views/Account.vue";
import VehicleList from "./views/VehicleList.vue";
import Utils from "./config/utils.js";
>>>>>>> origin/dev

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
<<<<<<< HEAD
      path: "/issues",
      name: "vehicleIssueReporting",
      component: VehicleIssueReporting,
=======
      path: "/account",
      name: "account",
      component: Account,
    },
    {
      path: "/vehicles",
      name: "vehicles",
      component: VehicleList,
>>>>>>> origin/dev
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

  return true;
});

export default router;
