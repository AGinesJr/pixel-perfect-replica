import { employers, type Job } from "./data";

export const jobPayload = (j: Job) => ({
  title: j.title, employer: j.employer, level: j.level, summary: j.summary,
  responsibilities: j.responsibilities, required: j.required, preferred: j.preferred,
  difficulty: j.difficulty, culture: employers[j.employer].culture,
});
