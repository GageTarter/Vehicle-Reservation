import { Router } from "express";
import { authenticate } from "../authorization/authorization.js";
import controller from "../controllers/mileageService.controller.js";

const router = Router();

router.get("/vehicles/:id/mileage", [authenticate], controller.listMileage);
router.post("/vehicles/:id/mileage", [authenticate], controller.createMileage);
router.get("/vehicles/:id/service-logs", [authenticate], controller.listService);
router.post("/vehicles/:id/service-logs", [authenticate], controller.createService);
router.get("/mileage-logs/:id", [authenticate], controller.findMileage);
router.get("/service-logs/:id", [authenticate], controller.findService);

export default router;
