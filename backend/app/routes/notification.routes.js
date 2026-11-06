import { Router } from "express";
import { authenticate } from "../authorization/authorization.js";
import controller from "../controllers/notification.controller.js";

const router = Router();

router.get("/areas/:id/instructions", [authenticate], controller.getInstructions);
router.put("/areas/:id/instructions", [authenticate], controller.upsertInstructions);
router.get("/reservations/:id/notifications", [authenticate], controller.listNotifications);
router.patch("/reservations/:id/status", [authenticate], controller.updateStatus);
router.post("/notifications/day-before", [authenticate], controller.runDayBefore);

export default router;
