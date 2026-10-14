#!/usr/bin/env bun
/** Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the local shell. Apply the catalog migration first. Never commit or expose the service-role key. */
import { createClient } from "@supabase/supabase-js";
import { jobs } from "../src/lib/data";
const url=process.env.SUPABASE_URL;const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key)throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.");
const client=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});const batchSize=250;
const rows=jobs.map(j=>({id:j.id,title:j.title,employer:j.employer,industry:j.industry,location:j.location,country_code:"US",workplace_type:j.remote,employment_type:j.type,experience_level:j.level,salary_min:j.salary[0],salary_max:j.salary[1],posted_label:"Sample posting",summary:j.summary,responsibilities:j.responsibilities,required_qualifications:j.required,preferred_qualifications:j.preferred,difficulty:j.difficulty,source_type:"simulated",is_active:true}));
for(let offset=0;offset<rows.length;offset+=batchSize){const batch=rows.slice(offset,offset+batchSize);const {error}=await client.from("practice_jobs").upsert(batch,{onConflict:"id"});if(error)throw new Error("Seed failed at rows "+(offset+1)+"-"+(offset+batch.length)+": "+error.message);console.log("Seeded "+Math.min(offset+batch.length,rows.length)+" / "+rows.length);}
console.log("Done. "+rows.length+" simulated practice jobs are available in public.practice_jobs.");
