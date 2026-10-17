import { describe, expect, it } from "vitest";
import { getVelocityCursorScale } from "./VelocityCursor";

describe("velocity cursor response", () => {
  it("stays at rest size during ordinary movement", () => {
    expect(getVelocityCursorScale(0.8, 1)).toBe(1);
    expect(getVelocityCursorScale(1.28, 1)).toBe(1);
  });

  it("requires both high speed and sustained rapid movement", () => {
    expect(getVelocityCursorScale(2.4, 0.4)).toBe(1);
    expect(getVelocityCursorScale(1.1, 0.9)).toBe(1);
    expect(getVelocityCursorScale(2.4, 0.8)).toBeGreaterThan(1);
  });

  it("caps the scale increase for very fast movement", () => {
    expect(getVelocityCursorScale(10, 1)).toBe(1.44);
  });
});
