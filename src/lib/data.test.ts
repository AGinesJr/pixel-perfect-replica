import { describe, expect, it } from "vitest";
import { curatedJobs, generatePracticeJobs, industries, jobs } from "./data";
describe("simulated practice job catalog",()=>{
 it("ships 10,000 generated listings plus curated examples",()=>{expect(generatePracticeJobs(10000)).toHaveLength(10000);expect(jobs.length).toBe(10000+curatedJobs.length);});
 it("has unique IDs, many industries and distinct titles",()=>{const rows=generatePracticeJobs(10000);expect(new Set(rows.map(j=>j.id)).size).toBe(rows.length);expect(new Set(rows.map(j=>j.industry)).size).toBeGreaterThanOrEqual(20);expect(new Set(rows.map(j=>j.title)).size).toBeGreaterThan(100);expect(industries.length).toBeGreaterThanOrEqual(20);});
 it("covers all career levels and US locations",()=>{const rows=generatePracticeJobs(10000);const found=new Set(rows.map(j=>j.level));for(const l of ["Entry","Junior","Mid","Senior","Lead","Manager","Director","Executive"])expect(found.has(l as (typeof rows)[number]["level"])).toBe(true);expect(rows.every(j=>j.location.endsWith(", US")||/, [A-Z]{2}$/.test(j.location))).toBe(true);});
 it("labels generated records simulated and validates salaries/details",()=>{for(const j of generatePracticeJobs(250)){expect(j.sourceType).toBe("simulated");expect(j.posted).toBe("Sample posting");expect(j.salary[0]).toBeGreaterThan(0);expect(j.salary[1]).toBeGreaterThanOrEqual(j.salary[0]);expect(j.required.length).toBeGreaterThan(0);expect(j.responsibilities.length).toBeGreaterThan(0);}});
 it("is deterministic and supports empty/small slices",()=>{expect(generatePracticeJobs(0)).toEqual([]);expect(generatePracticeJobs(3).map(j=>j.id)).toEqual(["practice-00001","practice-00002","practice-00003"]);expect(generatePracticeJobs(3)).toEqual(generatePracticeJobs(3));});
});
