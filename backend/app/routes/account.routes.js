import { Router } from "express";
import account from "../controllers/account.controller.js";
import { authenticate } from "../authorization/authorization.js";

const router = Router();

router.get("/me", [authenticate], account.findMe);
router.put("/me", [authenticate], account.updateMe);
router.delete("/me", [authenticate], account.deleteMe);

export default router;
