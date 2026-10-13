import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MODEL = "openai/gpt-6-astra";

async function callAI(instructions: string, input: string, schemaName: string, schema: object) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured.");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      instructions,
      input,
      text: { format: { type: "json_schema", name: schemaName, strict: true, schema } },
    }),
  });
  if (!res.ok || !res.body) {
    const t = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("The AI is busy right now. Please try again in a minute.");
    if (res.status === 402) throw new Error("AI credits have run out for this workspace.");
    throw new Error(`AI request failed (${res.status}). ${t.slice(0, 200)}`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let out = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const d = line.slice(5).trim();
      if (!d || d === "[DONE]") continue;
      try {
        const ev = JSON.parse(d);
        if (ev.type === "response.output_text.delta") out += ev.delta;
        if (ev.type === "error" || ev.type === "response.failed") throw new Error("AI response failed.");
      } catch (e) {
        if (e instanceof Error && e.message === "AI response failed.") throw e;
      }
    }
  }
  if (!out) throw new Error("The AI returned no answer.");
  return JSON.parse(out);
}

const strArr = { type: "array", items: { type: "string" } };

const jobInput = z.object({
  title: z.string(), employer: z.string(), level: z.string(), summary: z.string(),
  responsibilities: z.array(z.string()), required: z.array(z.string()), preferred: z.array(z.string()),
  difficulty: z.number(), culture: z.string(),
});

export const evaluateApplication = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ job: jobInput, resume: z.string().min(20).max(15000), coverLetter: z.string().max(5000) }).parse(d),
  )
  .handler(async ({ data }) => {
    const schema = {
      type: "object", additionalProperties: false,
      required: ["decision", "score", "summary", "strengths", "gaps", "criteria"],
      properties: {
        decision: { type: "string", enum: ["interview", "more_info", "reject"] },
        score: { type: "integer" },
        summary: { type: "string" },
        strengths: strArr, gaps: strArr,
        criteria: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "score", "note"], properties: { name: { type: "string" }, score: { type: "integer" }, note: { type: "string" } } } },
      },
    };
    return callAI(
      `You are a fair, realistic recruiter screening applications in a career practice simulator. Score 0-100 using only evidence in the resume and cover letter. Never consider or infer age, race, gender, disability, religion, or other protected traits. Criteria: Required qualifications (40%), Relevant experience (25%), Preferred qualifications (15%), Communication quality (10%), Role fit/motivation (10%). Return those 5 criteria with 0-100 scores and a one-sentence evidence-based note. Strictness ${data.job.difficulty}/5: interview threshold = ${55 + data.job.difficulty * 5}; between threshold-15 and threshold choose "more_info"; below that "reject". Summary is 2-3 sentences written to the candidate. Strengths and gaps: 2-4 specific items each.`,
      `JOB: ${JSON.stringify(data.job)}\n\nRESUME:\n${data.resume}\n\nCOVER LETTER:\n${data.coverLetter || "(none)"}`,
      "evaluation", schema,
    );
  });

const msg = z.object({ role: z.enum(["interviewer", "candidate"]), text: z.string().max(4000) });

export const interviewTurn = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ job: jobInput, resume: z.string().max(15000), history: z.array(msg).max(40) }).parse(d))
  .handler(async ({ data }) => {
    const asked = data.history.filter((m) => m.role === "interviewer").length;
    const schema = { type: "object", additionalProperties: false, required: ["question", "done"], properties: { question: { type: "string" }, done: { type: "boolean" } } };
    return callAI(
      `You are a professional hiring manager at ${data.job.employer} interviewing for ${data.job.title}. Company culture: ${data.job.culture}. Ask ONE question at a time, mixing behavioral, situational and role-specific questions; follow up briefly on vague answers. Keep it under 60 words, warm but professional. Plan 5 questions total. You have asked ${asked}. If ${asked} >= 5, set done=true and give a short closing thank-you as the question. Never ask about protected characteristics.`,
      `JOB: ${JSON.stringify(data.job)}\nRESUME: ${data.resume.slice(0, 4000)}\nTRANSCRIPT:\n${data.history.map((m) => `${m.role}: ${m.text}`).join("\n") || "(start — greet and ask the first question)"}`,
      "turn", schema,
    );
  });

export const interviewFeedback = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ job: jobInput, history: z.array(msg).max(40) }).parse(d))
  .handler(async ({ data }) => {
    const schema = {
      type: "object", additionalProperties: false, required: ["overall", "summary", "scores", "improvements"],
      properties: {
        overall: { type: "integer" }, summary: { type: "string" }, improvements: strArr,
        scores: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "score", "evidence"], properties: { name: { type: "string" }, score: { type: "integer" }, evidence: { type: "string" } } } },
      },
    };
    return callAI(
      `You are an interview coach. Score the candidate's answers 0-100 on: Relevance, Structure (STAR), Specificity & evidence, Role knowledge, Communication. For each, quote or paraphrase the candidate's own words as evidence. Overall is the average. Summary 2-3 sentences to the candidate. Give 3-5 concrete improvement actions forming a practice plan.`,
      `JOB: ${data.job.title} at ${data.job.employer}\nTRANSCRIPT:\n${data.history.map((m) => `${m.role}: ${m.text}`).join("\n")}`,
      "feedback", schema,
    );
  });
