/**
 * Feature 13 — Vehicle Issue Reporting
 * Spec: features/feature-13- vehicle issue reporting.md
 */
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase } from "./helpers.js";
import {
  createIssue,
  createReservation,
  createUser,
  createVehicle,
  deleteIssue,
  getIssue,
  getIssues,
  getVehicleIssues,
  issuesList,
  patchIssue,
  patchIssueStatus,
  postIssue,
  sessionTokenFor,
} from "./issuesHelpers.js";

async function requestorWorld() {
  const requestor = await createUser({ role: "requestor" });
  const otherUser = await createUser({
    role: "requestor",
  });
  const vehicle = await createVehicle({ area_id: 1 });
  const reservation = await createReservation({
    requester_id: requestor.user_id ?? requestor.id,
    vehicle_id: vehicle.vehicle_id ?? vehicle.id,
  });
  const otherReservation = await createReservation({
    requester_id: otherUser.user_id ?? otherUser.id,
    vehicle_id: vehicle.vehicle_id ?? vehicle.id,
  });
  const token = await sessionTokenFor(requestor);

  return { requestor, vehicle, reservation, otherReservation, token };
}

async function adminWorld() {
  const areaAdmin = await createUser({ role: "area_admin" });
  const systemAdmin = await createUser({ role: "system_admin" });
  const requestor = await createUser({ role: "requestor" });
  const inAreaVehicle = await createVehicle({ area_id: 1 });
  const outAreaVehicle = await createVehicle({ area_id: 2 });
  const inAreaIssue = await createIssue({
    vehicle_id: inAreaVehicle.vehicle_id ?? inAreaVehicle.id,
    reported_by: requestor.user_id ?? requestor.id,
    issue_type: "Dirty Vehicle",
    description: "Seats need cleaning.",
    status: "Open",
  });
  const outAreaIssue = await createIssue({
    vehicle_id: outAreaVehicle.vehicle_id ?? outAreaVehicle.id,
    reported_by: requestor.user_id ?? requestor.id,
    issue_type: "Maintenance Needed",
    description: "Check engine light is on.",
    status: "Open",
  });

  return {
    areaAdmin,
    systemAdmin,
    requestor,
    inAreaVehicle,
    outAreaVehicle,
    inAreaIssue,
    outAreaIssue,
    areaToken: await sessionTokenFor(areaAdmin),
    systemToken: await sessionTokenFor(systemAdmin),
    requestorToken: await sessionTokenFor(requestor),
  };
}

