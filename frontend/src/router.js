import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import AreaInstructions from "./views/AreaInstructions.vue";
import NotificationHistory from "./views/NotificationHistory.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: Home,
    },
    {
      path: "/area-instructions",
      name: "areaInstructions",
      component: AreaInstructions,
    },
    {
      path: "/notification-history",
      name: "notificationHistory",
      component: NotificationHistory,
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: { name: "home" },
    },
  ],
});

export default router;
