import { describe, expect, it } from "vitest";
import { canDownload, normalizeArabic, searchItems } from "@/data/repository";

describe("access rules", () => {
  it("open items download for everyone", () => expect(canDownload("open", false)).toBe(true));
  it("restricted items need sign-in", () => {
    expect(canDownload("restricted", false)).toBe(false);
    expect(canDownload("restricted", true)).toBe(true);
  });
  it("metadata-only never downloads", () => expect(canDownload("metadata", true)).toBe(false));
});

describe("arabic search", () => {
  it("ignores diacritics and hamza/ta-marbuta forms", () => {
    expect(normalizeArabic("أَلْفِيَّة")).toBe(normalizeArabic("الفيه"));
  });
  it("finds by author name", () => {
    expect(searchItems({ q: "البارودى", field: "all" }).map((x) => x.id)).toContain("AZ-SHK-0002");
  });
});
