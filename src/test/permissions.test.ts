import { describe, expect, it } from "vitest";
import { canDeleteItems, canEditItem, canManageUsers, canReview, canRemoveAdmin, defaultAccessFor, editedStatus, initialStatus } from "@/lib/permissions";

describe("roles and permissions", () => {
  it("member edits return revision records to pending review", () => {
    expect(editedStatus(["user"], "revision")).toBe("pending");
    expect(editedStatus(["user"], "pending")).toBe("pending");
  });
  it("staff edits retain the existing review status", () => {
    expect(editedStatus(["moderator"], "approved")).toBe("approved");
    expect(editedStatus(["admin"], "revision")).toBe("revision");
    expect(editedStatus(["admin"], "rejected")).toBe("rejected");
  });
  it("owners edit and resubmit only their pending or revision items", () => {
    expect(canEditItem(["user"], "owner", "owner", "revision")).toBe(true);
    expect(canEditItem(["user"], "owner", "owner", "pending")).toBe(true);
    expect(canEditItem(["user"], "other", "owner", "pending")).toBe(false);
    expect(canEditItem(["user"], "owner", "owner", "approved")).toBe(false);
    expect(canEditItem(["user"], "owner", "owner", "rejected")).toBe(false);
    expect(canEditItem(["admin"], undefined, "owner", "pending")).toBe(false);
  });
  it("staff can edit published records", () => {
    expect(canEditItem(["moderator"], "staff", "owner", "approved")).toBe(true);
    expect(canEditItem(["admin"], "staff", "owner", "rejected")).toBe(true);
  });
  it("keeps the last administrator and allows a handover after adding another", () => {
    expect(canRemoveAdmin(1)).toBe(false);
    expect(canRemoveAdmin(2)).toBe(true);
  });
  it("only admins manage users and delete items", () => {
    expect(canManageUsers(["admin", "user"])).toBe(true);
    expect(canManageUsers(["moderator", "user"])).toBe(false);
    expect(canDeleteItems(["moderator"])).toBe(false);
  });
  it("admins and moderators review submissions, members do not", () => {
    expect(canReview(["moderator", "user"])).toBe(true);
    expect(canReview(["admin"])).toBe(true);
    expect(canReview(["user"])).toBe(false);
  });
  it("member submissions wait for review before publishing", () => {
    expect(initialStatus(["user"])).toBe("pending");
    expect(initialStatus(["moderator", "user"])).toBe("approved");
  });
  it("theses are metadata-only by default", () => {
    expect(defaultAccessFor("theses")).toBe("metadata");
    expect(defaultAccessFor("books")).toBe("restricted");
  });
});
