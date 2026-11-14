import { describe, expect, it } from "vitest";
import { canDeleteItems, canManageUsers, canReview, defaultAccessFor, initialStatus } from "@/lib/permissions";

describe("roles and permissions", () => {
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
