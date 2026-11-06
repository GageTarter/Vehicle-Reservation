/**
 * Feature 14 — Vehicle Maintenance Management
 * Spec: features/feature-14-Vehicle Maintenance Management.md
 */
import app from "../server.js";
import { syncTestDatabase } from "./helpers.js";
import {
  createIssue,
  createMaintenanceRequest,
  createUser,
  createVehicle,
  getRequests,
  getVehicleMaintenance,
  patchStatus,
  postRequest,
  sessionTokenFor,
} from "./maintenanceHelpers.js";

async function maintenanceWorld() {
  const maintenance = await createUser({ role: "maintenance", area_id: 1 });
  const inAreaVehicle = await createVehicle({ area_id: 1, name: "Van 4" });
  const outAreaVehicle = await createVehicle({ area_id: 2, name: "Truck 9" });
  const inAreaRequest = await createMaintenanceRequest({
    vehicle_id: inAreaVehicle.id,
    description: "Brake inspection needed.",
    status: "Open",
  });
  const outAreaRequest = await createMaintenanceRequest({
    vehicle_id: outAreaVehicle.id,
    description: "Oil leak in another area.",
    status: "Open",
  });

  return {
    maintenance,
    inAreaVehicle,
    outAreaVehicle,
    inAreaRequest,
    outAreaRequest,
    token: await sessionTokenFor(maintenance),
  };
}

