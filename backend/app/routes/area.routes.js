import { Router } from "express";
import { authenticate, requireAdminPrivileges } from "../authorization/authorization.js";
import area from "../controllers/area.controller.js";

const router = Router();

router.get("/areas", [authenticate], area.findAll);
router.post("/areas", [authenticate, requireAdminPrivileges], area.create);
router.put("/areas/:id", [authenticate, requireAdminPrivileges], area.update);
router.delete("/areas/:id", [authenticate, requireAdminPrivileges], area.destroy);

export default router;
