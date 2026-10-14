export type Job = {
  id: string;
  title: string;
  employer: string;
  industry: string;
  location: string;
  remote: "Remote" | "Hybrid" | "On-site";
  type: "Full-time" | "Part-time" | "Contract" | "Temporary" | "Internship" | "Apprenticeship";
  level: "Entry" | "Junior" | "Mid" | "Senior" | "Lead" | "Manager" | "Director" | "Executive";
  sourceType?: "simulated";
  salary: [number, number];
  posted: string;
  summary: string;
  responsibilities: string[];
  required: string[];
  preferred: string[];
  difficulty: number; // 1-5, recruiter strictness
};

export type Employer = { name: string; tagline: string; size: string; hq: string; culture: string };

export const employers: Record<string, Employer> = {
  "Northwind Health": { name: "Northwind Health", tagline: "Community hospitals across the Midwest", size: "5,000–10,000", hq: "Columbus, OH", culture: "Patient-first, structured, values reliability and compassion." },
  "Lumen Analytics": { name: "Lumen Analytics", tagline: "Data platforms for retailers", size: "200–500", hq: "Austin, TX", culture: "Fast-moving, metrics-driven, rewards ownership." },
  "Harbor & Pine": { name: "Harbor & Pine", tagline: "Regional grocery and logistics", size: "1,000–5,000", hq: "Portland, OR", culture: "Hands-on, team-oriented, promotes from within." },
  "Civic Ledger": { name: "Civic Ledger", tagline: "Accounting for public agencies", size: "50–200", hq: "Washington, DC", culture: "Precise, ethical, detail-oriented." },
  "Brightpath Schools": { name: "Brightpath Schools", tagline: "K-12 charter network", size: "500–1,000", hq: "Atlanta, GA", culture: "Mission-driven, collaborative, growth-focused." },
  "Forge Robotics": { name: "Forge Robotics", tagline: "Industrial automation", size: "500–1,000", hq: "Pittsburgh, PA", culture: "Engineering-led, curious, safety-conscious." },
};

