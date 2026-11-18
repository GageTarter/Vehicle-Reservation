import { Router } from "express";
import account from "../controllers/account.controller.js";
import { authenticate, requireUserManager } from "../authorization/authorization.js";

const router = Router();

router.get("/me", [authenticate], account.findMe);
router.put("/me", [authenticate], account.updateMe);
router.delete("/me", [authenticate], account.deleteMe);
router.get("/users", [authenticate, requireUserManager], account.findAll);
router.put("/users/:id/role", [authenticate, requireUserManager], account.updateRole);

export default router;
