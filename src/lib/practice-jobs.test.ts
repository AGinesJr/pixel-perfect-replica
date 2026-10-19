import { describe, expect, it } from "vitest";
import type { Job } from "@/lib/data";
import { mapPracticeJobRow } from "./practice-jobs";

const row = {
  id: "practice-00001",
  title: "Entry-Level Operations Coordinator",
  employer: "Sample Employer",
  industry: "Logistics",
  location: "Orlando, FL",
  workplace_type: "Hybrid" as const,
  employment_type: "Full-time" as const,
  experience_level: "Entry" as const,
  salary_min: 42000,
  salary_max: 51000,
  posted_label: "Sample posting",
  summary: "Coordinate simulated daily operations.",
  responsibilities: ["Track work orders"],
  required_qualifications: ["Organization"],
  preferred_qualifications: ["Spreadsheet skills"],
  difficulty: 2,
  source_type: "simulated" as const,
};

describe("database practice-job mapping", () => {
  it("maps database column names to the Job model used by applications and interviews", () => {
    const job: Job = mapPracticeJobRow(row);
    expect(job).toEqual({
      id: row.id,
      title: row.title,
      employer: row.employer,
      industry: row.industry,
      location: row.location,
      remote: "Hybrid",
      type: "Full-time",
      level: "Entry",
      sourceType: "simulated",
      salary: [42000, 51000],
      posted: "Sample posting",
      summary: row.summary,
      responsibilities: row.responsibilities,
      required: row.required_qualifications,
      preferred: row.preferred_qualifications,
      difficulty: 2,
    });
  });

  it("keeps every database-mapped role marked as simulated", () => {
    expect(mapPracticeJobRow({ ...row, source_type: "simulated" }).sourceType).toBe("simulated");
  });
});
