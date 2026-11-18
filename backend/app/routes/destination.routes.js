import { Router } from "express";
import { authenticate, requireAdminPrivileges } from "../authorization/authorization.js";
import destination from "../controllers/destination.controller.js";

const router = Router();

router.get("/destinations", [authenticate], destination.findAll);
router.post("/destinations", [authenticate, requireAdminPrivileges], destination.create);
router.put("/destinations/:id", [authenticate, requireAdminPrivileges], destination.update);
router.delete("/destinations/:id", [authenticate, requireAdminPrivileges], destination.destroy);

export default router;
