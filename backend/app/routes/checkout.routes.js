import { Router } from "express";
import { authenticate } from "../authorization/authorization.js";
import controller from "../controllers/checkout.controller.js";

const router = Router();

router.get("/reservations/checkout-status", [authenticate], controller.findStatus);
router.get("/reservations/:id/checkout-return", [authenticate], controller.findOne);
router.post("/reservations/:id/checkout", [authenticate], controller.checkout);
router.post("/reservations/:id/return", [authenticate], controller.returnVehicle);

export default router;
