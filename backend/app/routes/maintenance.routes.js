import { Router } from "express";
import { authenticate } from "../authorization/authorization.js";
import controller from "../controllers/maintenance.controller.js";

const router = Router();

router.get("/maintenance-requests", [authenticate], controller.findAll);
router.get("/maintenance-requests/:id", [authenticate], controller.findOne);
router.post("/maintenance-requests", [authenticate], controller.create);
router.patch("/maintenance-requests/:id/status", [authenticate], controller.updateStatus);
router.get("/vehicles/:id/maintenance", [authenticate], controller.findByVehicle);

export default router;