describe("Feature 14 — Vehicle Maintenance Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-14.1 — View maintenance requests", () => {
    it("Maintenance user views authorized maintenance requests", async () => {
      const { token, inAreaRequest, inAreaVehicle } = await maintenanceWorld();

      const res = await getRequests(app, token);

      expect(res.status).toBe(200);
      const found = res.body.find(
        (row) => row.maintenance_request_id === inAreaRequest.maintenance_request_id
      );
      expect(found).toBeTruthy();
      expect(found.vehicle_id).toBe(inAreaVehicle.id);
      expect(found.description).toBe("Brake inspection needed.");
      expect(found.status).toBe("Open");
    });

    it("Area administrator views maintenance requests", async () => {
      const { inAreaRequest, outAreaRequest } = await maintenanceWorld();
      const areaAdmin = await createUser({ role: "area_admin", area_id: 1 });
      const token = await sessionTokenFor(areaAdmin);

      const res = await getRequests(app, token);

      expect(res.status).toBe(200);
      const ids = res.body.map((row) => row.maintenance_request_id);
      expect(ids).toContain(inAreaRequest.maintenance_request_id);
      expect(ids).not.toContain(outAreaRequest.maintenance_request_id);
    });

    it("No maintenance requests are available", async () => {
      const maintenance = await createUser({ role: "maintenance", area_id: 1 });
      const token = await sessionTokenFor(maintenance);

      const res = await getRequests(app, token);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe("US-14.2 — Create a maintenance request", () => {
    it("Maintenance user creates a maintenance request", async () => {
      const { token, inAreaVehicle } = await maintenanceWorld();

      const res = await postRequest(app, token, {
        vehicle_id: inAreaVehicle.id,
        description: "Vehicle needs inspection because of an engine warning light.",
      });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Maintenance request created successfully.");
      expect(res.body.maintenance_request.vehicle_id).toBe(inAreaVehicle.id);
      expect(res.body.maintenance_request.status).toBe("Open");
    });

    it("Maintenance user creates a request linked to an issue", async () => {
      const { token, inAreaVehicle } = await maintenanceWorld();
      const issue = await createIssue({ vehicle_id: inAreaVehicle.id });

      const res = await postRequest(app, token, {
        vehicle_id: inAreaVehicle.id,
        issue_id: issue.issue_id,
        description: "Inspect the reported engine warning.",
      });

      expect(res.status).toBe(201);
      expect(res.body.maintenance_request.vehicle_id).toBe(inAreaVehicle.id);
      expect(res.body.maintenance_request.issue_id).toBe(issue.issue_id);
    });

    it("Maintenance user creates a request without an issue", async () => {
      const { token, inAreaVehicle } = await maintenanceWorld();

      const res = await postRequest(app, token, {
        vehicle_id: inAreaVehicle.id,
        description: "Routine inspection.",
      });

      expect(res.status).toBe(201);
      expect(res.body.maintenance_request.issue_id).toBeNull();
    });

    it("Maintenance user submits a request without a description", async () => {
      const { token, inAreaVehicle } = await maintenanceWorld();
      const before = await getRequests(app, token);

      const res = await postRequest(app, token, {
        vehicle_id: inAreaVehicle.id,
        description: "",
      });

      expect(res.status).toBe(400);
      const after = await getRequests(app, token);
      expect(after.body.length).toBe(before.body.length);
    });

    it("Maintenance user selects a vehicle that does not exist", async () => {
      const { token } = await maintenanceWorld();
      const before = await getRequests(app, token);

      const res = await postRequest(app, token, {
        vehicle_id: 99999,
        description: "Inspect missing vehicle.",
      });

      expect(res.status).toBe(404);
      const after = await getRequests(app, token);
      expect(after.body.length).toBe(before.body.length);
    });

    it("Maintenance user selects an issue belonging to another vehicle", async () => {
      const { token, inAreaVehicle, outAreaVehicle } = await maintenanceWorld();
      const otherIssue = await createIssue({ vehicle_id: outAreaVehicle.id });
      const before = await getRequests(app, token);

      const res = await postRequest(app, token, {
        vehicle_id: inAreaVehicle.id,
        issue_id: otherIssue.issue_id,
        description: "Mismatched issue.",
      });

      expect(res.status).toBe(409);
      const after = await getRequests(app, token);
      expect(after.body.length).toBe(before.body.length);
    });
  });

  describe("US-14.3 — Update maintenance request status", () => {
    it("Maintenance user updates a request to In Progress", async () => {
      const { token, inAreaRequest } = await maintenanceWorld();

      const res = await patchStatus(
        app,
        token,
        inAreaRequest.maintenance_request_id,
        "In Progress"
      );

      expect(res.status).toBe(200);
      expect(res.body.maintenance_request.status).toBe("In Progress");
    });

    it("Maintenance user completes a maintenance request", async () => {
      const { token, inAreaRequest } = await maintenanceWorld();
      await patchStatus(app, token, inAreaRequest.maintenance_request_id, "In Progress");

      const res = await patchStatus(
        app,
        token,
        inAreaRequest.maintenance_request_id,
        "Completed"
      );

      expect(res.status).toBe(200);
      expect(res.body.maintenance_request.status).toBe("Completed");
    });

    it("User submits an invalid maintenance status", async () => {
      const { token, inAreaRequest } = await maintenanceWorld();

      const res = await patchStatus(
        app,
        token,
        inAreaRequest.maintenance_request_id,
        "Done"
      );

      expect(res.status).toBe(400);
      const check = await getRequests(app, token);
      const found = check.body.find(
        (row) => row.maintenance_request_id === inAreaRequest.maintenance_request_id
      );
      expect(found.status).toBe("Open");
    });

    it("Unauthorized user attempts to update a maintenance request", async () => {
      const { inAreaRequest } = await maintenanceWorld();
      const requestor = await createUser({ role: "requestor" });
      const token = await sessionTokenFor(requestor);

      const res = await patchStatus(
        app,
        token,
        inAreaRequest.maintenance_request_id,
        "Completed"
      );

      expect(res.status).toBe(403);
    });
  });

  describe("US-14.4 — View vehicle maintenance information", () => {
    it("Maintenance user views maintenance requests for a vehicle", async () => {
      const { token, inAreaVehicle, inAreaRequest } = await maintenanceWorld();

      const res = await getVehicleMaintenance(app, token, inAreaVehicle.id);

      expect(res.status).toBe(200);
      const found = res.body.find(
        (row) => row.maintenance_request_id === inAreaRequest.maintenance_request_id
      );
      expect(found).toBeTruthy();
      expect(found.description).toBe("Brake inspection needed.");
      expect(found.status).toBe("Open");
    });

    it("Vehicle has no maintenance requests", async () => {
      const { token } = await maintenanceWorld();
      const emptyVehicle = await createVehicle({ area_id: 1 });

      const res = await getVehicleMaintenance(app, token, emptyVehicle.id);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });
});
