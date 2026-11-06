import { Router } from "express";
import { authenticate } from "../authorization/authorization.js";
import controller from "../controllers/issue.controller.js";

const router = Router();

router.get("/issues", [authenticate], controller.findAll);
router.get("/issues/:id", [authenticate], controller.findOne);
router.post("/issues", [authenticate], controller.create);
router.patch("/issues/:id/status", [authenticate], controller.updateStatus);
router.get("/vehicles/:id/issues", [authenticate], controller.findByVehicle);

export default router;
