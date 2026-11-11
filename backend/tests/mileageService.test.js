/**
 * Feature 15 — Vehicle Mileage and Service Log Management
 * Spec: features/feature-15- Vehicle Mileage and Service Log Management
 */
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase } from "./helpers.js";
import {
  createMileage,
  createService,
  createUser,
  createVehicle,
  getMileage,
  getService,
  postMileage,
  postService,
  sessionTokenFor,
} from "./mileageServiceHelpers.js";

async function world() {
  const maintenance = await createUser({ role: "maintenance", area_id: 1 });
  const inAreaVehicle = await createVehicle({ area_id: 1, name: "Van 4" });
  const outAreaVehicle = await createVehicle({ area_id: 2, name: "Truck 9" });
  const mileage = await createMileage({
    vehicle_id: inAreaVehicle.id,
    date_recorded: "2026-11-05",
    current_mileage: 45200,
  });
  const service = await createService({
    vehicle_id: inAreaVehicle.id,
    service_date: "2026-11-05",
    service_performed: "Oil change and tire rotation",
  });
  await createService({
    vehicle_id: outAreaVehicle.id,
    service_performed: "Outside-area service",
  });

  return {
    inAreaVehicle,
    outAreaVehicle,
    mileage,
    service,
    token: await sessionTokenFor(maintenance),
  };
}