export const curatedJobs: Job[] = [
  { id: "rn-med-surg", title: "Registered Nurse, Med-Surg", employer: "Northwind Health", industry: "Healthcare", location: "Columbus, OH", remote: "On-site", type: "Full-time", level: "Mid", salary: [72000, 91000], posted: "2 days ago", summary: "Provide direct patient care on a 32-bed medical-surgical unit with a supportive charge nurse team.", responsibilities: ["Assess, plan and document care for 4–5 patients per shift", "Administer medications and monitor responses", "Coordinate with physicians and case managers", "Educate patients and families on discharge plans"], required: ["Active RN license", "BLS certification", "1+ year acute care experience"], preferred: ["BSN", "EHR (Epic) experience", "ACLS"], difficulty: 3 },
  { id: "data-analyst", title: "Data Analyst", employer: "Lumen Analytics", industry: "Technology", location: "Austin, TX", remote: "Hybrid", type: "Full-time", level: "Entry", salary: [62000, 78000], posted: "1 day ago", summary: "Turn retail sales data into dashboards and insights that client teams use every week.", responsibilities: ["Write SQL to clean and join datasets", "Build dashboards in Looker or Tableau", "Present findings to account managers", "Automate recurring reports"], required: ["SQL", "Excel or Google Sheets", "Clear written communication"], preferred: ["Python", "Tableau/Looker", "Retail or e-commerce data"], difficulty: 3 },
  { id: "sr-software-eng", title: "Senior Software Engineer, Platform", employer: "Lumen Analytics", industry: "Technology", location: "Remote, US", remote: "Remote", type: "Full-time", level: "Senior", salary: [150000, 185000], posted: "5 days ago", summary: "Lead design of the ingestion platform that processes billions of events per day.", responsibilities: ["Design distributed data pipelines", "Mentor mid-level engineers", "Own reliability and on-call improvements", "Partner with product on roadmap"], required: ["6+ years backend engineering", "Distributed systems", "TypeScript, Go or Java"], preferred: ["Kafka", "Kubernetes", "Tech lead experience"], difficulty: 5 },
  { id: "store-manager", title: "Assistant Store Manager", employer: "Harbor & Pine", industry: "Retail", location: "Portland, OR", remote: "On-site", type: "Full-time", level: "Mid", salary: [52000, 61000], posted: "3 days ago", summary: "Help run a high-volume grocery store: staffing, inventory and customer experience.", responsibilities: ["Schedule and coach a team of 40", "Manage inventory and shrink", "Resolve customer escalations", "Hit weekly sales targets"], required: ["2+ years retail supervision", "Scheduling experience", "Weekend availability"], preferred: ["Grocery experience", "P&L exposure", "Bilingual English/Spanish"], difficulty: 2 },
  { id: "warehouse-lead", title: "Warehouse Shift Lead", employer: "Harbor & Pine", industry: "Logistics", location: "Tacoma, WA", remote: "On-site", type: "Full-time", level: "Entry", salary: [44000, 50000], posted: "Today", summary: "Lead a night shift team picking and loading orders for 60 stores.", responsibilities: ["Run shift start-up meetings", "Track pick rates and accuracy", "Enforce safety procedures", "Train new associates"], required: ["1+ year warehouse experience", "Forklift certification or willingness to certify", "Reliable attendance"], preferred: ["WMS experience", "Prior lead role"], difficulty: 2 },
  { id: "staff-accountant", title: "Staff Accountant", employer: "Civic Ledger", industry: "Finance", location: "Washington, DC", remote: "Hybrid", type: "Full-time", level: "Entry", salary: [60000, 72000], posted: "4 days ago", summary: "Support month-end close and audits for municipal clients.", responsibilities: ["Prepare journal entries and reconciliations", "Support external audit requests", "Maintain fixed-asset schedules", "Document processes"], required: ["Bachelor's in Accounting", "GAAP knowledge", "Excel proficiency"], preferred: ["GASB exposure", "CPA track", "ERP systems"], difficulty: 4 },
  { id: "teacher-math", title: "Middle School Math Teacher", employer: "Brightpath Schools", industry: "Education", location: "Atlanta, GA", remote: "On-site", type: "Full-time", level: "Entry", salary: [50000, 58000], posted: "1 week ago", summary: "Teach 7th-grade math with a data-informed, student-centered approach.", responsibilities: ["Plan and deliver daily lessons", "Use assessment data to differentiate", "Communicate with families", "Collaborate in grade-level teams"], required: ["Bachelor's degree", "Teaching certification or alternative pathway", "Classroom management skills"], preferred: ["Math content major", "Experience in urban schools"], difficulty: 3 },
  { id: "robotics-tech", title: "Robotics Maintenance Technician", employer: "Forge Robotics", industry: "Manufacturing", location: "Pittsburgh, PA", remote: "On-site", type: "Full-time", level: "Mid", salary: [58000, 70000], posted: "2 days ago", summary: "Keep customer robotic cells running through preventive maintenance and troubleshooting.", responsibilities: ["Diagnose electrical and mechanical faults", "Perform preventive maintenance", "Document repairs", "Train customer operators"], required: ["Associate degree or trade certificate", "PLC basics", "Electrical troubleshooting"], preferred: ["FANUC or ABB robots", "OSHA 10"], difficulty: 3 },
  { id: "customer-success", title: "Customer Success Specialist", employer: "Lumen Analytics", industry: "Technology", location: "Remote, US", remote: "Remote", type: "Full-time", level: "Entry", salary: [52000, 64000], posted: "Today", summary: "Help retail clients adopt our platform and get value from their data.", responsibilities: ["Onboard new accounts", "Answer product questions", "Track health scores", "Gather feedback for product"], required: ["1+ year customer-facing experience", "Strong communication", "Comfort with software"], preferred: ["SaaS experience", "CRM tools"], difficulty: 2 },
  { id: "medical-assistant", title: "Medical Assistant", employer: "Northwind Health", industry: "Healthcare", location: "Dayton, OH", remote: "On-site", type: "Part-time", level: "Entry", salary: [36000, 42000], posted: "6 days ago", summary: "Support a busy family medicine clinic with intake and clinical tasks.", responsibilities: ["Room patients and take vitals", "Update records", "Assist with procedures", "Schedule follow-ups"], required: ["MA certificate", "CPR"], preferred: ["Phlebotomy", "Bilingual"], difficulty: 1 },
];


