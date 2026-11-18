import { Router } from "express";
import { authenticate, requireAdminPrivileges } from "../authorization/authorization.js";
import driver from "../controllers/driver.controller.js";

const router = Router();

router.get("/drivers", [authenticate], driver.findAll);
router.post("/drivers", [authenticate, requireAdminPrivileges], driver.create);
router.put("/drivers/:id", [authenticate, requireAdminPrivileges], driver.update);
router.delete("/drivers/:id", [authenticate, requireAdminPrivileges], driver.destroy);

export default router;
