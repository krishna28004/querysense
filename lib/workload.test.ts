import { describe, expect, it } from "vitest";
import { parseWorkloadCsv, rankWorkload } from "./workload";

describe("pg_stat_statements CSV import", () => {
  it("parses quoted SQL containing commas, escaped quotes, and newlines", () => {
    const report = parseWorkloadCsv('queryid,query,calls,total_exec_time,mean_exec_time,shared_blks_read\n1,"SELECT \'a,b\' AS x,\n \'c\'",3,30,10,4\n');
    expect(report.rows[0].query).toBe("SELECT 'a,b' AS x,\n 'c'");
    expect(report.totalExecTimeMs).toBe(30);
    expect(report.totalSharedBlocksRead).toBe(4);
  });

  it("ranks by selected workload metric without mutating source rows", () => {
    const report = parseWorkloadCsv("query,calls,total_exec_time,mean_exec_time,shared_blks_read\nSELECT 1,10,100,10,2\nSELECT 2,2,200,100,20\n");
    expect(rankWorkload(report.rows, "total_exec_time").map(row => row.query)).toEqual(["SELECT 2", "SELECT 1"]);
    expect(rankWorkload(report.rows, "calls").map(row => row.query)).toEqual(["SELECT 1", "SELECT 2"]);
    expect(report.rows[0].query).toBe("SELECT 1");
  });

  it("supports legacy total_time and derives missing totals with explicit warning", () => {
    const report = parseWorkloadCsv("query,calls,mean_time\nSELECT 1,5,4\n");
    expect(report.rows[0].totalExecTimeMs).toBe(20);
    expect(report.warnings.join(" ")).toMatch(/derived/);
  });

  it("rejects unsupported exports and skips invalid data rows", () => {
    expect(() => parseWorkloadCsv("query,calls\nSELECT 1,2")).toThrow(/Expected pg_stat_statements/);
    const report = parseWorkloadCsv("query,calls,total_exec_time\nSELECT 1,2,5\n,0,nope\n");
    expect(report.rows).toHaveLength(1);
    expect(report.warnings[0]).toMatch(/Skipped row/);
  });
});
