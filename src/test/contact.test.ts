import { describe, expect, it } from "vitest";
import { validContactMessage } from "@/lib/contact";

describe("contact message bounds", () => {
  it("requires a name and a bounded message", () => {
    expect(validContactMessage("أحمد", "طلب مراجعة حقوق النشر")).toBe(true);
    expect(validContactMessage(" ", "طلب مراجعة حقوق النشر")).toBe(false);
    expect(validContactMessage("أحمد", "قصيرة")).toBe(false);
    expect(validContactMessage("أحمد", "أ".repeat(5001))).toBe(false);
    expect(validContactMessage("أ".repeat(201), "طلب مراجعة حقوق النشر")).toBe(false);
  });
});