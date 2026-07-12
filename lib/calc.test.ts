import { describe, it, expect } from "vitest";
import {
  normalizeExpenseType,
  toNumber,
  computeFuelEfficiency,
  computeRoi,
} from "./calc";

describe("normalizeExpenseType", () => {
  it("accepts canonical casing", () => {
    expect(normalizeExpenseType("Maintenance")).toBe("Maintenance");
    expect(normalizeExpenseType("Toll")).toBe("Toll");
    expect(normalizeExpenseType("Other")).toBe("Other");
  });

  it("is case-insensitive and canonicalises (regression: the ROI casing bug)", () => {
    // Frontend sends "Maintenance"; an earlier bug filtered lowercase and lost it.
    expect(normalizeExpenseType("maintenance")).toBe("Maintenance");
    expect(normalizeExpenseType("MAINTENANCE")).toBe("Maintenance");
    expect(normalizeExpenseType("toll")).toBe("Toll");
  });

  it("rejects unknown or non-string values", () => {
    expect(normalizeExpenseType("fuel")).toBeNull();
    expect(normalizeExpenseType("")).toBeNull();
    expect(normalizeExpenseType(undefined)).toBeNull();
    expect(normalizeExpenseType(42)).toBeNull();
  });
});

describe("toNumber", () => {
  it("treats null/undefined (empty _sum) as 0", () => {
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
  });
  it("passes numbers through and coerces Decimal-like values", () => {
    expect(toNumber(510)).toBe(510);
    expect(toNumber({ valueOf: () => 450 })).toBe(450); // Prisma.Decimal-like
  });
});

describe("computeFuelEfficiency", () => {
  it("computes distance / litres", () => {
    expect(computeFuelEfficiency(620, 50)).toBe(12.4);
    expect(computeFuelEfficiency(1500, 300)).toBe(5);
  });
  it("returns null when litres is 0 (no divide-by-zero)", () => {
    expect(computeFuelEfficiency(0, 0)).toBeNull();
    expect(computeFuelEfficiency(100, 0)).toBeNull();
  });
});

describe("computeRoi", () => {
  it("computes netProfit / acquisitionCost", () => {
    expect(computeRoi(1114.5, 35000)).toBeCloseTo(0.031843, 6);
  });
  it("supports negative ROI (a loss-making vehicle)", () => {
    expect(computeRoi(-450, 40000)).toBeCloseTo(-0.01125, 6);
  });
  it("returns null when acquisitionCost is 0 (no divide-by-zero)", () => {
    expect(computeRoi(1000, 0)).toBeNull();
  });
});
