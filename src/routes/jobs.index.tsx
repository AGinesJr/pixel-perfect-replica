import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";
import { jobs, industries, type Job } from "@/lib/data";
import { JobCard } from "@/components/JobCard";
const pageSize=24;
const levels:Job["level"][]=["Entry","Junior","Mid","Senior","Lead","Manager","Director","Executive"];
const employmentTypes:Job["type"][]=["Full-time","Part-time","Contract","Temporary","Internship","Apprenticeship"];
const search=z.object({q:z.string().optional().catch(""),loc:z.string().optional().catch(""),industry:z.string().optional().catch(""),remote:z.string().optional().catch(""),level:z.string().optional().catch(""),type:z.string().optional().catch(""),sort:z.enum(["relevance","salary-desc","salary-asc","title"]).optional().catch("relevance"),page:z.coerce.number().int().min(1).optional().catch(1)});
export const Route=createFileRoute("/jobs/")({validateSearch:search,head:()=>({meta:[
{title:"Find practice jobs — Workforce Prep"},{name:"description",content:"Search 10,000+ simulated practice job listings across industries, locations, and experience levels."},
{property:"og:title",content:"Find practice jobs — Workforce Prep"},{property:"og:description",content:"Search simulated practice listings across the United States."}]}),component:Jobs});
function Jobs(){
 const s=Route.useSearch();const nav=Route.useNavigate();
 const set=(k:string,v:string)=>nav({search:(p)=>({...p,[k]:v||undefined,...(k==="page"?{}:{page:undefined})})});
 const list=useMemo(()=>{
  const q=(s.q??"").trim().toLowerCase();
  const filtered=jobs.filter(j=>{
   const searchable=(j.title+" "+j.employer+" "+j.industry+" "+j.summary+" "+j.required.join(" ")+" "+j.preferred.join(" ")+" "+j.responsibilities.join(" ")).toLowerCase();
   if(q&&!searchable.includes(q))return false;if(s.loc&&!j.location.toLowerCase().includes(s.loc.toLowerCase()))return false;
   if(s.industry&&j.industry!==s.industry)return false;if(s.remote&&j.remote!==s.remote)return false;
   if(s.level&&j.level!==s.level)return false;if(s.type&&j.type!==s.type)return false;return true;
  });
  if(s.sort==="salary-desc")filtered.sort((a,b)=>b.salary[1]-a.salary[1]);else if(s.sort==="salary-asc")filtered.sort((a,b)=>a.salary[0]-b.salary[0]);else if(s.sort==="title")filtered.sort((a,b)=>a.title.localeCompare(b.title));
  return filtered;
 },[s.q,s.loc,s.industry,s.remote,s.level,s.type,s.sort]);
 const totalPages=Math.max(1,Math.ceil(list.length/pageSize));const page=Math.min(s.page??1,totalPages);const pageJobs=list.slice((page-1)*pageSize,page*pageSize);
 const sel="h-10 rounded-md border bg-card px-3 text-sm";const goToPage=(next:number)=>nav({search:p=>({...p,page:next>1?next:undefined})});
 return <div className="mx-auto max-w-6xl px-4 py-8">
  <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-bold">Practice jobs</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Explore fictional job scenarios across industries and career levels. These are simulated postings, not verified live vacancies.</p></div><span className="rounded-md border bg-muted px-3 py-2 text-sm font-semibold">{jobs.length.toLocaleString()} practice listings</span></div>
  <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
   <input value={s.q??""} onChange={e=>set("q",e.target.value)} placeholder="Job title, skill, company, or keyword" aria-label="Search jobs" className={sel+" min-w-0"}/>
   <input value={s.loc??""} onChange={e=>set("loc",e.target.value)} placeholder="City or state" aria-label="Filter by location" className={sel}/>
   <select value={s.industry??""} onChange={e=>set("industry",e.target.value)} aria-label="Filter by industry" className={sel}><option value="">All {industries.length} industries</option>{industries.map(i=><option key={i} value={i}>{i}</option>)}</select>
   <select value={s.level??""} onChange={e=>set("level",e.target.value)} aria-label="Filter by experience level" className={sel}><option value="">All experience levels</option>{levels.map(l=><option key={l} value={l}>{l} level</option>)}</select>
   <select value={s.remote??""} onChange={e=>set("remote",e.target.value)} aria-label="Filter by work arrangement" className={sel}><option value="">Any work arrangement</option><option value="Remote">Remote</option><option value="Hybrid">Hybrid</option><option value="On-site">On-site</option></select>
   <select value={s.type??""} onChange={e=>set("type",e.target.value)} aria-label="Filter by employment type" className={sel}><option value="">Any employment type</option>{employmentTypes.map(t=><option key={t} value={t}>{t}</option>)}</select>
   <select value={s.sort??"relevance"} onChange={e=>set("sort",e.target.value)} aria-label="Sort jobs" className={sel}><option value="relevance">Default order</option><option value="salary-desc">Highest salary</option><option value="salary-asc">Lowest salary</option><option value="title">Job title A–Z</option></select>
   <button type="button" onClick={()=>nav({search:{}})} className={sel+" font-medium hover:bg-muted"}>Clear filters</button>
  </div>
  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground" aria-live="polite"><p>{list.length.toLocaleString()} matching simulated listings · showing {list.length?(page-1)*pageSize+1:0}–{Math.min(page*pageSize,list.length)}</p><p>Page {page} of {totalPages}</p></div>
  {pageJobs.length?<div className="mt-4 grid gap-4 md:grid-cols-2">{pageJobs.map(j=><JobCard key={j.id} job={j}/>)}</div>:<div className="mt-8 rounded-lg border border-dashed p-10 text-center"><h2 className="font-semibold">No practice jobs match those filters</h2><p className="mt-1 text-sm text-muted-foreground">Try a broader keyword, another location, or clear some filters.</p><button type="button" onClick={()=>nav({search:{}})} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Clear filters</button></div>}
  {totalPages>1&&<nav aria-label="Job results pages" className="mt-8 flex items-center justify-center gap-3"><button type="button" disabled={page<=1} onClick={()=>goToPage(page-1)} className="rounded-md border px-4 py-2 text-sm font-semibold disabled:opacity-40">Previous</button><span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span><button type="button" disabled={page>=totalPages} onClick={()=>goToPage(page+1)} className="rounded-md border px-4 py-2 text-sm font-semibold disabled:opacity-40">Next</button></nav>}
 </div>;
}