describe("Feature 13 — Vehicle Issue Reporting", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("US-13.1 — Report a vehicle issue", () => {
    it("Requestor reports a vehicle issue", async () => {
      const { requestor, vehicle, token } = await requestorWorld();
      const vehicleId = vehicle.vehicle_id ?? vehicle.id;
      const reporterId = requestor.user_id ?? requestor.id;

      const res = await postIssue(app, token, {
        vehicle_id: vehicleId,
        issue_type: "Low Gas",
        description: "The vehicle has less than one-quarter tank of gas.",
      });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Vehicle issue reported successfully.");
      expect(res.body.issue.vehicle_id).toBe(vehicleId);
      expect(res.body.issue.reported_by).toBe(reporterId);
      expect(res.body.issue.issue_type).toBe("Low Gas");
      expect(res.body.issue.description).toBe(
        "The vehicle has less than one-quarter tank of gas."
      );
      expect(res.body.issue.status).toBe("Open");
      expect(res.body.issue.reported_date).toBeTruthy();
    });

    it("Requestor reports an issue associated with a reservation", async () => {
      const { vehicle, reservation, token } = await requestorWorld();
      const vehicleId = vehicle.vehicle_id ?? vehicle.id;
      const reservationId = reservation.reservation_id ?? reservation.id;

      const res = await postIssue(app, token, {
        vehicle_id: vehicleId,
        reservation_id: reservationId,
        issue_type: "Dirty Vehicle",
        description: "The interior was left dirty after the trip.",
      });

      expect(res.status).toBe(201);
      expect(res.body.issue.vehicle_id).toBe(vehicleId);
      expect(res.body.issue.reservation_id).toBe(reservationId);
    });

    it("Requestor submits an incomplete issue report", async () => {
      const { vehicle, token } = await requestorWorld();

      const res = await postIssue(app, token, {
        vehicle_id: vehicle.vehicle_id ?? vehicle.id,
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBeTruthy();
    });

    it("Requestor reports an issue against another user's reservation", async () => {
      const { otherReservation, token } = await requestorWorld();
      const reservationId =
        otherReservation.reservation_id ?? otherReservation.id;

      const before = await getIssues(app, token);

      const res = await postIssue(app, token, {
        vehicle_id: otherReservation.vehicle_id,
        reservation_id: reservationId,
        issue_type: "Low Gas",
        description: "Reporting against someone else's reservation.",
      });

      expect(res.status).toBe(403);
      expect(res.body.message).toBeTruthy();

      const after = await getIssues(app, token);
      const beforeCount = issuesList(before.body).length;
      const afterCount = issuesList(after.body).length;
      expect(afterCount).toBe(beforeCount);
    });
  });

  describe("US-13.5 — View reported vehicle issues", () => {
    it("Area administrator views issues for their area", async () => {
      const { areaToken, inAreaIssue } = await adminWorld();
      const inAreaId = inAreaIssue.issue_id ?? inAreaIssue.id;

      const res = await getIssues(app, areaToken);

      expect(res.status).toBe(200);
      const issues = issuesList(res.body);
      expect(issues.some((issue) => (issue.issue_id ?? issue.id) === inAreaId)).toBe(
        true
      );

      const displayed = issues.find(
        (issue) => (issue.issue_id ?? issue.id) === inAreaId
      );
      expect(displayed.issue_type).toBe("Dirty Vehicle");
      expect(displayed.description).toBe("Seats need cleaning.");
      expect(displayed.reported_by).toBeTruthy();
      expect(displayed.reported_date).toBeTruthy();
      expect(displayed.status).toBe("Open");
    });

    it("Area administrator attempts to view an issue outside their area", async () => {
      const { areaToken, outAreaIssue } = await adminWorld();
      const outAreaId = outAreaIssue.issue_id ?? outAreaIssue.id;

      const res = await getIssue(app, areaToken, outAreaId);

      expect(res.status).toBe(403);
      expect(res.body.issue).toBeUndefined();
      expect(res.body.issue_type).toBeUndefined();
    });

    it("System administrator views all vehicle issues", async () => {
      const { systemToken, inAreaIssue, outAreaIssue } = await adminWorld();
      const inAreaId = inAreaIssue.issue_id ?? inAreaIssue.id;
      const outAreaId = outAreaIssue.issue_id ?? outAreaIssue.id;

      const res = await getIssues(app, systemToken);

      expect(res.status).toBe(200);
      const ids = issuesList(res.body).map((issue) => issue.issue_id ?? issue.id);
      expect(ids).toEqual(expect.arrayContaining([inAreaId, outAreaId]));
    });
  });

  describe("US-13.6 — Update vehicle issue status", () => {
    it("Area administrator updates an issue status", async () => {
      const { areaToken, inAreaIssue } = await adminWorld();
      const issueId = inAreaIssue.issue_id ?? inAreaIssue.id;

      const res = await patchIssueStatus(app, areaToken, issueId, "In Progress");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Vehicle issue status updated successfully.");
      expect(res.body.issue.status).toBe("In Progress");
      expect(res.body.issue.issue_id ?? res.body.issue.id).toBe(issueId);
    });

    it("Administrator resolves an issue", async () => {
      const { systemToken, inAreaIssue } = await adminWorld();
      const issueId = inAreaIssue.issue_id ?? inAreaIssue.id;

      await patchIssueStatus(app, systemToken, issueId, "In Progress");
      const res = await patchIssueStatus(app, systemToken, issueId, "Resolved");

      expect(res.status).toBe(200);
      expect(res.body.issue.status).toBe("Resolved");
    });

    it("Requestor attempts to update an issue status", async () => {
      const { requestorToken, inAreaIssue } = await adminWorld();
      const issueId = inAreaIssue.issue_id ?? inAreaIssue.id;

      const res = await patchIssueStatus(
        app,
        requestorToken,
        issueId,
        "Resolved"
      );

      expect(res.status).toBe(403);

      const check = await getIssue(app, requestorToken, issueId);
      if (check.status === 200) {
        expect(check.body.issue?.status || check.body.status).toBe("Open");
      }
    });
  });

  describe("US-13.7 — View vehicle issue history", () => {
    it("Administrator views vehicle issue history", async () => {
      const { systemToken, inAreaVehicle, inAreaIssue } = await adminWorld();
      const vehicleId = inAreaVehicle.vehicle_id ?? inAreaVehicle.id;
      const issueId = inAreaIssue.issue_id ?? inAreaIssue.id;

      const res = await getVehicleIssues(app, systemToken, vehicleId);

      expect(res.status).toBe(200);
      const issues = issuesList(res.body);
      const displayed = issues.find((issue) => (issue.issue_id ?? issue.id) === issueId);
      expect(displayed).toBeTruthy();
      expect(displayed.issue_type).toBe("Dirty Vehicle");
      expect(displayed.description).toBe("Seats need cleaning.");
      expect(displayed.reported_date).toBeTruthy();
      expect(displayed.status).toBe("Open");
    });

    it("Vehicle has no reported issues", async () => {
      const { systemToken } = await adminWorld();
      const emptyVehicle = await createVehicle({ area_id: 1 });
      const vehicleId = emptyVehicle.vehicle_id ?? emptyVehicle.id;

      const res = await getVehicleIssues(app, systemToken, vehicleId);

      expect(res.status).toBe(200);
      expect(issuesList(res.body)).toEqual([]);
    });
  });

  describe("US-13.4 — Delete a reported issue", () => {
    it("Requestor deletes a reported issue", async () => {
      const { requestor, vehicle, token } = await requestorWorld();
      const vehicleId = vehicle.vehicle_id ?? vehicle.id;
      const issue = await createIssue({
        vehicle_id: vehicleId,
        reported_by: requestor.user_id ?? requestor.id,
        issue_type: "Low Gas",
        description: "The vehicle has less than one-quarter tank of gas.",
      });
      const issueId = issue.issue_id ?? issue.id;

      const res = await deleteIssue(app, token, issueId);

      expect(res.status).toBe(204);
      const listed = await getIssues(app, token);
      expect(
        issuesList(listed.body).find((row) => (row.issue_id ?? row.id) === issueId)
      ).toBeFalsy();
    });

    it("Requestor cannot delete another user's issue", async () => {
      const { vehicle, token } = await requestorWorld();
      const otherUser = await createUser({ role: "requestor" });
      const issue = await createIssue({
        vehicle_id: vehicle.vehicle_id ?? vehicle.id,
        reported_by: otherUser.user_id ?? otherUser.id,
        issue_type: "Dirty Vehicle",
        description: "Seats need cleaning.",
      });
      const issueId = issue.issue_id ?? issue.id;

      const res = await deleteIssue(app, token, issueId);

      expect(res.status).toBe(403);
      const remaining = await db.vehicleIssue.findByPk(issueId);
      expect(remaining).toBeTruthy();
    });
  });

  describe("US-13.2 — View my reported issues", () => {
    it("Requestor views their reported issues", async () => {
      const { requestor, vehicle, token } = await requestorWorld();
      const vehicleId = vehicle.vehicle_id ?? vehicle.id;
      await createIssue({
        vehicle_id: vehicleId,
        reported_by: requestor.user_id ?? requestor.id,
        issue_type: "Low Gas",
        description: "The vehicle has less than one-quarter tank of gas.",
      });

      const res = await getIssues(app, token);

      expect(res.status).toBe(200);
      const displayed = issuesList(res.body)[0];
      expect(displayed.issue_type).toBe("Low Gas");
      expect(displayed.description).toBe(
        "The vehicle has less than one-quarter tank of gas."
      );
      expect(displayed.reported_date).toBeTruthy();
      expect(displayed.status).toBe("Open");
    });
  });

  describe("US-13.3 — Edit a reported issue", () => {
    it("Requestor edits a reported issue", async () => {
      const { requestor, vehicle, token } = await requestorWorld();
      const vehicleId = vehicle.vehicle_id ?? vehicle.id;
      const issue = await createIssue({
        vehicle_id: vehicleId,
        reported_by: requestor.user_id ?? requestor.id,
        issue_type: "Low Gas",
        description: "The vehicle has less than one-quarter tank of gas.",
        status: "Open",
      });
      const issueId = issue.issue_id ?? issue.id;

      const res = await patchIssue(app, token, issueId, {
        vehicle_id: vehicleId,
        issue_type: "Dirty Vehicle",
        description: "The seats and floor need cleaning.",
      });

      expect(res.status).toBe(200);
      expect(res.body.issue.issue_type).toBe("Dirty Vehicle");
      expect(res.body.issue.description).toBe("The seats and floor need cleaning.");
      expect(res.body.issue.status).toBe("Open");
    });

    it("Requestor cannot edit another user's issue", async () => {
      const { vehicle, token } = await requestorWorld();
      const otherUser = await createUser({ role: "requestor" });
      const issue = await createIssue({
        vehicle_id: vehicle.vehicle_id ?? vehicle.id,
        reported_by: otherUser.user_id ?? otherUser.id,
        issue_type: "Dirty Vehicle",
        description: "Seats need cleaning.",
      });
      const issueId = issue.issue_id ?? issue.id;

      const res = await patchIssue(app, token, issueId, {
        vehicle_id: vehicle.vehicle_id ?? vehicle.id,
        issue_type: "Low Gas",
        description: "Changed by another user.",
      });

      expect(res.status).toBe(403);
      const remaining = await db.vehicleIssue.findByPk(issueId);
      expect(remaining.description).toBe("Seats need cleaning.");
    });
  });
});
