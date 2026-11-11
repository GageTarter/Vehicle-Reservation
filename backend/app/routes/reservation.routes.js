import { Router } from "express";
import reservation from "../controllers/reservation.controller.js";
import { authenticate, requireAdmin } from "../authorization/authorization.js";

const router = Router();

router.get("/drivers", [authenticate], reservation.listDrivers);
router.get("/destinations", [authenticate], reservation.listDestinations);
router.get("/reservations", [authenticate], reservation.findAll);
router.post("/reservations", [authenticate], reservation.create);
router.post(
  "/reservations/pre-trip-notices",
  [authenticate, requireAdmin],
  reservation.sendPreTripNotices,
);
router.put("/reservations/:id/assignment", [authenticate, requireAdmin], reservation.assign);
router.get("/reservations/:id", [authenticate], reservation.findOne);
router.put("/reservations/:id", [authenticate], reservation.update);

export default router;