type OccupationFamily = { industry: string; roles: [string, string, string, string]; focus: string; skills: [string, string, string, string]; baseSalary: number };
const occupationFamilies: OccupationFamily[] = [
{industry:"Healthcare",roles:["Medical Assistant","Patient Access Representative","Clinical Research Coordinator","Healthcare Operations Analyst"],focus:"support safe patient care and reliable health services",skills:["patient communication","medical terminology","privacy and documentation","electronic health records"],baseSalary:48000},
{industry:"Technology",roles:["IT Support Specialist","Software Developer","Data Analyst","Cybersecurity Analyst"],focus:"deliver dependable digital services and solve technical problems",skills:["technical troubleshooting","documentation","data analysis","security fundamentals"],baseSalary:92000},
{industry:"Information Technology",roles:["Systems Administrator","Cloud Operations Engineer","QA Test Analyst","Network Technician"],focus:"maintain secure, reliable systems",skills:["systems troubleshooting","network fundamentals","incident response","technical documentation"],baseSalary:88000},
{industry:"Logistics",roles:["Warehouse Associate","Dispatch Coordinator","Inventory Analyst","Logistics Operations Manager"],focus:"move goods accurately, safely, and on schedule",skills:["inventory control","safety procedures","scheduling","warehouse systems"],baseSalary:56000},
{industry:"Transportation",roles:["Delivery Driver","Fleet Coordinator","Transportation Planner","Fleet Safety Manager"],focus:"coordinate safe and efficient transportation",skills:["route planning","safety compliance","customer communication","fleet systems"],baseSalary:61000},
{industry:"Retail",roles:["Retail Sales Associate","Customer Experience Specialist","Merchandising Analyst","Store Operations Manager"],focus:"help customers and meet store goals",skills:["customer service","point-of-sale systems","inventory accuracy","sales reporting"],baseSalary:52000},
{industry:"Finance",roles:["Banking Services Representative","Loan Processing Specialist","Financial Analyst","Risk and Compliance Manager"],focus:"deliver accurate financial services and manage risk",skills:["financial documentation","spreadsheet analysis","attention to detail","regulatory awareness"],baseSalary:82000},
{industry:"Accounting",roles:["Accounting Clerk","Payroll Specialist","Staff Accountant","Controller"],focus:"maintain accurate financial records and timely reporting",skills:["reconciliations","Excel","accounting principles","internal controls"],baseSalary:74000},
{industry:"Education",roles:["Teacher Assistant","Student Services Coordinator","Instructional Designer","School Operations Director"],focus:"support learning outcomes and school operations",skills:["communication","program planning","record keeping","inclusive learning practices"],baseSalary:59000},
{industry:"Construction",roles:["Construction Laborer","Site Coordinator","Construction Estimator","Construction Project Manager"],focus:"deliver safe projects within scope and schedule",skills:["jobsite safety","blueprint reading","scheduling","cost tracking"],baseSalary:76000},
{industry:"Skilled Trades",roles:["Electrical Apprentice","HVAC Technician","Maintenance Mechanic","Field Service Manager"],focus:"install and maintain equipment safely",skills:["tool safety","diagnostics","preventive maintenance","technical reporting"],baseSalary:72000},
{industry:"Manufacturing",roles:["Production Associate","Quality Technician","Process Improvement Analyst","Plant Operations Manager"],focus:"improve production quality and safety",skills:["standard work","quality checks","root-cause analysis","lean operations"],baseSalary:68000},
{industry:"Hospitality",roles:["Guest Services Agent","Reservations Coordinator","Event Operations Specialist","Hotel General Manager"],focus:"deliver dependable guest experiences",skills:["guest relations","reservation systems","conflict resolution","staff scheduling"],baseSalary:54000},
{industry:"Food Service",roles:["Food Service Worker","Shift Supervisor","Catering Coordinator","Restaurant General Manager"],focus:"maintain food safety and efficient service",skills:["food safety","service recovery","team coordination","cost control"],baseSalary:50000},
{industry:"Human Resources",roles:["HR Assistant","Recruiting Coordinator","People Operations Analyst","HR Director"],focus:"support fair hiring and employee services",skills:["confidential records","interview scheduling","HR systems","employment policy basics"],baseSalary:79000},
{industry:"Marketing",roles:["Marketing Assistant","Social Media Coordinator","Campaign Analyst","Marketing Director"],focus:"plan campaigns and measure marketing outcomes",skills:["copywriting","campaign coordination","analytics","brand consistency"],baseSalary:81000},
{industry:"Media and Communications",roles:["Communications Assistant","Content Producer","Public Relations Specialist","Communications Director"],focus:"create accurate audience-appropriate content",skills:["writing","editing","content planning","stakeholder communication"],baseSalary:76000},
{industry:"Real Estate",roles:["Leasing Consultant","Transaction Coordinator","Property Analyst","Real Estate Operations Director"],focus:"support property transactions and portfolio operations",skills:["customer service","document management","market research","lease administration"],baseSalary:72000},
{industry:"Property Management",roles:["Resident Services Coordinator","Assistant Property Manager","Property Accountant","Regional Property Manager"],focus:"maintain properties and coordinate residents and vendors",skills:["work-order coordination","lease knowledge","vendor management","budget tracking"],baseSalary:74000},
{industry:"Legal Services",roles:["Legal Administrative Assistant","Paralegal","Contracts Analyst","Legal Operations Director"],focus:"support accurate casework and compliant legal operations",skills:["legal research","document preparation","confidentiality","deadline management"],baseSalary:86000},
{industry:"Insurance",roles:["Claims Support Representative","Insurance Service Agent","Underwriting Analyst","Claims Operations Manager"],focus:"support policyholders and evaluate risk consistently",skills:["case documentation","customer communication","risk assessment","policy interpretation"],baseSalary:78000},
{industry:"Energy and Utilities",roles:["Utility Field Assistant","Energy Operations Technician","Energy Data Analyst","Utility Operations Director"],focus:"support reliable infrastructure and safe energy services",skills:["safety compliance","equipment monitoring","data reporting","incident coordination"],baseSalary:85000},
{industry:"Agriculture",roles:["Farm Operations Assistant","Agricultural Equipment Technician","Crop Production Analyst","Agricultural Operations Manager"],focus:"coordinate production and resource-efficient operations",skills:["equipment safety","production records","quality monitoring","seasonal planning"],baseSalary:61000},
{industry:"Science and Research",roles:["Laboratory Assistant","Research Technician","Research Data Analyst","Research Program Director"],focus:"support reproducible research and safe lab operations",skills:["lab safety","data integrity","protocol adherence","technical reporting"],baseSalary:83000},
{industry:"Public Administration",roles:["Administrative Services Assistant","Program Coordinator","Policy Analyst","Public Services Director"],focus:"deliver accessible public services and accountable programs",skills:["public communication","records management","program evaluation","policy research"],baseSalary:76000}
];
const usLocations = ["New York, NY","Los Angeles, CA","Chicago, IL","Houston, TX","Phoenix, AZ","Philadelphia, PA","San Antonio, TX","San Diego, CA","Dallas, TX","Jacksonville, FL","Austin, TX","Fort Worth, TX","San Jose, CA","Columbus, OH","Charlotte, NC","Indianapolis, IN","San Francisco, CA","Seattle, WA","Denver, CO","Washington, DC","Nashville, TN","Oklahoma City, OK","El Paso, TX","Boston, MA","Portland, OR","Las Vegas, NV","Detroit, MI","Memphis, TN","Louisville, KY","Baltimore, MD","Milwaukee, WI","Albuquerque, NM","Tucson, AZ","Fresno, CA","Sacramento, CA","Mesa, AZ","Kansas City, MO","Atlanta, GA","Omaha, NE","Colorado Springs, CO","Raleigh, NC","Miami, FL","Tampa, FL","Orlando, FL","Minneapolis, MN","Cleveland, OH","Pittsburgh, PA","Cincinnati, OH","St. Louis, MO","Remote, US"];
const employers = ["Cedarline Group","Summit Harbor","Bluepeak Services","Redwood Works","Northstar Partners","Clearwater Collective","Pioneer Ridge","Everwell Systems","Oakstone Industries","Brightfield Group","Silverpath Solutions","Meridian Works","Crestview Partners","Juniper Bay","Ironwood Services","Westbridge Group","Lakeshore Collective","Atlas Grove","Fieldstone Partners","Sunrise Meridian","Mapleline Services","Granite Harbor","Evergreen Ridge","Cobalt River","Goldenpath Group","Highland Beacon","Parkview Systems","Bluehaven Partners","Northwind Collective","Redcliff Works"];
const levels: Job["level"][] = ["Entry","Junior","Mid","Senior","Lead","Manager","Director","Executive"];
const multipliers: Record<Job["level"],number> = {Entry:0.62,Junior:0.78,Mid:1,Senior:1.3,Lead:1.48,Manager:1.68,Director:2.05,Executive:2.7};
const titleFor: Record<Job["level"],(role:string)=>string> = {Entry:r=>"Entry-Level "+r,Junior:r=>"Junior "+r,Mid:r=>r,Senior:r=>"Senior "+r,Lead:r=>"Lead "+r,Manager:r=>r+" Manager",Director:r=>"Director of "+r,Executive:r=>"VP of "+r};
const employmentTypes: Job["type"][] = ["Full-time","Part-time","Contract","Temporary","Internship","Apprenticeship"];
export function generatePracticeJobs(count=10_000): Job[] {
 const target=Math.max(0,Math.floor(count)); const total=occupationFamilies.length*4;
 return Array.from({length:target},(_,index)=>{
  const familyIndex=index%total; const family=occupationFamilies[Math.floor(familyIndex/4)]!;
  const role=family.roles[familyIndex%4]!; const level=levels[Math.floor(index/total)%levels.length]!;
  const locIndex=Math.floor(index/(total*levels.length))%usLocations.length;
  const location=usLocations[(locIndex+familyIndex*7)%usLocations.length]!;
  const employer=employers[(familyIndex*7+Math.floor(index/(total*levels.length)))%employers.length]!;
  const remote:Job["remote"]=index%11===0?"Remote":index%5===0?"Hybrid":"On-site";
  const type=employmentTypes[(index+familyIndex)%employmentTypes.length]!;
  const base=family.baseSalary*multipliers[level]; const low=Math.round((base*(0.9+(familyIndex%4)*0.025))/1000)*1000;
  const high=Math.round((low*(1.18+(index%3)*0.04))/1000)*1000; const skill=family.skills;
  const required=level==="Entry"?[skill[0],skill[1],"Reliable communication and follow-through"]:
   level==="Executive"||level==="Director"||level==="Manager"?[skill[1],skill[2],"Team leadership","Planning and performance management"]:[skill[0],skill[1],skill[2],"Clear written and verbal communication"];
  const focus=family.focus.charAt(0).toUpperCase()+family.focus.slice(1);
  return {id:"practice-"+String(index+1).padStart(5,"0"),title:titleFor[level](role),employer:employer+" ("+family.industry+")",
   industry:family.industry,location,remote,type,level,salary:[low,Math.max(low+1000,high)],posted:"Sample posting",
   summary:"Simulated "+family.industry.toLowerCase()+" practice role. "+focus+". This fictional opening is designed for application and interview rehearsal.",
   responsibilities:["Coordinate "+family.focus+".","Use "+skill[(index+1)%4]+" to complete daily work and document outcomes.","Collaborate with teammates to resolve issues and meet service standards.",level==="Manager"||level==="Director"||level==="Executive"?"Set priorities, coach team members, and report progress against goals.":"Follow established procedures, identify process improvements, and escalate risks appropriately."],
   required,preferred:[skill[(index+2)%4],skill[(index+3)%4],"Experience with relevant industry tools"],
   difficulty:Math.min(5,Math.max(1,levels.indexOf(level)+1)),sourceType:"simulated" as const} satisfies Job;
 });
}
export const jobs: Job[] = [...curatedJobs,...generatePracticeJobs(10_000)];
export const industries = [...new Set(jobs.map((j)=>j.industry))];