describe("Feature 15 — Vehicle Mileage and Service Log Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("US-15.1 — View vehicle mileage records", () => {
    it("Maintenance user views mileage records", async () => {
      const { token, inAreaVehicle, mileage } = await world();

      const res = await getMileage(app, token, inAreaVehicle.id);

      expect(res.status).toBe(200);
      const found = res.body.find((row) => row.mileage_log_id === mileage.mileage_log_id);
      expect(found).toBeTruthy();
      expect(found.date_recorded).toBe("2026-11-05");
      expect(found.current_mileage).toBe(45200);
    });

    it("Vehicle has no mileage records", async () => {
      const { token } = await world();
      const emptyVehicle = await createVehicle({ area_id: 1 });

      const res = await getMileage(app, token, emptyVehicle.id);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("User attempts to view mileage records outside their area", async () => {
      const { outAreaVehicle } = await world();
      const areaAdmin = await createUser({ role: "area_admin", area_id: 1 });
      const token = await sessionTokenFor(areaAdmin);

      const res = await getMileage(app, token, outAreaVehicle.id);

      expect(res.status).toBe(403);
      expect(res.body.date_recorded).toBeUndefined();
    });
  });

  describe("US-15.2 — Record vehicle mileage", () => {
    it("Maintenance user records vehicle mileage", async () => {
      const { token, inAreaVehicle } = await world();

      const res = await postMileage(app, token, inAreaVehicle.id, {
        date_recorded: "2026-11-06",
        current_mileage: 45310,
      });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Mileage record created successfully.");
      expect(res.body.mileage_log.vehicle_id).toBe(inAreaVehicle.id);
      expect(res.body.mileage_log.current_mileage).toBe(45310);

      const list = await getMileage(app, token, inAreaVehicle.id);
      expect(list.body.some((row) => row.current_mileage === 45310)).toBe(true);
    });

    it("Maintenance user submits a negative mileage value", async () => {
      const { token, inAreaVehicle } = await world();
      const before = await getMileage(app, token, inAreaVehicle.id);

      const res = await postMileage(app, token, inAreaVehicle.id, {
        date_recorded: "2026-11-06",
        current_mileage: -10,
      });

      expect(res.status).toBe(400);
      const after = await getMileage(app, token, inAreaVehicle.id);
      expect(after.body.length).toBe(before.body.length);
    });

    it("Maintenance user submits mileage without a value", async () => {
      const { token, inAreaVehicle } = await world();
      const before = await getMileage(app, token, inAreaVehicle.id);

      const res = await postMileage(app, token, inAreaVehicle.id, {
        date_recorded: "2026-11-06",
      });

      expect(res.status).toBe(400);
      const after = await getMileage(app, token, inAreaVehicle.id);
      expect(after.body.length).toBe(before.body.length);
    });

    it("Maintenance user selects a vehicle that does not exist", async () => {
      const { token } = await world();

      const res = await postMileage(app, token, 99999, {
        date_recorded: "2026-11-06",
        current_mileage: 100,
      });

      expect(res.status).toBe(404);
    });

    it("Unauthorized user attempts to record mileage", async () => {
      const { token: maintenanceToken, inAreaVehicle } = await world();
      const requestor = await createUser({ role: "requestor" });
      const token = await sessionTokenFor(requestor);
      const before = await getMileage(app, maintenanceToken, inAreaVehicle.id);

      const res = await postMileage(app, token, inAreaVehicle.id, {
        date_recorded: "2026-11-06",
        current_mileage: 100,
      });

      expect(res.status).toBe(403);
      const after = await getMileage(app, maintenanceToken, inAreaVehicle.id);
      expect(after.body.length).toBe(before.body.length);
    });
  });

  describe("US-15.3 — View vehicle service records", () => {
    it("Maintenance user views service records", async () => {
      const { token, inAreaVehicle, service } = await world();

      const res = await getService(app, token, inAreaVehicle.id);

      expect(res.status).toBe(200);
      const found = res.body.find((row) => row.service_log_id === service.service_log_id);
      expect(found).toBeTruthy();
      expect(found.service_date).toBe("2026-11-05");
      expect(found.service_performed).toBe("Oil change and tire rotation");
    });

    it("Vehicle has no service records", async () => {
      const { token } = await world();
      const emptyVehicle = await createVehicle({ area_id: 1 });

      const res = await getService(app, token, emptyVehicle.id);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("Area administrator views service records", async () => {
      const { inAreaVehicle, outAreaVehicle, service } = await world();
      const areaAdmin = await createUser({ role: "area_admin", area_id: 1 });
      const token = await sessionTokenFor(areaAdmin);

      const allowed = await getService(app, token, inAreaVehicle.id);
      const denied = await getService(app, token, outAreaVehicle.id);

      expect(allowed.status).toBe(200);
      expect(allowed.body.some((row) => row.service_log_id === service.service_log_id)).toBe(
        true
      );
      expect(denied.status).toBe(403);
    });
  });

  describe("US-15.4 — Record vehicle service", () => {
    it("Maintenance user records a vehicle service", async () => {
      const { token, inAreaVehicle } = await world();

      const res = await postService(app, token, inAreaVehicle.id, {
        service_date: "2026-11-06",
        service_performed: "Replaced cabin filter",
      });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Service record created successfully.");
      expect(res.body.service_log.vehicle_id).toBe(inAreaVehicle.id);

      const list = await getService(app, token, inAreaVehicle.id);
      expect(list.body.some((row) => row.service_performed === "Replaced cabin filter")).toBe(
        true
      );
    });

    it("Maintenance user submits a service record without a description", async () => {
      const { token, inAreaVehicle } = await world();
      const before = await getService(app, token, inAreaVehicle.id);

      const res = await postService(app, token, inAreaVehicle.id, {
        service_date: "2026-11-06",
        service_performed: "",
      });

      expect(res.status).toBe(400);
      const after = await getService(app, token, inAreaVehicle.id);
      expect(after.body.length).toBe(before.body.length);
    });

    it("Maintenance user submits a service record without a date", async () => {
      const { token, inAreaVehicle } = await world();
      const before = await getService(app, token, inAreaVehicle.id);

      const res = await postService(app, token, inAreaVehicle.id, {
        service_performed: "Oil change",
      });

      expect(res.status).toBe(400);
      const after = await getService(app, token, inAreaVehicle.id);
      expect(after.body.length).toBe(before.body.length);
    });

    it("Maintenance user selects a vehicle that does not exist", async () => {
      const { token } = await world();

      const res = await postService(app, token, 99999, {
        service_date: "2026-11-06",
        service_performed: "Oil change",
      });

      expect(res.status).toBe(404);
    });

    it("Unauthorized user attempts to record a service", async () => {
      const { token: maintenanceToken, inAreaVehicle } = await world();
      const requestor = await createUser({ role: "requestor" });
      const token = await sessionTokenFor(requestor);
      const before = await getService(app, maintenanceToken, inAreaVehicle.id);

      const res = await postService(app, token, inAreaVehicle.id, {
        service_date: "2026-11-06",
        service_performed: "Oil change",
      });

      expect(res.status).toBe(403);
      const after = await getService(app, maintenanceToken, inAreaVehicle.id);
      expect(after.body.length).toBe(before.body.length);
    });
  });
});
