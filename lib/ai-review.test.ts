import { describe, expect, it } from "vitest";
import { parseAIReview } from "./ai-review";

const good = { title: "Test a candidate index", rationale: "The supplied scan removes many rows and may benefit from another access path.", evidenceId: "scan-1", experiment: "Create the index in staging and compare repeated EXPLAIN ANALYZE runs.", caveat: "Existing indexes and write costs are unknown." };

describe("AI output boundary", () => {
  it("keeps only hypotheses citing supplied evidence", () => {
    const review = parseAIReview(JSON.stringify({ hypotheses: [good, { ...good, evidenceId: "invented" }] }), ["scan-1"], "test-model");
    expect(review.hypotheses).toHaveLength(1);
    expect(review.hypotheses[0].evidenceId).toBe("scan-1");
  });
  it("rejects malformed and overlong model output", () => {
    expect(() => parseAIReview("not-json", ["scan-1"], "test-model")).toThrow();
    expect(() => parseAIReview(JSON.stringify({ hypotheses: Array(4).fill(good) }), ["scan-1"], "test-model")).toThrow();
  });
});
