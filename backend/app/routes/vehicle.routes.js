import { Router } from "express";
import { authenticate } from "../authorization/authorization.js";
import vehicle from "../controllers/vehicle.controller.js";

const router = Router();

router.get("/vehicles", [authenticate], vehicle.findAll);
router.post("/vehicles", [authenticate], vehicle.create);
router.put("/vehicles/:id", [authenticate], vehicle.update);
router.delete("/vehicles/:id", [authenticate], vehicle.destroy);

export default router;
