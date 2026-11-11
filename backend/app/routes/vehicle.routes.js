import { Router } from "express";
import { authenticate, requireAdmin } from "../authorization/authorization.js";
import vehicle from "../controllers/vehicle.controller.js";

const router = Router();

router.get("/vehicles", [authenticate], vehicle.findAll);
router.post("/vehicles", [authenticate, requireAdmin], vehicle.create);
router.put("/vehicles/:id", [authenticate, requireAdmin], vehicle.update);
router.delete("/vehicles/:id", [authenticate, requireAdmin], vehicle.destroy);

export default router;
