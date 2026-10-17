/**
 * National employment projections from the U.S. Bureau of Labor Statistics,
 * Employment Projections program, 2024–2034. These are projections, not live
 * vacancies. Refresh this curated snapshot when BLS releases new projections.
 * Source: https://www.bls.gov/opub/mlr/2026/article/industry-and-occupational-employment-projections-overview.htm
 */
export const outlookPeriod = "2024–2034";

export const highDemandJobs = [
  { title: "Wind turbine service technicians", growthPercent: 49.9, jobsAdded: 6800, category: "Renewable energy" },
  { title: "Solar photovoltaic installers", growthPercent: 42.1, jobsAdded: 12000, category: "Renewable energy" },
  { title: "Nurse practitioners", growthPercent: 40.1, jobsAdded: 128400, category: "Healthcare" },
  { title: "Data scientists", growthPercent: 33.5, jobsAdded: 82500, category: "Technology & analytics" },
  { title: "Information security analysts", growthPercent: 28.5, jobsAdded: 52100, category: "Cybersecurity" },
  { title: "Medical and health services managers", growthPercent: 23.2, jobsAdded: 142900, category: "Healthcare leadership" },
  { title: "Physical therapist assistants", growthPercent: 22.0, jobsAdded: 24500, category: "Healthcare" },
  { title: "Operations research analysts", growthPercent: 21.5, jobsAdded: 24100, category: "Analytics" },
] as const;

export const highDemandIndustries = [
  { title: "Healthcare and social assistance", growthPercent: 8.4, jobsAdded: 1982700 },
  { title: "Professional, scientific, and technical services", growthPercent: 7.5, jobsAdded: 812500 },
  { title: "Accommodation and food services", growthPercent: 3.9, jobsAdded: 553600 },
  { title: "Construction", growthPercent: 4.4, jobsAdded: 360500 },
  { title: "Finance and insurance", growthPercent: 3.4, jobsAdded: 226400 },
  { title: "Transportation and warehousing", growthPercent: 3.0, jobsAdded: 198800 },
  { title: "Information", growthPercent: 6.5, jobsAdded: 192300 },
  { title: "Management of companies and enterprises", growthPercent: 4.4, jobsAdded: 114900 },
] as const;