export const SIMULATED_NOTICE = "Simulated sample data for practice — not verified live labor market data.";

export const insights = {
  skills: [
    { skill: "Communication", demand: 92 },
    { skill: "SQL / Data analysis", demand: 81 },
    { skill: "Customer service", demand: 78 },
    { skill: "Project coordination", demand: 70 },
    { skill: "Patient care", demand: 68 },
    { skill: "Cloud & DevOps", demand: 61 },
    { skill: "Equipment maintenance", demand: 55 },
  ],
  industries: [
    { name: "Healthcare", openings: 340, growth: 9 },
    { name: "Technology", openings: 280, growth: 6 },
    { name: "Logistics", openings: 190, growth: 5 },
    { name: "Retail", openings: 210, growth: 2 },
    { name: "Education", openings: 150, growth: 3 },
    { name: "Finance", openings: 120, growth: 4 },
    { name: "Manufacturing", openings: 160, growth: 4 },
  ],
  paths: [
    { from: "Customer Success Specialist", to: ["Account Manager", "Customer Success Manager", "Product Specialist"] },
    { from: "Medical Assistant", to: ["LPN", "Registered Nurse", "Clinic Coordinator"] },
    { from: "Warehouse Shift Lead", to: ["Operations Supervisor", "Logistics Analyst", "Site Manager"] },
    { from: "Data Analyst", to: ["Senior Analyst", "Analytics Engineer", "Data Scientist"] },
  ],
};

export const fmtSalary = ([a, b]: [number, number]) => `$${Math.round(a / 1000)}k – $${Math.round(b / 1000)}k`;
