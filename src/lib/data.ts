export type Job = {
  id: string;
  title: string;
  employer: string;
  industry: string;
  location: string;
  remote: "Remote" | "Hybrid" | "On-site";
  type: "Full-time" | "Part-time" | "Contract";
  level: "Entry" | "Mid" | "Senior";
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

export const jobs: Job[] = [
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

export const industries = [...new Set(jobs.map((j) => j.industry))];

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
